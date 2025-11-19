/**
 * Mock Session Manager
 * Mock implementation for testing without real browser sessions
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type {
  ISessionManager,
  SessionState,
  SessionResult,
} from '../interfaces/session-manager.interface.js';
import type { Config } from '../config.js';
import type { Issue } from '../utils/errors.js';
import { createIssue } from '../utils/errors.js';

/**
 * Mock Stagehand instance for testing
 */
export class MockStagehand {
  page: any;
  context: any;
  metrics: Promise<any>;

  constructor() {
    this.page = {
      url: () => 'https://example.com',
      screenshot: async () => Buffer.from('mock-screenshot'),
      goto: async (url: string) => ({ url }),
      waitForLoadState: async () => {},
      evaluate: async (fn: any) => fn(),
      on: () => {},
      removeAllListeners: () => {},
    };

    this.context = {
      pages: () => [this.page],
      close: async () => {},
    };

    this.metrics = Promise.resolve({
      totalPromptTokens: 100,
      totalCompletionTokens: 50,
      totalTokens: 150,
    });
  }

  async init() {
    return this;
  }

  async act(options: any) {
    return { success: true, action: options.action };
  }

  async observe(options: any) {
    return `Observed: ${options?.instruction || 'page content'}`;
  }

  async extract(options: any) {
    return { data: 'mock-extracted-data' };
  }

  async close() {}
}

/**
 * Mock Session Manager for testing
 */
export class MockSessionManager implements ISessionManager {
  private state: SessionState = 'idle';
  private issues: Issue[] = [];
  private mockStagehand?: MockStagehand;
  private shouldFail: boolean;
  private failureMessage?: string;

  constructor(options: { shouldFail?: boolean; failureMessage?: string } = {}) {
    this.shouldFail = options.shouldFail ?? false;
    this.failureMessage = options.failureMessage;
  }

  /**
   * Initialize mock session
   */
  async initialize(): Promise<Stagehand> {
    if (this.shouldFail) {
      this.state = 'failed';
      throw new Error(this.failureMessage || 'Mock session initialization failed');
    }

    this.state = 'initializing';
    this.mockStagehand = new MockStagehand();
    await this.mockStagehand.init();
    this.state = 'ready';

    return this.mockStagehand as any;
  }

  /**
   * Load mock game
   */
  async loadGame(url: string, config: Config): Promise<SessionResult> {
    if (this.shouldFail) {
      this.state = 'failed';
      this.issues.push(createIssue('load_failed', this.failureMessage || 'Mock load failed'));
      return {
        success: false,
        url,
        loadTime: 0,
      };
    }

    this.state = 'loading';

    // Simulate load time
    await this.wait(100);

    this.state = 'loaded';

    return {
      success: true,
      url,
      loadTime: 100,
    };
  }

  /**
   * Get mock console logs
   */
  async getConsoleLogs(page: any): Promise<string[]> {
    return [
      '[INFO] Mock console log 1',
      '[WARN] Mock console log 2',
      '[ERROR] Mock console log 3',
    ];
  }

  /**
   * Get current state
   */
  getState(): SessionState {
    return this.state;
  }

  /**
   * Get issues
   */
  getIssues(): Issue[] {
    return [...this.issues];
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.mockStagehand) {
      await this.mockStagehand.close();
    }
    this.state = 'idle';
  }

  /**
   * Add a mock issue (for testing)
   */
  addMockIssue(issue: Issue): void {
    this.issues.push(issue);
  }

  /**
   * Set failure mode (for testing)
   */
  setFailureMode(shouldFail: boolean, message?: string): void {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }

  /**
   * Get mock stagehand instance
   */
  getMockStagehand(): MockStagehand | undefined {
    return this.mockStagehand;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a mock session manager
 */
export function createMockSessionManager(options?: {
  shouldFail?: boolean;
  failureMessage?: string;
}): MockSessionManager {
  return new MockSessionManager(options);
}
