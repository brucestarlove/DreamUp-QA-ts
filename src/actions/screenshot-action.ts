/**
 * Screenshot Action
 * Captures a screenshot at a specific point in the test
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult } from '../interaction.js';

export interface ScreenshotStep extends ActionStep {
  action: 'screenshot';
}

export class ScreenshotAction extends BaseAction<ScreenshotStep> {
  getActionType(): string {
    return 'screenshot';
  }

  getDescription(step: ScreenshotStep): string {
    return 'Take screenshot';
  }

  async execute(
    context: ActionContext,
    step: ScreenshotStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();

    if (context.captureManager) {
      try {
        const page = context.stagehand.context.pages()[0];
        await context.captureManager.takeScreenshot(page, `action_${actionIndex}`, actionIndex);
        this.logger.info('Screenshot captured', { actionIndex });
      } catch (error) {
        this.logger.error('Failed to capture screenshot', error as Error, { actionIndex });
        // Don't fail the action, just log the error
      }
    } else {
      this.logger.debug('Screenshot action triggered but no capture manager available');
    }

    const executionTime = Date.now() - startTime;

    return this.createSuccessResult(actionIndex, executionTime, 'none', step);
  }
}
