/**
 * Mock CUA Manager
 * Mock implementation for testing Computer Use Agent features
 */

import type { ICUAManager, CUAResult } from '../interfaces/cua-manager.interface.js';
import type { Stagehand } from '@browserbasehq/stagehand';

/**
 * Mock CUA Manager for testing
 */
export class MockCUAManager implements ICUAManager {
  private shouldFail: boolean;
  private failureMessage?: string;
  private actionsPerformed: Array<{ action: string; instruction: string }> = [];

  constructor(options: { shouldFail?: boolean; failureMessage?: string } = {}) {
    this.shouldFail = options.shouldFail ?? false;
    this.failureMessage = options.failureMessage;
  }

  /**
   * Perform mock CUA action
   */
  async performAction(
    stagehand: Stagehand,
    instruction: string,
    options?: { maxActions?: number }
  ): Promise<CUAResult> {
    if (this.shouldFail) {
      return {
        success: false,
        instruction,
        error: this.failureMessage || 'Mock CUA action failed',
        actionsPerformed: 0,
      };
    }

    // Record the action
    this.actionsPerformed.push({ action: 'act', instruction });

    // Simulate some delay
    await this.wait(50);

    const maxActions = options?.maxActions || 5;
    const performedActions = Math.min(3, maxActions); // Mock: perform 3 actions

    return {
      success: true,
      instruction,
      actionsPerformed: performedActions,
      result: `Mock CUA completed: ${instruction}`,
    };
  }

  /**
   * Perform mock observation
   */
  async observe(stagehand: Stagehand, instruction?: string): Promise<string> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage || 'Mock observation failed');
    }

    const observationInstruction = instruction || 'observe the page';
    this.actionsPerformed.push({ action: 'observe', instruction: observationInstruction });

    await this.wait(30);

    return `Mock observation: ${observationInstruction}. The page shows mock content.`;
  }

  /**
   * Get actions performed (for testing)
   */
  getActionsPerformed(): Array<{ action: string; instruction: string }> {
    return [...this.actionsPerformed];
  }

  /**
   * Set failure mode (for testing)
   */
  setFailureMode(shouldFail: boolean, message?: string): void {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }

  /**
   * Clear actions history (for testing)
   */
  clearHistory(): void {
    this.actionsPerformed = [];
  }

  /**
   * Check if CUA is available (always true for mock)
   */
  isAvailable(): boolean {
    return !this.shouldFail;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a mock CUA manager
 */
export function createMockCUAManager(options?: {
  shouldFail?: boolean;
  failureMessage?: string;
}): MockCUAManager {
  return new MockCUAManager(options);
}
