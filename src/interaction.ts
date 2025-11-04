/**
 * Interaction Engine - Executes actions from config sequence
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { SequenceStep, Config } from './config.js';
import { logger } from './utils/logger.js';
import { sleep } from './utils/time.js';
import { retryWithBackoff, isRetryableError } from './utils/retry.js';
import { classifyError } from './utils/errors.js';

export interface ActionResult {
  success: boolean;
  error?: string;
  actionIndex: number;
}

/**
 * Execute a single action from the sequence with retry logic
 */
export async function executeAction(
  stagehand: Stagehand,
  step: SequenceStep,
  actionIndex: number,
  config: Config,
): Promise<ActionResult> {
  const timeout = config.timeouts?.action ?? 10000;
  const actionRetries = config.actionRetries ?? 2;

  // Validate and sanitize inputs
  if ('action' in step && step.action === 'press') {
    // Clamp repeat count to prevent runaway loops
    if (step.repeat !== undefined && step.repeat > 100) {
      logger.warn(`Clamping repeat count from ${step.repeat} to 100`);
      step.repeat = 100;
    }
    // Validate key name
    if (!step.key || step.key.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid key name for press action',
        actionIndex,
      };
    }
  }

  // Use retry logic for actions that can fail
  try {
    return await retryWithBackoff(
      async () => {
        logger.info(`Executing action ${actionIndex + 1}: ${JSON.stringify(step)}`);

        // Handle different action types
        if ('wait' in step) {
          // Wait action - no retry needed
          await sleep(step.wait);
          return { success: true, actionIndex };
        }

        if ('action' in step) {
          switch (step.action) {
            case 'click': {
              // Click action - use observe→act pattern for better reliability
              try {
                // First, try to observe the element
                const actions = await Promise.race([
                  stagehand.observe(`find the ${step.target}`),
                  new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Observe timeout')), timeout),
                  ),
                ]);

                if (actions && actions.length > 0) {
                  // Use cached action (no new LLM call)
                  await Promise.race([
                    stagehand.act(actions[0]),
                    new Promise<never>((_, reject) =>
                      setTimeout(() => reject(new Error('Act timeout')), timeout),
                    ),
                  ]);
                } else {
                  // Fallback to direct act
                  await Promise.race([
                    stagehand.act(`click the ${step.target}`),
                    new Promise<never>((_, reject) =>
                      setTimeout(() => reject(new Error('Act timeout')), timeout),
                    ),
                  ]);
                }
              } catch (error) {
                // Fallback to direct act if observe fails
                logger.warn(`Observe failed, falling back to direct act: ${error}`);
                await Promise.race([
                  stagehand.act(`click the ${step.target}`),
                  new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Act timeout')), timeout),
                  ),
                ]);
              }
              return { success: true, actionIndex };
            }

            case 'press': {
              // Press key action - use Stagehand's act method for keypress
              // Clamp repeat count (already validated above)
              const repeat = Math.min(step.repeat ?? 1, 100);

              for (let i = 0; i < repeat; i++) {
                // Use act() with natural language for keypress
                await Promise.race([
                  stagehand.act(`press the ${step.key} key`, { timeout }),
                  new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Press timeout')), timeout),
                  ),
                ]);
                // Small delay between key presses
                if (i < repeat - 1) {
                  await sleep(50);
                }
              }

              return { success: true, actionIndex };
            }

            case 'screenshot': {
              // Screenshot action - this is handled by capture manager
              // Just return success, actual screenshot is taken elsewhere
              logger.debug('Screenshot action triggered (handled by capture manager)');
              return { success: true, actionIndex };
            }

            default:
              throw new Error(`Unknown action type: ${(step as { action: string }).action}`);
          }
        }

        throw new Error('Unknown step format');
      },
      {
        maxAttempts: actionRetries + 1, // +1 for initial attempt
        baseDelayMs: 500,
        maxDelayMs: 5000,
        shouldRetry: (error) => {
          // Only retry on retryable errors (timeouts, network issues)
          return isRetryableError(error);
        },
      },
    );
  } catch (error) {
    logger.error(`Action ${actionIndex + 1} failed after retries:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const issueType = classifyError(error, { isAction: true });
    
    return {
      success: false,
      error: `${issueType}: ${errorMessage}`,
      actionIndex,
    };
  }
}

/**
 * Execute the entire sequence of actions with global timeout enforcement
 */
export async function executeSequence(
  stagehand: Stagehand,
  config: Config,
  startTime: number,
  onActionComplete?: (result: ActionResult) => void,
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  const maxSteps = 100; // As per user's change
  const totalTimeout = config.timeouts?.total ?? 60000; // Default: 1 minute

  if (config.sequence.length > maxSteps) {
    logger.warn(`Sequence length (${config.sequence.length}) exceeds max steps (${maxSteps}), truncating`);
  }

  const sequence = config.sequence.slice(0, maxSteps);

  for (let i = 0; i < sequence.length; i++) {
    // Check total timeout before each action
    const elapsed = Date.now() - startTime;
    if (elapsed >= totalTimeout) {
      logger.warn(`Total timeout (${totalTimeout}ms) exceeded, stopping execution`);
      results.push({
        success: false,
        error: `Total timeout exceeded after ${Math.round(elapsed / 1000)}s`,
        actionIndex: i,
      });
      break;
    }

    const step = sequence[i];
    const result = await executeAction(stagehand, step, i, config);

    results.push(result);

    if (onActionComplete) {
      onActionComplete(result);
    }

    // If action failed, we continue (don't abort entire sequence)
    if (!result.success) {
      logger.warn(`Action ${i + 1} failed, continuing with next action`);
    }

    // Check timeout again after action (in case action took a long time)
    const elapsedAfterAction = Date.now() - startTime;
    if (elapsedAfterAction >= totalTimeout) {
      logger.warn(`Total timeout (${totalTimeout}ms) exceeded after action ${i + 1}`);
      break;
    }
  }

  return results;
}

