/**
 * Base Action Class
 * Abstract base class for all action implementations using Strategy pattern
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { Config } from '../config.js';
import type { ICaptureManager } from '../interfaces/capture-manager.interface.js';
import type { ICUAManager } from '../interfaces/cua-manager.interface.js';
import type { ActionResult } from '../interaction.js';
import { retryWithBackoff, isRetryableError } from '../utils/retry.js';
import { classifyError } from '../utils/errors.js';
import { getTimestamp } from '../utils/time.js';
import { createLogger } from '../observability/structured-logger.js';

export interface ActionContext {
  stagehand: Stagehand;
  config: Config;
  captureManager?: ICaptureManager;
  cuaManager?: ICUAManager;
  startTime: number;
}

export interface ActionStep {
  action?: string;
  wait?: number;
  [key: string]: any;
}

/**
 * Abstract base action class
 * All action implementations must extend this class
 */
export abstract class BaseAction<TStep extends ActionStep = ActionStep> {
  protected logger = createLogger({ service: this.constructor.name });

  /**
   * Get the action type this handler supports
   */
  abstract getActionType(): string;

  /**
   * Execute the action
   */
  abstract execute(
    context: ActionContext,
    step: TStep,
    actionIndex: number
  ): Promise<ActionResult>;

  /**
   * Get a human-readable description of the action
   */
  abstract getDescription(step: TStep): string;

  /**
   * Validate the action step before execution
   */
  validate(step: TStep): { valid: boolean; errors: string[] } {
    // Default implementation - subclasses can override
    return { valid: true, errors: [] };
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    actionIndex: number,
    config: Config
  ): Promise<T> {
    const actionRetries = config.actionRetries ?? 2;

    return await retryWithBackoff(fn, {
      maxAttempts: actionRetries + 1,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      shouldRetry: (error) => isRetryableError(error),
    });
  }

  /**
   * Create a success result
   */
  protected createSuccessResult(
    actionIndex: number,
    executionTime: number,
    methodUsed: 'cua' | 'dom' | 'none',
    step: TStep,
    metadata?: Record<string, any>
  ): ActionResult {
    return {
      success: true,
      actionIndex,
      executionTime,
      timestamp: getTimestamp(),
      methodUsed,
      action: this.getActionType(),
      description: this.getDescription(step),
      metadata,
    };
  }

  /**
   * Create a failure result
   */
  protected createFailureResult(
    actionIndex: number,
    error: Error,
    executionTime: number
  ): ActionResult {
    const errorMessage = error.message;
    const issueType = classifyError(error, { isAction: true });

    this.logger.error('Action failed', error, {
      actionIndex,
      actionType: this.getActionType(),
      issueType,
    });

    return {
      success: false,
      error: `${issueType}: ${errorMessage}`,
      actionIndex,
      executionTime,
      timestamp: getTimestamp(),
      methodUsed: 'none',
      action: this.getActionType(),
    };
  }

  /**
   * Get timeout for this action
   */
  protected getTimeout(step: TStep, config: Config): number {
    const defaultTimeout = config.timeouts?.action ?? 10000;
    const stepTimeout = (step as any).timeout;
    return stepTimeout ?? defaultTimeout;
  }
}
