/**
 * Click Action
 * Handles clicking on elements using either DOM-based or CUA (visual) methods
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult } from '../interaction.js';

export interface ClickStep extends ActionStep {
  action: 'click';
  target: string;
  useCUA?: boolean;
  timeout?: number;
  model?: string;
}

export class ClickAction extends BaseAction<ClickStep> {
  getActionType(): string {
    return 'click';
  }

  getDescription(step: ClickStep): string {
    return `Click "${step.target}"`;
  }

  validate(step: ClickStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.target || step.target.trim() === '') {
      errors.push('Click action requires a non-empty target');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(
    context: ActionContext,
    step: ClickStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Check if CUA should be used (global alwaysCUA flag or per-action override)
      const useCUA = step.useCUA ?? context.config.alwaysCUA ?? false;

      if (useCUA && context.cuaManager) {
        return await this.executeCUAClick(context, step, actionIndex, startTime);
      } else {
        return await this.executeDOMClick(context, step, actionIndex, startTime);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.createFailureResult(actionIndex, error as Error, executionTime);
    }
  }

  /**
   * Execute click using CUA (Computer Use Agent) - visual-based
   */
  private async executeCUAClick(
    context: ActionContext,
    step: ClickStep,
    actionIndex: number,
    startTime: number
  ): Promise<ActionResult> {
    const instruction = `Click on ${step.target}. This is a single click action - click once and immediately stop.`;
    const maxSteps = context.config.cuaMaxSteps ?? 3;
    const timeout = this.getTimeout(step, context.config);
    const cuaTimeout = Math.max(timeout * 2, 30000);

    this.logger.debug('Executing CUA click', {
      target: step.target,
      maxSteps,
      timeout: cuaTimeout,
    });

    await context.cuaManager!.execute(instruction, maxSteps, cuaTimeout);

    this.logger.debug('CUA click completed successfully');

    const executionTime = Date.now() - startTime;

    return this.createSuccessResult(actionIndex, executionTime, 'cua', step, {
      target: step.target,
    });
  }

  /**
   * Execute click using DOM-based method (observe→act pattern)
   */
  private async executeDOMClick(
    context: ActionContext,
    step: ClickStep,
    actionIndex: number,
    startTime: number
  ): Promise<ActionResult> {
    const timeout = this.getTimeout(step, context.config);
    let actions: any[] = [];

    // Generate game-agnostic button phrasings
    const phrasings = this.generateButtonPhrasings(step.target);

    // Try each phrasing until one succeeds
    for (const phrasing of phrasings) {
      try {
        this.logger.debug('Trying observe with phrasing', { phrasing });
        actions = await context.stagehand.observe(phrasing, { timeout });

        if (actions && actions.length > 0) {
          this.logger.debug('Found elements with phrasing', {
            count: actions.length,
            phrasing,
          });
          break;
        }
      } catch (error) {
        this.logger.debug('Phrasing failed', { phrasing });
        continue;
      }
    }

    // If observe succeeded, use cached action
    if (actions && actions.length > 0) {
      const actOptions: any = { timeout };
      if (step.model) {
        actOptions.modelName = step.model;
      }

      await context.stagehand.act(actions[0], actOptions);

      const executionTime = Date.now() - startTime;

      return this.createSuccessResult(actionIndex, executionTime, 'dom', step, {
        target: step.target,
      });
    }

    // If observe failed completely, try direct act as last resort
    this.logger.warn('Observe failed, using direct act as fallback', { target: step.target });

    try {
      await context.stagehand.act(`click the ${step.target}`, { timeout });

      const executionTime = Date.now() - startTime;

      return this.createSuccessResult(actionIndex, executionTime, 'dom', step, {
        target: step.target,
      });
    } catch (error) {
      throw new Error(
        `Failed to find and click "${step.target}": observe returned empty, direct act failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Generate multiple phrasings to find buttons
   */
  private generateButtonPhrasings(target: string): string[] {
    const normalized = target.toLowerCase().trim();

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
        'locate play game button'
      );
    }

    if (normalized.includes('restart') || normalized.includes('again') || normalized.includes('retry')) {
      patterns.push(
        'find the restart button',
        'find the play again button',
        'find the retry button',
        'locate restart game button'
      );
    }

    if (normalized.includes('pause') || normalized.includes('menu')) {
      patterns.push(
        'find the pause button',
        'find the menu button',
        'locate pause button'
      );
    }

    return [...new Set(patterns)]; // Remove duplicates
  }
}
