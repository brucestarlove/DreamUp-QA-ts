/**
 * Interaction Engine - Executes actions from config sequence
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { SequenceStep, Config } from './config.js';
import { logger } from './utils/logger.js';
import { sleep } from './utils/time.js';

export interface ActionResult {
  success: boolean;
  error?: string;
  actionIndex: number;
}

/**
 * Execute a single action from the sequence
 */
export async function executeAction(
  stagehand: Stagehand,
  step: SequenceStep,
  actionIndex: number,
  config: Config,
): Promise<ActionResult> {
  const timeout = config.timeouts?.action ?? 10000;

  try {
    logger.info(`Executing action ${actionIndex + 1}: ${JSON.stringify(step)}`);

    // Handle different action types
    if ('wait' in step) {
      // Wait action
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
          const repeat = step.repeat ?? 1;

          for (let i = 0; i < repeat; i++) {
            // Use act() with natural language for keypress
            await stagehand.act(`press the ${step.key} key`, { timeout });
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
          return {
            success: false,
            error: `Unknown action type: ${(step as { action: string }).action}`,
            actionIndex,
          };
      }
    }

    return {
      success: false,
      error: 'Unknown step format',
      actionIndex,
    };
  } catch (error) {
    logger.error(`Action ${actionIndex + 1} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      actionIndex,
    };
  }
}

/**
 * Execute the entire sequence of actions
 */
export async function executeSequence(
  stagehand: Stagehand,
  config: Config,
  onActionComplete?: (result: ActionResult) => void,
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  const maxSteps = 100; // As per user's change

  if (config.sequence.length > maxSteps) {
    logger.warn(`Sequence length (${config.sequence.length}) exceeds max steps (${maxSteps}), truncating`);
  }

  const sequence = config.sequence.slice(0, maxSteps);

  for (let i = 0; i < sequence.length; i++) {
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
  }

  return results;
}

