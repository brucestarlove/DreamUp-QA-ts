/**
 * Interaction Engine - Executes actions from config sequence
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { SequenceStep, Config } from './config.js';
import type { CaptureManager } from './capture.js';
import type { CUAManager } from './cua.js';
import { logger } from './utils/logger.js';
import { sleep, getTimestamp } from './utils/time.js';
import { retryWithBackoff, isRetryableError } from './utils/retry.js';
import { classifyError } from './utils/errors.js';

export interface ActionResult {
  success: boolean;
  error?: string;
  actionIndex: number;
  executionTime?: number; // milliseconds
  timestamp?: string;
  methodUsed?: 'cua' | 'dom' | 'none'; // Track which method was used for this action
}

/**
 * Execute a single action from the sequence with retry logic
 */
export async function executeAction(
  stagehand: Stagehand,
  step: SequenceStep,
  actionIndex: number,
  config: Config,
  captureManager?: CaptureManager,
  cuaManager?: CUAManager,
): Promise<ActionResult> {
  const actionStartTime = Date.now();
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
          const executionTime = Date.now() - actionStartTime;
          return {
            success: true,
            actionIndex,
            executionTime,
            timestamp: getTimestamp(),
            methodUsed: 'none',
          };
        }

        if ('action' in step) {
          switch (step.action) {
            case 'click': {
              // Check if CUA should be used (global flag or per-action override)
              const useCUA = step.useCUA ?? config.useCUA ?? false;

              if (useCUA && cuaManager) {
                // Use CUA for visual-based clicking
                // Make instruction clear and single-action focused
                // CUA needs 2-3 steps minimum: screenshot → click → confirm
                // But allow config to override for games that need more/fewer steps
                const instruction = `Click on ${step.target}. This is a single click action - click once and immediately stop.`;
                const maxSteps = config.cuaMaxSteps ?? 3; // Default 3 steps (screenshot → click → confirm)
                
                // CUA actions need more time: ~5-7s per step, so 3 steps = ~20-30s minimum
                // Use 2x the action timeout or 30s, whichever is higher
                const cuaTimeout = Math.max(timeout * 2, 30000);

                try {
                  logger.debug(`CUA click action: "${instruction}" (maxSteps: ${maxSteps}, timeout: ${cuaTimeout}ms)`);
                  await cuaManager.execute(instruction, maxSteps, cuaTimeout);
                  logger.debug(`CUA click action completed successfully`);
                  const executionTime = Date.now() - actionStartTime;
                  return {
                    success: true,
                    actionIndex,
                    executionTime,
                    timestamp: getTimestamp(),
                    methodUsed: 'cua',
                  };
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  throw new Error(`CUA click failed: ${errorMessage}`);
                }
              } else {
                // Use DOM-based click (observe→act pattern)
                // Click action - use observe→act pattern for better reliability
                // Only cache successful observe() results, not fallback actions
                const observeTimeout = timeout;
                let actions: any[] = [];

                // Try observe with original instruction
                try {
                  actions = await stagehand.observe(`find the ${step.target}`, {
                    timeout: observeTimeout,
                  });
                } catch (error) {
                  logger.debug(`Observe failed for "${step.target}": ${error}`);
                }

                // If observe didn't find anything, try alternative phrasings
                if (!actions || actions.length === 0) {
                  const alternativePhrasings = [
                    `find ${step.target}`,
                    `locate ${step.target}`,
                    `click ${step.target}`,
                  ];

                  for (const phrasing of alternativePhrasings) {
                    try {
                      logger.debug(`Retrying observe with alternative phrasing: "${phrasing}"`);
                      actions = await stagehand.observe(phrasing, {
                        timeout: observeTimeout,
                      });
                      if (actions && actions.length > 0) {
                        logger.debug(`Found ${actions.length} elements with alternative phrasing`);
                        break;
                      }
                    } catch (error) {
                      logger.debug(`Alternative phrasing failed: ${error}`);
                      continue;
                    }
                  }
                }

                // If observe succeeded, use cached action (only cache successful observe results)
                if (actions && actions.length > 0) {
                  await stagehand.act(actions[0], { timeout });
                  const executionTime = Date.now() - actionStartTime;
                  return {
                    success: true,
                    actionIndex,
                    executionTime,
                    timestamp: getTimestamp(),
                    methodUsed: 'dom',
                  };
                }

                // If observe failed completely, try direct act as last resort
                // Note: Stagehand will still cache direct act() calls, but this is better than failing
                logger.warn(
                  `Observe failed to find "${step.target}" after retries, using direct act as fallback`,
                );
                try {
                  await stagehand.act(`click the ${step.target}`, { timeout });
                  const executionTime = Date.now() - actionStartTime;
                  return {
                    success: true,
                    actionIndex,
                    executionTime,
                    timestamp: getTimestamp(),
                    methodUsed: 'dom',
                  };
                } catch (error) {
                  // If direct act also fails, throw error
                  throw new Error(
                    `Failed to find and click "${step.target}": observe returned empty, direct act failed: ${error instanceof Error ? error.message : String(error)}`,
                  );
                }
              }
            }

            case 'press': {
              // Press key action - use Stagehand's act method for keypress
              // Clamp repeat count (already validated above)
              const repeat = Math.min(step.repeat ?? 1, 100);

              for (let i = 0; i < repeat; i++) {
                // Use act() with natural language for keypress - pass timeout to Stagehand
                await stagehand.act(`press the ${step.key} key`, { timeout });
                // Small delay between key presses
                if (i < repeat - 1) {
                  await sleep(50);
                }
              }

              const executionTime = Date.now() - actionStartTime;
              return {
                success: true,
                actionIndex,
                executionTime,
                timestamp: getTimestamp(),
                methodUsed: 'dom',
              };
            }

            case 'screenshot': {
              // Screenshot action - capture screenshot if captureManager is available
              if (captureManager) {
                try {
                  const page = stagehand.context.pages()[0];
                  await captureManager.takeScreenshot(page, `action_${actionIndex}`, actionIndex);
                  logger.info(`Screenshot captured for action ${actionIndex + 1}`);
                } catch (error) {
                  logger.error('Failed to capture screenshot:', error);
                  // Don't fail the action, just log the error
                }
              } else {
                logger.debug('Screenshot action triggered but no capture manager available');
              }
              const executionTime = Date.now() - actionStartTime;
              return {
                success: true,
                actionIndex,
                executionTime,
                timestamp: getTimestamp(),
                methodUsed: 'none',
              };
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
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const issueType = classifyError(errorObj, { isAction: true });
    const executionTime = Date.now() - actionStartTime;
    
    return {
      success: false,
      error: `${issueType}: ${errorMessage}`,
      actionIndex,
      executionTime,
      timestamp: getTimestamp(),
      methodUsed: 'none', // Failed actions don't have a method
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
  captureManager?: CaptureManager,
  onActionComplete?: (result: ActionResult) => void,
  cuaManager?: CUAManager,
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
        executionTime: elapsed,
        timestamp: getTimestamp(),
        methodUsed: 'none',
      });
      break;
    }

    const step = sequence[i];
    const result = await executeAction(stagehand, step, i, config, captureManager, cuaManager);

    results.push(result);
    
    // Auto-capture screenshot on failure
    if (!result.success && captureManager) {
      try {
        const page = stagehand.context.pages()[0];
        await captureManager.takeScreenshot(page, `error_action_${i}`, i);
        logger.info(`Error screenshot captured for failed action ${i + 1}`);
      } catch (error) {
        logger.error('Failed to capture error screenshot:', error);
      }
    }

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

