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
import { resolveKeyName, validateControls, resolveAction } from './utils/controls.js';

export interface AgentResult {
  message?: string; // Agent's completion message (e.g., "The game ended with a win for the computer")
  stepsExecuted?: number; // Number of steps the agent actually executed
  success?: boolean; // Agent's reported success status
}

export interface ActionResult {
  success: boolean;
  error?: string;
  actionIndex: number;
  executionTime?: number; // milliseconds
  timestamp?: string;
  methodUsed?: 'cua' | 'dom' | 'none'; // Track which method was used for this action
  agentResult?: AgentResult; // Agent result data (for agent actions)
  metadata?: Record<string, any>; // Additional metadata (e.g., keys pressed, axis values)
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
  
  // Support per-action timeout overrides
  const defaultTimeout = config.timeouts?.action ?? 10000;
  const timeout = ('action' in step && 'timeout' in step && step.timeout) 
    ? step.timeout 
    : defaultTimeout;
    
  const actionRetries = config.actionRetries ?? 2;

  // Validate controls schema if provided
  if (config.controls) {
    const validation = validateControls(config.controls);
    if (!validation.valid) {
      logger.warn('Controls validation warnings:', validation.warnings);
    }
  }

  // Validate and sanitize inputs
  if ('action' in step && step.action === 'press') {
    // Clamp repeat count to prevent runaway loops
    if (step.repeat !== undefined && step.repeat > 100) {
      logger.warn(`Clamping repeat count from ${step.repeat} to 100`);
      step.repeat = 100;
    }
    // Validate key name or alternateKeys
    if (!step.key && (!step.alternateKeys || step.alternateKeys.length === 0)) {
      return {
        success: false,
        error: 'Press action requires either "key" or "alternateKeys"',
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
              // Check if CUA should be used (global alwaysCUA flag or per-action override)
              const useCUA = step.useCUA ?? config.alwaysCUA ?? false;

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

                // Generate game-agnostic button phrasings
                // Focus on functional descriptions rather than game-specific text
                const generateButtonPhrasings = (target: string): string[] => {
                  // Normalize target text
                  const normalized = target.toLowerCase().trim();
                  
                  // Common game button patterns (functional descriptions)
                  const patterns = [
                    `find the ${target}`,
                    `find ${target}`,
                    `locate the ${target}`,
                    `locate ${target}`,
                    `click the ${target}`,
                    `click ${target}`,
                  ];
                  
                  // Add common synonyms for game buttons
                  if (normalized.includes('start') || normalized.includes('play') || normalized.includes('begin')) {
                    patterns.push(
                      'find the start button',
                      'find the play button',
                      'find the begin button',
                      'locate start game button',
                      'locate play game button',
                    );
                  }
                  
                  if (normalized.includes('restart') || normalized.includes('again') || normalized.includes('retry')) {
                    patterns.push(
                      'find the restart button',
                      'find the play again button',
                      'find the retry button',
                      'locate restart game button',
                    );
                  }
                  
                  if (normalized.includes('pause') || normalized.includes('menu')) {
                    patterns.push(
                      'find the pause button',
                      'find the menu button',
                      'locate pause button',
                    );
                  }
                  
                  return [...new Set(patterns)]; // Remove duplicates
                };

                const phrasings = generateButtonPhrasings(step.target);

                // Try each phrasing until one succeeds
                for (const phrasing of phrasings) {
                  try {
                    logger.debug(`Trying observe with phrasing: "${phrasing}"`);
                    actions = await stagehand.observe(phrasing, {
                      timeout: observeTimeout,
                    });
                    if (actions && actions.length > 0) {
                      logger.debug(`Found ${actions.length} element(s) with phrasing: "${phrasing}"`);
                      break;
                    }
                  } catch (error) {
                    logger.debug(`Phrasing failed: "${phrasing}"`);
                    continue;
                  }
                }

                // If observe succeeded, use cached action (only cache successful observe results)
                if (actions && actions.length > 0) {
                  // Support per-action model override
                  const actOptions: any = { timeout };
                  if ('model' in step && step.model) {
                    actOptions.modelName = step.model;
                  }
                  
                  await stagehand.act(actions[0], actOptions);
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
              // Enhanced press key action - supports duration, alternation, and delay
              const repeat = Math.min(step.repeat ?? 1, 100);
              const delay = step.delay ?? 50; // Default 50ms between presses
              const duration = step.duration; // Optional: hold key for duration
              
              // Resolve keys (either single key or alternating keys)
              let keysToPress: string[];
              
              if (step.alternateKeys) {
                // Alternating keys mode (e.g., ["Left", "Right"] for horizontal movement)
                keysToPress = step.alternateKeys.map(k => {
                  // Try to resolve as action reference first
                  const actionKeys = resolveAction(k, config.controls);
                  if (actionKeys && actionKeys.length > 0) {
                    return actionKeys[0]; // Use primary key
                  }
                  // Otherwise resolve as key name
                  return resolveKeyName(k);
                });
                
                logger.debug(`Alternating between keys: ${keysToPress.join(', ')} (repeat: ${repeat})`);
                
                // Alternate between keys
                for (let i = 0; i < repeat; i++) {
                  const key = keysToPress[i % keysToPress.length];
                  
                  if (duration) {
                    // Hold key for duration (not yet supported by Stagehand act(), fall back to normal press)
                    logger.debug(`Pressing ${key} (hold duration not yet supported, using normal press)`);
                    await stagehand.act(`press the ${key} key`, { timeout });
                  } else {
                    await stagehand.act(`press the ${key} key`, { timeout });
                  }
                  
                  if (i < repeat - 1) {
                    await sleep(delay);
                  }
                }
              } else if (step.key) {
                // Single key mode
                // Try to resolve as action reference first (e.g., "MoveRight" -> "ArrowRight")
                const actionKeys = resolveAction(step.key, config.controls);
                const keyToPress = actionKeys && actionKeys.length > 0 
                  ? actionKeys[0] 
                  : resolveKeyName(step.key);
                
                logger.debug(`Pressing key: ${keyToPress} (repeat: ${repeat})`);
                
                if (duration) {
                  // Hold key for duration (simulate with multiple rapid presses)
                  logger.debug(`Simulating key hold for ${duration}ms`);
                  const holdStartTime = Date.now();
                  let pressCount = 0;
                  
                  while (Date.now() - holdStartTime < duration) {
                    await stagehand.act(`press the ${keyToPress} key`, { timeout });
                    pressCount++;
                    // Small delay between presses (20ms for smoother hold simulation)
                    await sleep(20);
                  }
                  
                  logger.debug(`Key hold completed (${pressCount} presses in ${duration}ms)`);
                } else {
                  // Normal repeated presses
                  for (let i = 0; i < repeat; i++) {
                    await stagehand.act(`press the ${keyToPress} key`, { timeout });
                    
                    if (i < repeat - 1) {
                      await sleep(delay);
                    }
                  }
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

            case 'observe': {
              // Observe action - test if elements are visible to the accessibility tree
              // This is useful for debugging element visibility
              const observeTarget = step.target;
              
              try {
                logger.info(`Observing for: "${observeTarget}"`);
                const actions = await stagehand.observe(`find ${observeTarget}`, { timeout });
                
                if (actions && actions.length > 0) {
                  logger.info(`✓ Found ${actions.length} element(s) in accessibility tree:`);
                  actions.forEach((action, idx) => {
                    logger.info(`  [${idx + 1}] ${action.method || 'unknown'} - ${JSON.stringify(action.selector || action).substring(0, 100)}`);
                  });
                } else {
                  logger.warn(`✗ No elements found in accessibility tree for: "${observeTarget}"`);
                  logger.warn(`  This suggests the elements may not be accessible via DOM-based methods`);
                }
                
                const executionTime = Date.now() - actionStartTime;
                return {
                  success: true, // Observe always succeeds (it's a test, not an action)
                  actionIndex,
                  executionTime,
                  timestamp: getTimestamp(),
                  methodUsed: 'none', // Observe is just a check
                };
              } catch (error) {
                logger.error(`Observe failed for "${observeTarget}":`, error);
                const executionTime = Date.now() - actionStartTime;
                return {
                  success: false,
                  error: `Observe failed: ${error instanceof Error ? error.message : String(error)}`,
                  actionIndex,
                  executionTime,
                  timestamp: getTimestamp(),
                  methodUsed: 'none',
                };
              }
            }

            case 'axis': {
              // Axis action - simulate continuous axis input (1D or 2D)
              const direction = step.direction;
              const value = step.value ?? 1.0; // Default to positive direction (right/up)
              const duration = Math.min(step.duration ?? 500, 10000); // Clamp to 10s max
              
              // Determine keys to press based on axis direction and value
              let keysToPress: string[] = [];
              
              if (step.keys) {
                // Use explicit keys if provided
                keysToPress = step.keys.map(k => {
                  const actionKeys = resolveAction(k, config.controls);
                  return actionKeys && actionKeys.length > 0 ? actionKeys[0] : resolveKeyName(k);
                });
              } else {
                // Derive keys from controls mapping based on direction and value
                if (direction === 'horizontal') {
                  if (value > 0) {
                    // Right
                    const rightKeys = resolveAction('MoveRight', config.controls);
                    if (rightKeys && rightKeys.length > 0) {
                      keysToPress = [rightKeys[0]];
                    } else {
                      keysToPress = ['ArrowRight']; // Fallback
                    }
                  } else {
                    // Left
                    const leftKeys = resolveAction('MoveLeft', config.controls);
                    if (leftKeys && leftKeys.length > 0) {
                      keysToPress = [leftKeys[0]];
                    } else {
                      keysToPress = ['ArrowLeft']; // Fallback
                    }
                  }
                } else if (direction === 'vertical') {
                  if (value > 0) {
                    // Up
                    const upKeys = resolveAction('MoveUp', config.controls);
                    if (upKeys && upKeys.length > 0) {
                      keysToPress = [upKeys[0]];
                    } else {
                      keysToPress = ['ArrowUp']; // Fallback
                    }
                  } else {
                    // Down
                    const downKeys = resolveAction('MoveDown', config.controls);
                    if (downKeys && downKeys.length > 0) {
                      keysToPress = [downKeys[0]];
                    } else {
                      keysToPress = ['ArrowDown']; // Fallback
                    }
                  }
                } else if (direction === '2d') {
                  // 2D diagonal movement - requires 2 keys pressed simultaneously
                  // For now, simulate with rapid alternation between keys
                  const horizontalKeys = value > 0 
                    ? resolveAction('MoveRight', config.controls)
                    : resolveAction('MoveLeft', config.controls);
                  const verticalKeys = value > 0
                    ? resolveAction('MoveUp', config.controls)
                    : resolveAction('MoveDown', config.controls);
                  
                  if (horizontalKeys && horizontalKeys.length > 0) {
                    keysToPress.push(horizontalKeys[0]);
                  }
                  if (verticalKeys && verticalKeys.length > 0) {
                    keysToPress.push(verticalKeys[0]);
                  }
                  
                  // Fallback to arrow keys
                  if (keysToPress.length === 0) {
                    keysToPress = value > 0 
                      ? ['ArrowRight', 'ArrowUp']
                      : ['ArrowLeft', 'ArrowDown'];
                  }
                }
              }
              
              if (keysToPress.length === 0) {
                throw new Error(`No keys resolved for axis action: ${direction} (value: ${value})`);
              }
              
              logger.debug(`Axis action: ${direction} (value: ${value}, duration: ${duration}ms, keys: [${keysToPress.join(', ')}])`);
              
              // Simulate axis input by holding/alternating keys for duration
              const axisStartTime = Date.now();
              let pressCount = 0;
              
              if (direction === '2d' && keysToPress.length > 1) {
                // 2D: Alternate between keys rapidly
                while (Date.now() - axisStartTime < duration) {
                  for (const key of keysToPress) {
                    await stagehand.act(`press the ${key} key`, { timeout });
                    pressCount++;
                    await sleep(30); // 30ms between presses for smooth diagonal
                  }
                }
              } else {
                // 1D: Hold single key (simulate with rapid presses)
                const key = keysToPress[0];
                while (Date.now() - axisStartTime < duration) {
                  await stagehand.act(`press the ${key} key`, { timeout });
                  pressCount++;
                  await sleep(20); // 20ms for smooth hold simulation
                }
              }
              
              logger.debug(`Axis action completed: ${pressCount} presses in ${Date.now() - axisStartTime}ms`);
              
              const executionTime = Date.now() - actionStartTime;
              return {
                success: true,
                actionIndex,
                executionTime,
                timestamp: getTimestamp(),
                methodUsed: 'dom',
                metadata: {
                  direction,
                  value,
                  duration,
                  keys: keysToPress,
                  pressCount,
                },
              };
            }

            case 'agent': {
              // Agent action - autonomous multi-step gameplay
              // Check if this specific agent action uses CUA (defaults to false, or global alwaysCUA)
              const useCUA = step.useCUA !== undefined ? step.useCUA : (config.alwaysCUA ?? false);
              
              if (useCUA && !cuaManager) {
                throw new Error('Agent action with useCUA requires CUA to be enabled. Set useCUA: true on the action, alwaysCUA: true in config, or configure cuaModel.');
              }

              const instruction = step.instruction;
              const maxSteps = step.maxSteps || 20; // Default 20 steps for autonomous gameplay
              
              // For autonomous agent tasks, use a longer timeout (2 minutes or config total timeout)
              const agentTimeout = Math.max(timeout * 8, config.timeouts?.total || 120000);

              try {
                logger.info(`Executing agent task${useCUA ? ' (CUA)' : ' (DOM-based)'}: "${instruction.substring(0, 100)}${instruction.length > 100 ? '...' : ''}" (maxSteps: ${maxSteps})`);
                
                if (!useCUA) {
                  throw new Error('Non-CUA agent actions not yet implemented. Please set useCUA: true on the action or alwaysCUA: true in config.');
                }
                
                if (!cuaManager) {
                  throw new Error('CUA manager not available');
                }
                
                const result = await cuaManager.executeAgent(instruction, maxSteps, agentTimeout);
                
                const executionTime = Date.now() - actionStartTime;
                const success = result?.success !== false;
                
                // Capture agent result data
                const agentResult: AgentResult = {
                  message: result?.message || undefined,
                  stepsExecuted: result?.stepsExecuted || undefined,
                  success: result?.success !== false ? result?.success : undefined,
                };
                
                logger.info(`Agent task completed. Success: ${success}, Steps: ${agentResult.stepsExecuted || 'unknown'}, Message: ${agentResult.message?.substring(0, 100) || 'N/A'}`);
                
                return {
                  success: success,
                  actionIndex,
                  executionTime,
                  timestamp: getTimestamp(),
                  methodUsed: 'cua',
                  agentResult: agentResult.message || agentResult.stepsExecuted ? agentResult : undefined,
                };
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Agent task failed: ${errorMessage}`);
              }
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
        const pages = stagehand.context.pages();
        const page = pages.length > 0 ? pages[0] : null;
        if (page) {
          await captureManager.takeScreenshot(page, `error_action_${i}`, i);
          logger.info(`Error screenshot captured for failed action ${i + 1}`);
        } else {
          logger.warn(`Cannot capture error screenshot for action ${i + 1}: page not available`);
        }
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
    // Leave some buffer (5 seconds) to capture final screenshot before timeout
    const elapsedAfterAction = Date.now() - startTime;
    const timeoutBuffer = 5000; // 5 seconds buffer for final screenshot
    if (elapsedAfterAction >= totalTimeout - timeoutBuffer) {
      logger.warn(`Total timeout (${totalTimeout}ms) approaching, stopping execution to allow final screenshot capture`);
      break;
    }
  }

  return results;
}

