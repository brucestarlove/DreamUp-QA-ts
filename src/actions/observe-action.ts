/**
 * Observe Action
 * Tests if elements are visible to the accessibility tree
 * Useful for debugging element visibility
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult } from '../interaction.js';

export interface ObserveStep extends ActionStep {
  action: 'observe';
  target: string;
}

export class ObserveAction extends BaseAction<ObserveStep> {
  getActionType(): string {
    return 'observe';
  }

  getDescription(step: ObserveStep): string {
    return `Observe "${step.target}"`;
  }

  validate(step: ObserveStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.target || step.target.trim() === '') {
      errors.push('Observe action requires a non-empty target');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(
    context: ActionContext,
    step: ObserveStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();
    const timeout = this.getTimeout(step, context.config);

    try {
      this.logger.info('Observing for target', { target: step.target, actionIndex });

      const actions = await context.stagehand.observe(`find ${step.target}`, { timeout });

      if (actions && actions.length > 0) {
        this.logger.info('Found elements in accessibility tree', {
          count: actions.length,
          target: step.target,
        });
        actions.forEach((action, idx) => {
          this.logger.info('Element found', {
            index: idx + 1,
            method: action.method || 'unknown',
            selector: JSON.stringify(action.selector || action).substring(0, 100),
          });
        });
      } else {
        this.logger.warn('No elements found in accessibility tree', { target: step.target });
        this.logger.warn('Elements may not be accessible via DOM-based methods');
      }

      const executionTime = Date.now() - startTime;

      return this.createSuccessResult(actionIndex, executionTime, 'none', step, {
        elementsFound: actions.length,
      });
    } catch (error) {
      this.logger.error('Observe failed', error as Error, { target: step.target });
      const executionTime = Date.now() - startTime;
      return this.createFailureResult(actionIndex, error as Error, executionTime);
    }
  }
}
