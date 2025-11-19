/**
 * Mock Progress Reporter
 * Mock implementation for testing progress reporting
 */

import type { IProgressReporter } from '../interfaces/progress-reporter.interface.js';

export interface ProgressEvent {
  type: 'start' | 'succeed' | 'fail' | 'warn' | 'info' | 'update';
  message: string;
  timestamp: Date;
}

/**
 * Mock Progress Reporter for testing
 */
export class MockProgressReporter implements IProgressReporter {
  private events: ProgressEvent[] = [];
  private verbose: boolean;

  constructor(options: { verbose?: boolean } = {}) {
    this.verbose = options.verbose ?? false;
  }

  /**
   * Start operation
   */
  start(message: string): void {
    const event: ProgressEvent = {
      type: 'start',
      message,
      timestamp: new Date(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.log(`[START] ${message}`);
    }
  }

  /**
   * Mark as succeeded
   */
  succeed(message: string): void {
    const event: ProgressEvent = {
      type: 'succeed',
      message,
      timestamp: new Date(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.log(`[SUCCESS] ${message}`);
    }
  }

  /**
   * Mark as failed
   */
  fail(message: string): void {
    const event: ProgressEvent = {
      type: 'fail',
      message,
      timestamp: new Date(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.error(`[FAIL] ${message}`);
    }
  }

  /**
   * Warning message
   */
  warn(message: string): void {
    const event: ProgressEvent = {
      type: 'warn',
      message,
      timestamp: new Date(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Info message
   */
  info(message: string): void {
    const event: ProgressEvent = {
      type: 'info',
      message,
      timestamp: new Date(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.info(`[INFO] ${message}`);
    }
  }

  /**
   * Update message
   */
  update(message: string): void {
    const event: ProgressEvent = {
      type: 'update',
      message,
      timestamp: new Date(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.log(`[UPDATE] ${message}`);
    }
  }

  /**
   * Get all events (for testing)
   */
  getEvents(): ProgressEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type (for testing)
   */
  getEventsByType(type: ProgressEvent['type']): ProgressEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get last event (for testing)
   */
  getLastEvent(): ProgressEvent | undefined {
    return this.events[this.events.length - 1];
  }

  /**
   * Clear events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Get event count (for testing)
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Check if message was reported (for testing)
   */
  hasMessage(message: string): boolean {
    return this.events.some((e) => e.message.includes(message));
  }

  /**
   * Check if succeeded (for testing)
   */
  hasSucceeded(): boolean {
    return this.events.some((e) => e.type === 'succeed');
  }

  /**
   * Check if failed (for testing)
   */
  hasFailed(): boolean {
    return this.events.some((e) => e.type === 'fail');
  }
}

/**
 * Create a mock progress reporter
 */
export function createMockProgressReporter(options?: {
  verbose?: boolean;
}): MockProgressReporter {
  return new MockProgressReporter(options);
}
