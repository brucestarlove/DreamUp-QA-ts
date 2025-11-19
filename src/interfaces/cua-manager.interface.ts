/**
 * CUA Manager Interface
 * Defines the contract for Computer Use Agent management
 */

import type { CUAUsageMetrics } from '../cua.js';

export interface ICUAManager {
  /**
   * Initialize CUA agent
   */
  initialize(): Promise<void>;

  /**
   * Execute a CUA action
   */
  execute(instruction: string, maxSteps?: number, timeout?: number): Promise<any>;

  /**
   * Execute an autonomous agent task
   */
  executeAgent(instruction: string, maxSteps?: number, timeout?: number): Promise<any>;

  /**
   * Get usage metrics
   */
  getUsageMetrics(): CUAUsageMetrics;

  /**
   * Check if agent is initialized
   */
  isInitialized(): boolean;
}
