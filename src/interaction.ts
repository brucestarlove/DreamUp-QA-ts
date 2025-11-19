/**
 * Interaction Engine - Executes actions from config sequence
 * Refactored to use Action Strategy pattern
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { SequenceStep, Config } from './config.js';
import type { ICaptureManager } from './interfaces/capture-manager.interface.js';
import type { ICUAManager } from './interfaces/cua-manager.interface.js';
import { createActionRegistry } from './actions/action-registry.js';
import type { ActionContext } from './actions/base-action.js';
import { createLogger } from './observability/structured-logger.js';
import { getTimestamp } from './utils/time.js';

const logger = createLogger({ service: 'interaction' });

// Re-export types for backward compatibility
export interface AgentResult {
  message?: string;
  stepsExecuted?: number;
  success?: boolean;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  actionIndex: number;
  executionTime?: number;
  timestamp?: string;
  methodUsed?: 'cua' | 'dom' | 'none';
  agentResult?: AgentResult;
  metadata?: Record<string, any>;
  action?: string;
  target?: string;
  key?: string;
  description?: string;
}

/**
 * Determine action type from step
 */
function getActionType(step: SequenceStep): string {
  if ('wait' in step) {
    return 'wait';
  }
  if ('action' in step) {
    return step.action;
  }
  return 'unknown';
}

/**
 * Execute the entire sequence of actions with global timeout enforcement
 */
export async function executeSequence(
  stagehand: Stagehand,
  config: Config,
  startTime: number,
  captureManager?: ICaptureManager,
  onActionComplete?: (result: ActionResult) => void,
  cuaManager?: ICUAManager
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  const maxSteps = 100;
  const totalTimeout = config.timeouts?.total ?? 60000;

  // Create action registry
  const registry = createActionRegistry();

  // Create action context
  const context: ActionContext = {
    stagehand,
    config,
    captureManager,
    cuaManager,
    startTime,
  };

  logger.info('Starting action sequence', {
    totalActions: config.sequence.length,
    maxSteps,
    totalTimeout,
  });

  if (config.sequence.length > maxSteps) {
    logger.warn('Sequence length exceeds max steps, truncating', {
      sequenceLength: config.sequence.length,
      maxSteps,
    });
  }

  const sequence = config.sequence.slice(0, maxSteps);

  for (let i = 0; i < sequence.length; i++) {
    // Check total timeout before each action
    const elapsed = Date.now() - startTime;
    if (elapsed >= totalTimeout) {
      logger.warn('Total timeout exceeded, stopping execution', {
        elapsed,
        totalTimeout,
      });

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
    const actionType = getActionType(step);

    // Get action handler from registry
    const action = registry.get(actionType);

    if (!action) {
      logger.error('Unknown action type', { actionType, actionIndex: i });

      results.push({
        success: false,
        error: `Unknown action type: ${actionType}`,
        actionIndex: i,
        executionTime: 0,
        timestamp: getTimestamp(),
        methodUsed: 'none',
      });

      if (onActionComplete) {
        onActionComplete(results[results.length - 1]);
      }

      continue;
    }

    // Validate action before execution
    const validation = action.validate(step as any);
    if (!validation.valid) {
      logger.error('Action validation failed', {
        actionType,
        actionIndex: i,
        errors: validation.errors,
      });

      results.push({
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        actionIndex: i,
        executionTime: 0,
        timestamp: getTimestamp(),
        methodUsed: 'none',
      });

      if (onActionComplete) {
        onActionComplete(results[results.length - 1]);
      }

      continue;
    }

    // Execute action
    logger.debug('Executing action', {
      actionType,
      actionIndex: i,
      description: action.getDescription(step as any),
    });

    const result = await action.execute(context, step as any, i);
    results.push(result);

    // Auto-capture screenshot on failure
    if (!result.success && captureManager) {
      try {
        const pages = stagehand.context.pages();
        const page = pages.length > 0 ? pages[0] : null;
        if (page) {
          await captureManager.takeScreenshot(page, `error_action_${i}`, i);
          logger.info('Error screenshot captured', { actionIndex: i });
        } else {
          logger.warn('Cannot capture error screenshot: page not available', {
            actionIndex: i,
          });
        }
      } catch (error) {
        logger.error('Failed to capture error screenshot', error as Error, {
          actionIndex: i,
        });
      }
    }

    // Call completion callback
    if (onActionComplete) {
      onActionComplete(result);
    }

    // If action failed, continue (don't abort entire sequence)
    if (!result.success) {
      logger.warn('Action failed, continuing with next action', {
        actionIndex: i,
        error: result.error,
      });
    }

    // Check timeout again after action (leave buffer for final screenshot)
    const elapsedAfterAction = Date.now() - startTime;
    const timeoutBuffer = 5000; // 5 seconds buffer
    if (elapsedAfterAction >= totalTimeout - timeoutBuffer) {
      logger.warn('Total timeout approaching, stopping execution', {
        elapsed: elapsedAfterAction,
        totalTimeout,
        buffer: timeoutBuffer,
      });
      break;
    }
  }

  logger.info('Action sequence completed', {
    total: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });

  return results;
}

/**
 * @deprecated Use executeSequence instead
 * Kept for backward compatibility
 */
export async function executeAction(
  stagehand: Stagehand,
  step: SequenceStep,
  actionIndex: number,
  config: Config,
  captureManager?: ICaptureManager,
  cuaManager?: ICUAManager
): Promise<ActionResult> {
  const context: ActionContext = {
    stagehand,
    config,
    captureManager,
    cuaManager,
    startTime: Date.now(),
  };

  const registry = createActionRegistry();
  const actionType = getActionType(step);
  const action = registry.get(actionType);

  if (!action) {
    return {
      success: false,
      error: `Unknown action type: ${actionType}`,
      actionIndex,
      executionTime: 0,
      timestamp: getTimestamp(),
      methodUsed: 'none',
    };
  }

  return await action.execute(context, step as any, actionIndex);
}
