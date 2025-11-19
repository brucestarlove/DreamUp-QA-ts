/**
 * Type definitions for Stagehand extensions
 * Fixes type casting issues by properly defining Playwright integration
 */

import type { Page, BrowserContext } from 'playwright';

declare module '@browserbasehq/stagehand' {
  interface Stagehand {
    /**
     * Playwright Page instance
     */
    page: Page;

    /**
     * Browser context
     */
    context: BrowserContext;

    /**
     * Metrics from Stagehand operations
     */
    metrics: Promise<{
      totalPromptTokens: number;
      totalCompletionTokens: number;
      totalTokens?: number;
    }>;

    /**
     * Initialize Stagehand
     */
    init(): Promise<void>;

    /**
     * Observe elements in the page
     */
    observe(
      instruction: string,
      options?: { timeout?: number }
    ): Promise<any[]>;

    /**
     * Execute an action
     */
    act(
      instruction: string | object,
      options?: { timeout?: number; modelName?: string }
    ): Promise<void>;

    /**
     * Extract structured data
     */
    extract<T>(
      instruction: string,
      schema: any,
      options?: { selector?: string; timeout?: number }
    ): Promise<T>;

    /**
     * Create an agent
     */
    agent(config: {
      cua?: boolean;
      model?: string | { modelName: string; apiKey: string };
      systemPrompt?: string;
    }): any;
  }
}
