/**
 * Session Manager - Handles BrowserBase sessions and Stagehand initialization
 */

import { Stagehand } from '@browserbasehq/stagehand';
import { logger } from './utils/logger.js';
import type { Config } from './config.js';

export interface SessionResult {
  page: ReturnType<Stagehand['context']['pages']>[0];
  context: Stagehand['context'];
  stagehand: Stagehand;
}

/**
 * Initialize and manage a browser session with Stagehand
 */
export class SessionManager {
  private stagehand: Stagehand | null = null;
  private isHeadless: boolean;

  constructor(isHeadless: boolean = true) {
    this.isHeadless = isHeadless;
  }

  /**
   * Initialize Stagehand with BrowserBase environment
   */
  async initialize(): Promise<Stagehand> {
    logger.info('Initializing Stagehand with BrowserBase...');

    try {
      this.stagehand = new Stagehand({
        env: 'BROWSERBASE',
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        verbose: 2, // Enable verbose logging
        cacheDir: 'cache/qa-workflow-v1', // Deterministic caching
        model: 'openai/gpt-4o-mini', // Default model, can be overridden
      });

      await this.stagehand.init();
      logger.info('Stagehand initialized successfully');

      return this.stagehand;
    } catch (error) {
      logger.error('Failed to initialize Stagehand:', error);
      throw new Error(`Session initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a game URL and return the page
   */
  async loadGame(url: string, config: Config): Promise<SessionResult> {
    if (!this.stagehand) {
      await this.initialize();
    }

    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    logger.info(`Loading game URL: ${url}`);

    const page = this.stagehand.context.pages()[0];
    const context = this.stagehand.context;

    try {
      // Navigate to the game URL
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeoutMs: config.timeouts?.load ?? 30000,
      });

      logger.info('Page loaded successfully');

      // Capture baseline screenshot after load
      // This will be handled by the capture manager, but we ensure page is ready

      return {
        page,
        context,
        stagehand: this.stagehand,
      };
    } catch (error) {
      logger.error('Failed to load game URL:', error);

      // If headless fails, try headed mode
      if (this.isHeadless) {
        logger.warn('Headless mode failed, attempting headed fallback...');
        return this.loadGameHeaded(url, config);
      }

      throw error;
    }
  }

  /**
   * Fallback to headed browser mode
   */
  private async loadGameHeaded(url: string, config: Config): Promise<SessionResult> {
    logger.info('Retrying with headed browser...');

    // Close current session
    await this.cleanup();

    // Reinitialize with headed mode (would need to check Stagehand API for this)
    // For now, we'll retry with same settings
    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      verbose: 2,
      cacheDir: 'cache/qa-workflow-v1',
      model: 'openai/gpt-4o-mini',
    });

    await this.stagehand.init();

    const page = this.stagehand.context.pages()[0];
    const context = this.stagehand.context;

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeoutMs: config.timeouts?.load ?? 30000,
    });

    return {
      page,
      context,
      stagehand: this.stagehand,
    };
  }

  /**
   * Get console logs from the page
   * Note: Console logs need to be captured during page lifecycle
   * For Phase 1, we'll return empty array - full console capture will be in Phase 3
   */
  async getConsoleLogs(page: ReturnType<Stagehand['context']['pages']>[0]): Promise<string[]> {
    // TODO: Implement proper console log capture in Phase 3
    // Stagehand pages are Playwright-compatible, but console event listeners
    // need to be set up before navigation, not after
    logger.debug('Console log capture not yet implemented (Phase 3)');
    return [];
  }

  /**
   * Cleanup and close the session
   */
  async cleanup(): Promise<void> {
    if (this.stagehand) {
      logger.info('Cleaning up session...');
      try {
        // Close browser context using Stagehand v3 API
        await this.stagehand.context.close();
      } catch (error) {
        logger.warn('Error during cleanup:', error);
      }
      this.stagehand = null;
    }
  }
}

