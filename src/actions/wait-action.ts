/**
 * Wait Action
 * Pauses execution for a specified duration
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult } from '../interaction.js';
import { sleep } from '../utils/time.js';

export interface WaitStep extends ActionStep {
  wait: number;
}

export class WaitAction extends BaseAction<WaitStep> {
  getActionType(): string {
    return 'wait';
  }

  getDescription(step: WaitStep): string {
    return `Wait ${step.wait}ms`;
  }

  validate(step: WaitStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.wait || step.wait <= 0) {
      errors.push('Wait duration must be positive');
    }

    if (step.wait > 60000) {
      errors.push('Wait duration should not exceed 60 seconds');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(
    context: ActionContext,
    step: WaitStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();

    await sleep(step.wait);

    const executionTime = Date.now() - startTime;

    return this.createSuccessResult(actionIndex, executionTime, 'none', step);
  }
}
