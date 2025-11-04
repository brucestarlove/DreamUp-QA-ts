/**
 * Computer Use Agent (CUA) Manager
 * Handles CUA agent lifecycle and tracks usage metrics
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import { logger } from './utils/logger.js';
import type { Config } from './config.js';

export interface CUAOptions {
  model?: string;
  maxSteps?: number;
  systemPrompt?: string;
}

export interface CUAUsageMetrics {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCost: number; // USD
}

/**
 * Calculate estimated cost for OpenAI computer-use-preview model
 * Note: These are approximate prices, actual pricing may vary
 * OpenAI computer-use-preview pricing (as of 2024):
 * - Input: ~$0.01 per 1K tokens
 * - Output: ~$0.03 per 1K tokens
 */
function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  if (!model.includes('openai')) {
    // Default to OpenAI pricing for now, can be extended for other models
    return 0;
  }

  // OpenAI computer-use-preview approximate pricing (update as needed)
  const INPUT_PRICE_PER_1K = 0.01; // $0.01 per 1K input tokens
  const OUTPUT_PRICE_PER_1K = 0.03; // $0.03 per 1K output tokens

  const inputCost = (inputTokens / 1000) * INPUT_PRICE_PER_1K;
  const outputCost = (outputTokens / 1000) * OUTPUT_PRICE_PER_1K;
  
  return inputCost + outputCost;
}

export class CUAManager {
  private agent: any = null; // Stagehand Agent type
  private stagehand: Stagehand;
  private config: CUAOptions;
  private usage: CUAUsageMetrics = {
    totalCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };

  constructor(stagehand: Stagehand, config: CUAOptions) {
    this.stagehand = stagehand;
    this.config = config;
  }

  /**
   * Initialize CUA agent if not already initialized
   */
  async initialize(): Promise<void> {
    if (this.agent) {
      return; // Already initialized
    }

    const model = this.config.model || 'openai/computer-use-preview';
    const systemPrompt =
      this.config.systemPrompt ||
    'You are testing a browser game. Interact with game elements precisely based on visual cues. Click on the exact visual elements described.';

    logger.info(`Initializing CUA agent with model: ${model}`);

    // Check for API key in environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (model.includes('openai')) {
      if (!openaiApiKey) {
        logger.warn('OPENAI_API_KEY not found in environment variables');
        logger.warn('Please set OPENAI_API_KEY in your environment or .env file');
        // Try to give helpful debugging info
        logger.debug(`Available env vars: ${Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')).join(', ') || 'none'}`);
      } else {
        logger.debug(`OPENAI_API_KEY found: ${openaiApiKey.substring(0, 10)}...`);
      }
    }

    try {
      // Configure model with explicit API key - required for OpenAI CUA models
      const modelConfig = model.includes('openai')
        ? (openaiApiKey
            ? {
                modelName: model,
                apiKey: openaiApiKey,
              }
            : model) // If no key, try string format (may fail, but gives better error)
        : model; // For non-OpenAI models, use string format

      this.agent = this.stagehand.agent({
        cua: true,
        model: modelConfig,
        systemPrompt: systemPrompt,
      });

      logger.info('CUA agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CUA agent:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Provide helpful error message if API key is missing
      if (!openaiApiKey && model.includes('openai')) {
        throw new Error(
          `CUA initialization failed: OPENAI_API_KEY not found in environment variables. Please set OPENAI_API_KEY. Error: ${errorMessage}`,
        );
      }
      
      throw new Error(`CUA initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Execute a CUA action and track usage metrics
   */
  async execute(instruction: string, maxSteps?: number, timeout?: number): Promise<any> {
    await this.initialize(); // Ensure agent is initialized

    const steps = maxSteps || this.config.maxSteps || 3;
    const actionTimeout = timeout || 30000; // Default 30 second timeout per action
    logger.debug(`CUA executing: "${instruction}" (maxSteps: ${steps}, timeout: ${actionTimeout}ms)`);

    try {
      // Make instruction more explicit - single click action, not a loop
      const explicitInstruction = instruction.includes('click')
        ? `${instruction}. This is a single click action. Click once and stop immediately.`
        : instruction;

      // Execute agent - use AbortController for proper cleanup
      let timeoutId: NodeJS.Timeout | null = null;
      let isResolved = false;
      let resolvedResult: any = null;

      const executePromise = this.agent.execute({
        instruction: explicitInstruction,
        maxSteps: steps,
      }).then((result: any) => {
        isResolved = true;
        resolvedResult = result;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        return result;
      });

      // Add timeout protection with early success detection
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            reject(new Error(`CUA execution timed out after ${actionTimeout}ms`));
          }
        }, actionTimeout);
      });

      // Race between execution and timeout
      let result: any;
      try {
        result = await Promise.race([executePromise, timeoutPromise]);
      } catch (error) {
        // If timeout rejected but we actually succeeded, return the result
        if (isResolved && resolvedResult) {
          logger.debug('CUA execution succeeded but timeout was triggered, returning result anyway');
          result = resolvedResult;
        } else {
          // Clean up timeout if still pending
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          throw error;
        }
      } finally {
        // Ensure timeout is always cleared
        if (timeoutId && !isResolved) {
          clearTimeout(timeoutId);
        }
      }

      // Extract usage metrics from result if available
      if (result && typeof result === 'object') {
        // Check for usage in result (Stagehand may provide this)
        const usage = (result as any).usage;
        if (usage) {
          const inputTokens = usage.inputTokens || usage.promptTokens || 0;
          const outputTokens = usage.outputTokens || usage.completionTokens || 0;
          const totalTokens = usage.totalTokens || inputTokens + outputTokens;

          this.usage.totalCalls += 1;
          this.usage.totalInputTokens += inputTokens;
          this.usage.totalOutputTokens += outputTokens;
          this.usage.totalTokens += totalTokens;

          // Calculate cost based on model
          const model = this.config.model || 'openai/computer-use-preview';
          const cost = calculateCost(inputTokens, outputTokens, model);
          this.usage.estimatedCost += cost;

          logger.debug(
            `CUA usage: ${inputTokens} input + ${outputTokens} output = ${totalTokens} total tokens ($${cost.toFixed(4)})`,
          );
        } else {
          // If usage not provided, estimate based on instruction length
          // This is a rough estimate - actual tokens will be higher due to screenshots
          const estimatedInputTokens = Math.ceil(instruction.length / 4) + 2000; // ~2000 for screenshot context
          const estimatedOutputTokens = 100; // Rough estimate for action response
          const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

          this.usage.totalCalls += 1;
          this.usage.totalInputTokens += estimatedInputTokens;
          this.usage.totalOutputTokens += estimatedOutputTokens;
          this.usage.totalTokens += estimatedTotalTokens;

          const model = this.config.model || 'openai/computer-use-preview';
          const cost = calculateCost(estimatedInputTokens, estimatedOutputTokens, model);
          this.usage.estimatedCost += cost;

          logger.debug(
            `CUA usage (estimated): ${estimatedInputTokens} input + ${estimatedOutputTokens} output = ${estimatedTotalTokens} total tokens ($${cost.toFixed(4)})`,
          );
        }
      } else {
        // No usage data available, still track the call
        this.usage.totalCalls += 1;
        logger.debug('CUA execution completed but usage metrics not available');
      }

      // Check if result indicates completion
      const message = result?.message || '';
      const success = result?.success !== false; // Assume success unless explicitly false
      
      logger.debug(`CUA execution completed. Success: ${success}, Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      
      // Early exit if agent reports success - don't wait for remaining steps
      if (success || message.toLowerCase().includes('done') || message.toLowerCase().includes('complete') || 
          message.toLowerCase().includes('successfully') || message.toLowerCase().includes('clicked')) {
        logger.debug('CUA agent reported completion/success, returning result');
        return result;
      }
      
      // Otherwise return result anyway (may have completed even without explicit success flag)
      return result;
    } catch (error) {
      // Handle timeout separately
      if (error instanceof Error && error.message.includes('timed out')) {
        logger.warn(`CUA execution timed out after ${actionTimeout}ms`);
        throw error;
      }
      
      logger.error(`CUA execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get usage metrics
   */
  getUsageMetrics(): CUAUsageMetrics {
    return { ...this.usage };
  }

  /**
   * Check if agent is initialized
   */
  isInitialized(): boolean {
    return this.agent !== null;
  }
}

