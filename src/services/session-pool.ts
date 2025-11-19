/**
 * Session Pool Manager
 * Manages a pool of browser sessions for scalability and performance
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import { Stagehand as StagehandClass } from '@browserbasehq/stagehand';
import { createLogger } from '../observability/structured-logger.js';
import { SessionInitializationError } from '../errors/custom-errors.js';

const logger = createLogger({ service: 'SessionPool' });

export interface PooledSession {
  id: string;
  stagehand: Stagehand;
  createdAt: Date;
  lastUsedAt: Date;
  usageCount: number;
  inUse: boolean;
  healthy: boolean;
}

export interface SessionPoolOptions {
  minSize?: number;
  maxSize?: number;
  maxIdleTime?: number; // ms
  maxSessionAge?: number; // ms
  maxUsageCount?: number; // max uses before recreating
  healthCheckInterval?: number; // ms
  headless?: boolean;
}

export interface SessionPoolStats {
  totalSessions: number;
  availableSessions: number;
  inUseSessions: number;
  totalAcquired: number;
  totalReleased: number;
  totalCreated: number;
  totalDestroyed: number;
}

/**
 * Session Pool for managing browser sessions
 */
export class SessionPool {
  private sessions = new Map<string, PooledSession>();
  private options: Required<SessionPoolOptions>;
  private nextSessionId = 1;
  private healthCheckTimer?: NodeJS.Timeout;
  private stats: SessionPoolStats = {
    totalSessions: 0,
    availableSessions: 0,
    inUseSessions: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    totalDestroyed: 0,
  };

  constructor(options: SessionPoolOptions = {}) {
    this.options = {
      minSize: options.minSize ?? 0,
      maxSize: options.maxSize ?? 5,
      maxIdleTime: options.maxIdleTime ?? 5 * 60 * 1000, // 5 minutes
      maxSessionAge: options.maxSessionAge ?? 30 * 60 * 1000, // 30 minutes
      maxUsageCount: options.maxUsageCount ?? 10,
      healthCheckInterval: options.healthCheckInterval ?? 60 * 1000, // 1 minute
      headless: options.headless ?? true,
    };

    logger.info('Session pool initialized', {
      minSize: this.options.minSize,
      maxSize: this.options.maxSize,
      maxIdleTime: this.options.maxIdleTime,
      maxSessionAge: this.options.maxSessionAge,
    });

    // Start health check timer
    this.startHealthChecks();

    // Pre-warm pool with minimum sessions
    this.warmPool();
  }

  /**
   * Acquire a session from the pool
   */
  async acquire(): Promise<Stagehand> {
    logger.debug('Acquiring session from pool');

    // Try to find an available healthy session
    const available = this.findAvailableSession();

    if (available) {
      available.inUse = true;
      available.lastUsedAt = new Date();
      available.usageCount++;
      this.stats.totalAcquired++;
      this.updateStats();

      logger.debug('Reusing existing session', {
        sessionId: available.id,
        usageCount: available.usageCount,
      });

      return available.stagehand;
    }

    // No available session, create a new one if under max size
    if (this.sessions.size < this.options.maxSize) {
      const session = await this.createSession();
      session.inUse = true;
      this.stats.totalAcquired++;
      this.updateStats();

      logger.info('Created new session', {
        sessionId: session.id,
        poolSize: this.sessions.size,
      });

      return session.stagehand;
    }

    // Pool is full, wait for a session to become available
    logger.warn('Pool exhausted, waiting for available session', {
      poolSize: this.sessions.size,
      maxSize: this.options.maxSize,
    });

    // Wait and retry (with exponential backoff)
    await this.wait(1000);
    return this.acquire(); // Recursive retry
  }

  /**
   * Release a session back to the pool
   */
  async release(stagehand: Stagehand): Promise<void> {
    const session = this.findSessionByStagehand(stagehand);

    if (!session) {
      logger.warn('Attempted to release unknown session');
      return;
    }

    logger.debug('Releasing session', { sessionId: session.id });

    session.inUse = false;
    session.lastUsedAt = new Date();
    this.stats.totalReleased++;
    this.updateStats();

    // Check if session should be destroyed
    const shouldDestroy =
      session.usageCount >= this.options.maxUsageCount ||
      Date.now() - session.createdAt.getTime() >= this.options.maxSessionAge ||
      !session.healthy;

    if (shouldDestroy) {
      logger.info('Destroying session (exceeded limits)', {
        sessionId: session.id,
        usageCount: session.usageCount,
        age: Date.now() - session.createdAt.getTime(),
        healthy: session.healthy,
      });
      await this.destroySession(session.id);
    }
  }

  /**
   * Create a new session
   */
  private async createSession(): Promise<PooledSession> {
    const id = `session-${this.nextSessionId++}`;

    try {
      logger.debug('Creating new browser session', { sessionId: id });

      const stagehand = new StagehandClass({
        env: 'BROWSERBASE',
        headless: this.options.headless,
        enableCaching: true,
      });

      await stagehand.init();

      const session: PooledSession = {
        id,
        stagehand,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        usageCount: 0,
        inUse: false,
        healthy: true,
      };

      this.sessions.set(id, session);
      this.stats.totalCreated++;
      this.stats.totalSessions = this.sessions.size;

      logger.info('Browser session created', { sessionId: id });

      return session;
    } catch (error) {
      logger.error('Failed to create session', { sessionId: id, error });
      throw new SessionInitializationError(
        `Failed to create pooled session: ${error instanceof Error ? error.message : String(error)}`,
        { sessionId: id, originalError: error }
      );
    }
  }

  /**
   * Destroy a session
   */
  private async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      logger.warn('Session not found for destruction', { sessionId });
      return;
    }

    try {
      logger.debug('Destroying session', { sessionId });

      // Close the browser
      if (session.stagehand?.context) {
        await session.stagehand.context.close();
      }

      this.sessions.delete(sessionId);
      this.stats.totalDestroyed++;
      this.stats.totalSessions = this.sessions.size;
      this.updateStats();

      logger.info('Session destroyed', { sessionId });
    } catch (error) {
      logger.error('Error destroying session', { sessionId, error });
      // Remove from pool anyway
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Find an available session
   */
  private findAvailableSession(): PooledSession | undefined {
    for (const session of this.sessions.values()) {
      if (!session.inUse && session.healthy) {
        // Check if session hasn't been idle too long
        const idleTime = Date.now() - session.lastUsedAt.getTime();
        if (idleTime < this.options.maxIdleTime) {
          return session;
        }
      }
    }
    return undefined;
  }

  /**
   * Find session by stagehand instance
   */
  private findSessionByStagehand(stagehand: Stagehand): PooledSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.stagehand === stagehand) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Health check for all sessions
   */
  private async healthCheck(): Promise<void> {
    logger.debug('Running health check on pool');

    const now = Date.now();
    const sessionsToDestroy: string[] = [];

    for (const session of this.sessions.values()) {
      // Skip sessions in use
      if (session.inUse) continue;

      // Check idle time
      const idleTime = now - session.lastUsedAt.getTime();
      if (idleTime >= this.options.maxIdleTime) {
        logger.debug('Session exceeded idle time', {
          sessionId: session.id,
          idleTime,
        });
        sessionsToDestroy.push(session.id);
        continue;
      }

      // Check session age
      const age = now - session.createdAt.getTime();
      if (age >= this.options.maxSessionAge) {
        logger.debug('Session exceeded max age', { sessionId: session.id, age });
        sessionsToDestroy.push(session.id);
        continue;
      }

      // Check health (basic check: can we access the context?)
      try {
        if (!session.stagehand?.context) {
          session.healthy = false;
          sessionsToDestroy.push(session.id);
        }
      } catch (error) {
        session.healthy = false;
        sessionsToDestroy.push(session.id);
      }
    }

    // Destroy unhealthy/old sessions
    for (const sessionId of sessionsToDestroy) {
      await this.destroySession(sessionId);
    }

    // Maintain minimum pool size
    await this.warmPool();
  }

  /**
   * Pre-warm pool with minimum sessions
   */
  private async warmPool(): Promise<void> {
    const needed = this.options.minSize - this.sessions.size;

    if (needed > 0) {
      logger.debug('Warming pool', { needed, current: this.sessions.size });

      const promises = [];
      for (let i = 0; i < needed; i++) {
        promises.push(this.createSession());
      }

      await Promise.all(promises);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.healthCheck().catch((error) => {
        logger.error('Health check failed', { error });
      });
    }, this.options.healthCheckInterval);
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    let available = 0;
    let inUse = 0;

    for (const session of this.sessions.values()) {
      if (session.inUse) {
        inUse++;
      } else if (session.healthy) {
        available++;
      }
    }

    this.stats.availableSessions = available;
    this.stats.inUseSessions = inUse;
    this.stats.totalSessions = this.sessions.size;
  }

  /**
   * Get pool statistics
   */
  getStats(): SessionPoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Shutdown the pool and cleanup all sessions
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down session pool');

    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Destroy all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }

    logger.info('Session pool shutdown complete');
  }

  /**
   * Wait helper
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a session pool with default or custom options
 */
export function createSessionPool(options?: SessionPoolOptions): SessionPool {
  return new SessionPool(options);
}
