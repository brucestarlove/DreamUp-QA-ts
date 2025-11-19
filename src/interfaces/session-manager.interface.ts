/**
 * Session Manager Interface
 * Defines the contract for browser session management
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { Config } from '../config.js';
import type { Issue } from '../utils/errors.js';

export interface SessionResult {
  page: ReturnType<Stagehand['context']['pages']>[0];
  context: Stagehand['context'];
  stagehand: Stagehand;
}

export type SessionState = 'idle' | 'loading' | 'active' | 'error' | 'closed';

export interface ISessionManager {
  /**
   * Initialize Stagehand with BrowserBase
   */
  initialize(): Promise<Stagehand>;

  /**
   * Load a game URL and return the session
   */
  loadGame(url: string, config: Config): Promise<SessionResult>;

  /**
   * Get console logs from the page
   */
  getConsoleLogs(page: ReturnType<Stagehand['context']['pages']>[0]): Promise<string[]>;

  /**
   * Get current session state
   */
  getState(): SessionState;

  /**
   * Get collected issues
   */
  getIssues(): Issue[];

  /**
   * Cleanup and close the session
   */
  cleanup(): Promise<void>;
}
