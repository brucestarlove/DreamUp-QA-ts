/**
 * Press Action
 * Handles keyboard input with support for repeat, duration, and alternating keys
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult } from '../interaction.js';
import { sleep } from '../utils/time.js';
import { resolveKeyName, resolveAction } from '../utils/controls.js';

export interface PressStep extends ActionStep {
  action: 'press';
  key?: string;
  repeat?: number;
  duration?: number;
  alternateKeys?: string[];
  delay?: number;
  timeout?: number;
}

export class PressAction extends BaseAction<PressStep> {
  getActionType(): string {
    return 'press';
  }

  getDescription(step: PressStep): string {
    if (step.alternateKeys && step.alternateKeys.length > 0) {
      return `Press ${step.alternateKeys.join('/')} alternately${step.repeat ? ` (${step.repeat}x)` : ''}`;
    }
    if (step.duration) {
      return `Press ${step.key} for ${step.duration}ms`;
    }
    return `Press ${step.key}${step.repeat ? ` (${step.repeat}x)` : ''}`;
  }

  validate(step: PressStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.key && (!step.alternateKeys || step.alternateKeys.length === 0)) {
      errors.push('Press action requires either "key" or "alternateKeys"');
    }

    if (step.repeat !== undefined && step.repeat > 100) {
      errors.push('Repeat count should not exceed 100 (will be clamped)');
    }

    if (step.duration !== undefined && step.duration > 10000) {
      errors.push('Duration should not exceed 10 seconds');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(
    context: ActionContext,
    step: PressStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Clamp repeat count to prevent runaway loops
      const repeat = Math.min(step.repeat ?? 1, 100);
      const delay = step.delay ?? 50; // Default 50ms between presses
      const duration = step.duration;
      const timeout = this.getTimeout(step, context.config);

      if (step.alternateKeys) {
        await this.executeAlternatingKeys(context, step, repeat, delay, timeout);
      } else if (step.key) {
        await this.executeSingleKey(context, step, repeat, delay, duration, timeout);
      }

      const executionTime = Date.now() - startTime;

      return this.createSuccessResult(actionIndex, executionTime, 'dom', step, {
        key: step.key || step.alternateKeys?.join('/'),
        repeat,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.createFailureResult(actionIndex, error as Error, executionTime);
    }
  }

  /**
   * Execute alternating keys (e.g., ["Left", "Right"] for horizontal movement)
   */
  private async executeAlternatingKeys(
    context: ActionContext,
    step: PressStep,
    repeat: number,
    delay: number,
    timeout: number
  ): Promise<void> {
    const keysToPress = step.alternateKeys!.map((k) => {
      // Try to resolve as action reference first
      const actionKeys = resolveAction(k, context.config.controls);
      if (actionKeys && actionKeys.length > 0) {
        return actionKeys[0]; // Use primary key
      }
      // Otherwise resolve as key name
      return resolveKeyName(k);
    });

    this.logger.debug('Alternating between keys', {
      keys: keysToPress,
      repeat,
    });

    // Alternate between keys
    for (let i = 0; i < repeat; i++) {
      const key = keysToPress[i % keysToPress.length];

      await context.stagehand.act(`press the ${key} key`, { timeout });

      if (i < repeat - 1) {
        await sleep(delay);
      }
    }
  }

  /**
   * Execute single key press (with optional repeat or duration)
   */
  private async executeSingleKey(
    context: ActionContext,
    step: PressStep,
    repeat: number,
    delay: number,
    duration: number | undefined,
    timeout: number
  ): Promise<void> {
    // Try to resolve as action reference first (e.g., "MoveRight" -> "ArrowRight")
    const actionKeys = resolveAction(step.key!, context.config.controls);
    const keyToPress = actionKeys && actionKeys.length > 0 ? actionKeys[0] : resolveKeyName(step.key!);

    this.logger.debug('Pressing key', { key: keyToPress, repeat });

    if (duration) {
      // Hold key for duration (simulate with multiple rapid presses)
      this.logger.debug('Simulating key hold', { duration });
      const holdStartTime = Date.now();
      let pressCount = 0;

      while (Date.now() - holdStartTime < duration) {
        await context.stagehand.act(`press the ${keyToPress} key`, { timeout });
        pressCount++;
        // Small delay between presses (20ms for smoother hold simulation)
        await sleep(20);
      }

      this.logger.debug('Key hold completed', { pressCount, duration });
    } else {
      // Normal repeated presses
      for (let i = 0; i < repeat; i++) {
        await context.stagehand.act(`press the ${keyToPress} key`, { timeout });

        if (i < repeat - 1) {
          await sleep(delay);
        }
      }
    }
  }
}
