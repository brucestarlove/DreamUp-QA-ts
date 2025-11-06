/**
 * Session Manager - Handles BrowserBase sessions and Stagehand initialization
 */

import { Stagehand } from '@browserbasehq/stagehand';
import { logger } from './utils/logger.js';
import type { Config } from './config.js';
import { retryWithBackoff, isRetryableError } from './utils/retry.js';
import { createIssue, classifyError, type Issue } from './utils/errors.js';

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
  private sessionState: 'idle' | 'loading' | 'active' | 'error' | 'closed' = 'idle';
  private issues: Issue[] = [];
  private consoleLogs: string[] = [];

  constructor(isHeadless: boolean = true) {
    this.isHeadless = isHeadless;
  }

  /**
   * Get current session state
   */
  getState(): 'idle' | 'loading' | 'active' | 'error' | 'closed' {
    return this.sessionState;
  }

  /**
   * Get collected issues
   */
  getIssues(): Issue[] {
    return [...this.issues];
  }

  /**
   * Set session state
   */
  private setState(newState: 'idle' | 'loading' | 'active' | 'error' | 'closed'): void {
    if (this.sessionState !== newState) {
      logger.debug(`Session state: ${this.sessionState} → ${newState}`);
      this.sessionState = newState;
    }
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
   * Load a game URL and return the page with retry logic
   */
  async loadGame(url: string, config: Config): Promise<SessionResult> {
    if (!this.stagehand) {
      await this.initialize();
    }

    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    this.setState('loading');
    logger.info(`Loading game URL: ${url}`);

    // Use stagehand.page (Playwright-compatible) - cast needed for TypeScript
    const page = (this.stagehand as any).page || this.stagehand.context.pages()[0];
    const context = this.stagehand.context;
    const retries = config.retries ?? 3;
    const loadTimeout = config.timeouts?.load ?? 30000;

    // Retry page load with exponential backoff
    try {
      await retryWithBackoff(
        async () => {
          // Navigate to the game URL
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeoutMs: loadTimeout,
          });

          logger.info('Page loaded successfully');
          this.setState('active');
          
          // Set up console log listeners
          this.setupConsoleListeners(page);

          // Verify page loaded (basic check for blank screen)
          const pageContent = await page.evaluate(() => {
            return document.body?.innerText?.length || 0;
          });

          if (pageContent === 0) {
            throw new Error('Page appears to be blank after load');
          }
        },
        {
          maxAttempts: retries + 1, // +1 for initial attempt
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          shouldRetry: (error) => {
            // Only retry on retryable errors (timeouts, network issues)
            return isRetryableError(error);
          },
        },
      );
    } catch (error) {
      this.setState('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Record load timeout issue
      const issueType = classifyError(errorObj, { isLoad: true });
      this.issues.push(createIssue(issueType, `Failed to load game URL after ${retries} retries: ${errorMessage}`));
      
      logger.error(`Failed to load game URL after ${retries} retries:`, error);

      // If headless fails, try headed mode
      if (this.isHeadless && issueType === 'load_timeout') {
        logger.warn('Headless mode failed, attempting headed fallback...');
        return this.loadGameHeaded(url, config);
      }

      throw error;
    }

    try {

      // Optional: Optimize DOM by hiding/removing non-essential elements
      // This can improve action reliability by reducing DOM noise
      // Phase 1: Basic implementation (can be enhanced in Phase 4)
      try {
        // Default selectors for common ad elements (always applied)
        const defaultHideSelectors = [
          'iframe[src*="ads"]',
          'iframe[src*="advertisement"]',
          'div[id*="ad"]',
          'div[class*="ad"]',
          'div[id*="advertisement"]',
          'div[class*="advertisement"]',
        ];

        // Merge default with config-provided selectors
        const hideSelectors = [
          ...defaultHideSelectors,
          ...(config.domOptimization?.hideSelectors || []),
        ];
        const removeSelectors = config.domOptimization?.removeSelectors || [];

        // Only run if there are selectors to process
        if (hideSelectors.length > defaultHideSelectors.length || removeSelectors.length > 0) {

          await page.evaluate(
            (args: { hide: string[]; remove: string[] }) => {
              // Code runs in browser context where document exists
              // Hide elements (preserves layout)
              args.hide.forEach((selector) => {
                try {
                  const elements = document.querySelectorAll(selector);
                  elements.forEach((el: Element) => {
                    // Element.style exists in browser context
                    (el as any).style.display = 'none';
                  });
                } catch (e) {
                  // Silently ignore selector errors
                }
              });

              // Remove elements completely (may affect layout)
              args.remove.forEach((selector) => {
                try {
                  const elements = document.querySelectorAll(selector);
                  elements.forEach((el: Element) => {
                    // Element.remove() exists in browser context
                    (el as any).remove();
                  });
                } catch (e) {
                  // Silently ignore selector errors
                }
              });
            },
            { hide: hideSelectors, remove: removeSelectors },
          );

          logger.debug(
            `DOM optimization applied (${hideSelectors.length} hide, ${removeSelectors.length} remove)`,
          );
        } else {
          // Always apply defaults even if no custom selectors
          await page.evaluate((hide: string[]) => {
            hide.forEach((selector) => {
              try {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el: Element) => {
                  (el as any).style.display = 'none';
                });
              } catch (e) {
                // Silently ignore selector errors
              }
            });
          }, defaultHideSelectors);
          logger.debug('DOM optimization applied (defaults only)');
        }
      } catch (error) {
        // Non-critical - continue even if DOM optimization fails
        logger.debug('DOM optimization skipped (non-critical)');
      }

      return {
        page,
        context,
        stagehand: this.stagehand,
      };
    } catch (error) {
      this.setState('error');
      logger.error('Failed during DOM optimization or page setup:', error);
      
      // Non-critical error, continue with page that was loaded
      return {
        page,
        context,
        stagehand: this.stagehand,
      };
    }
  }

  /**
   * Fallback to headed browser mode
   */
  private async loadGameHeaded(url: string, config: Config): Promise<SessionResult> {
    logger.info('Retrying with headed browser...');

    // Record headless incompatibility issue
    this.issues.push(
      createIssue(
        'headless_incompatibility',
        'Game failed to load in headless mode, falling back to headed mode',
      ),
    );

    // Close current session
    await this.cleanup();
    this.setState('idle');

    // Reinitialize with same settings (headed mode not configurable in Stagehand v3)
    // The retry may succeed due to timing or network recovery
    this.stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      verbose: 2,
      cacheDir: 'cache/qa-workflow-v1',
      model: 'openai/gpt-4o-mini',
    });

    await this.stagehand.init();
    this.setState('loading');

    const page = this.stagehand.context.pages()[0];
    const context = this.stagehand.context;

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeoutMs: config.timeouts?.load ?? 30000,
      });

      // Verify page loaded
      const pageContent = await page.evaluate(() => {
        return document.body?.innerText?.length || 0;
      });

      if (pageContent === 0) {
        throw new Error('Page appears to be blank after load in headed mode');
      }

      this.setState('active');
      logger.info('Page loaded successfully in headed mode');
      
      // Set up console log listeners
      this.setupConsoleListeners(page);

      return {
        page,
        context,
        stagehand: this.stagehand,
      };
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  /**
   * Get console logs from the page
   * Note: Console logs need to be captured during page lifecycle
   * For Phase 1, we'll return empty array - full console capture will be in Phase 3
   */
  async getConsoleLogs(page: ReturnType<Stagehand['context']['pages']>[0]): Promise<string[]> {
    return [...this.consoleLogs];
  }
  
  /**
   * Set up console log listeners using Playwright's event API
   */
  private setupConsoleListeners(page: ReturnType<Stagehand['context']['pages']>[0]): void {
    try {
      // stagehand.page is a Playwright Page object with all base methods available
      // Cast to access event listener methods
      const playwrightPage = page as any;
      
      // Check if page has the on() method
      if (typeof playwrightPage.on !== 'function') {
        logger.debug('Page object does not support event listeners');
        return;
      }
      
      // Listen for console messages
      playwrightPage.on('console', (msg: any) => {
        try {
          const type = msg.type();
          const text = msg.text();
          const timestamp = new Date().toISOString();
          const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${text}`;
          this.consoleLogs.push(logEntry);
          
          // Also log errors to our logger for visibility
          if (type === 'error') {
            logger.debug(`Console error: ${text}`);
          }
        } catch (error) {
          // Silent failure - don't spam logs
        }
      });
      
      // Listen for page errors
      playwrightPage.on('pageerror', (error: any) => {
        try {
          const timestamp = new Date().toISOString();
          const logEntry = `[${timestamp}] [PAGEERROR] ${error.message}\n${error.stack || ''}`;
          this.consoleLogs.push(logEntry);
          logger.debug(`Page error: ${error.message}`);
        } catch (err) {
          // Silent failure
        }
      });
      
      logger.debug('Console listeners set up successfully');
    } catch (error) {
      logger.debug('Console listener setup skipped:', error);
      // Non-critical - continue without console logging
    }
  }

  /**
   * Cleanup and close the session
   * Note: CDP transport closed errors are normal during cleanup - they indicate
   * the browser connection is closing gracefully.
   */
  async cleanup(): Promise<void> {
    if (this.stagehand && this.sessionState !== 'closed') {
      logger.info('Cleaning up session...');
      try {
        // Close browser context using Stagehand v3 API
        await this.stagehand.context.close();
        this.setState('closed');
      } catch (error) {
        logger.warn('Error during cleanup:', error);
        this.setState('error');
        
        // Detect browser crash errors
        if (error instanceof Error) {
          const issueType = classifyError(error);
          if (issueType === 'browser_crash') {
            this.issues.push(
              createIssue('browser_crash', 'Browser crashed during cleanup'),
            );
          }
        }
      } finally {
        this.stagehand = null;
      }
    }
  }
}

