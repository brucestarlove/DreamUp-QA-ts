/**
 * Axis Action
 * Simulates continuous axis input (1D or 2D) for platformer-style movement
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult } from '../interaction.js';
import { sleep } from '../utils/time.js';
import { resolveKeyName, resolveAction } from '../utils/controls.js';

export interface AxisStep extends ActionStep {
  action: 'axis';
  direction: 'horizontal' | 'vertical' | '2d';
  value?: number; // -1 (left/down) to 1 (right/up), default 1
  duration?: number;
  keys?: string[];
  timeout?: number;
}

export class AxisAction extends BaseAction<AxisStep> {
  getActionType(): string {
    return 'axis';
  }

  getDescription(step: AxisStep): string {
    return `Axis ${step.direction}${step.value !== undefined ? ` (${step.value})` : ''}${step.duration ? ` for ${step.duration}ms` : ''}`;
  }

  validate(step: AxisStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.direction) {
      errors.push('Axis action requires a direction (horizontal, vertical, or 2d)');
    }

    if (step.value !== undefined && (step.value < -1 || step.value > 1)) {
      errors.push('Axis value must be between -1 and 1');
    }

    if (step.duration !== undefined && step.duration > 10000) {
      errors.push('Axis duration should not exceed 10 seconds (will be clamped)');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(
    context: ActionContext,
    step: AxisStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const value = step.value ?? 1.0; // Default to positive direction
      const duration = Math.min(step.duration ?? 500, 10000); // Clamp to 10s max
      const timeout = this.getTimeout(step, context.config);

      // Determine keys to press based on axis direction and value
      const keysToPress = this.resolveAxisKeys(context, step, value);

      if (keysToPress.length === 0) {
        throw new Error(`No keys resolved for axis action: ${step.direction} (value: ${value})`);
      }

      this.logger.debug('Executing axis action', {
        direction: step.direction,
        value,
        duration,
        keys: keysToPress,
      });

      // Simulate axis input by holding/alternating keys for duration
      const axisStartTime = Date.now();
      let pressCount = 0;

      if (step.direction === '2d' && keysToPress.length > 1) {
        // 2D: Alternate between keys rapidly
        while (Date.now() - axisStartTime < duration) {
          for (const key of keysToPress) {
            await context.stagehand.act(`press the ${key} key`, { timeout });
            pressCount++;
            await sleep(30); // 30ms between presses for smooth diagonal
          }
        }
      } else {
        // 1D: Hold single key (simulate with rapid presses)
        const key = keysToPress[0];
        while (Date.now() - axisStartTime < duration) {
          await context.stagehand.act(`press the ${key} key`, { timeout });
          pressCount++;
          await sleep(20); // 20ms for smooth hold simulation
        }
      }

      this.logger.debug('Axis action completed', {
        pressCount,
        actualDuration: Date.now() - axisStartTime,
      });

      const executionTime = Date.now() - startTime;

      return this.createSuccessResult(actionIndex, executionTime, 'dom', step, {
        direction: step.direction,
        value,
        duration,
        keys: keysToPress,
        pressCount,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.createFailureResult(actionIndex, error as Error, executionTime);
    }
  }

  /**
   * Resolve which keys to press based on axis direction and value
   */
  private resolveAxisKeys(context: ActionContext, step: AxisStep, value: number): string[] {
    if (step.keys) {
      // Use explicit keys if provided
      return step.keys.map((k) => {
        const actionKeys = resolveAction(k, context.config.controls);
        return actionKeys && actionKeys.length > 0 ? actionKeys[0] : resolveKeyName(k);
      });
    }

    // Derive keys from controls mapping based on direction and value
    const keys: string[] = [];

    switch (step.direction) {
      case 'horizontal':
        if (value > 0) {
          // Right
          const rightKeys = resolveAction('MoveRight', context.config.controls);
          keys.push(rightKeys && rightKeys.length > 0 ? rightKeys[0] : 'ArrowRight');
        } else {
          // Left
          const leftKeys = resolveAction('MoveLeft', context.config.controls);
          keys.push(leftKeys && leftKeys.length > 0 ? leftKeys[0] : 'ArrowLeft');
        }
        break;

      case 'vertical':
        if (value > 0) {
          // Up
          const upKeys = resolveAction('MoveUp', context.config.controls);
          keys.push(upKeys && upKeys.length > 0 ? upKeys[0] : 'ArrowUp');
        } else {
          // Down
          const downKeys = resolveAction('MoveDown', context.config.controls);
          keys.push(downKeys && downKeys.length > 0 ? downKeys[0] : 'ArrowDown');
        }
        break;

      case '2d':
        // 2D diagonal movement - requires 2 keys
        const horizontalKeys = value > 0
          ? resolveAction('MoveRight', context.config.controls)
          : resolveAction('MoveLeft', context.config.controls);
        const verticalKeys = value > 0
          ? resolveAction('MoveUp', context.config.controls)
          : resolveAction('MoveDown', context.config.controls);

        if (horizontalKeys && horizontalKeys.length > 0) {
          keys.push(horizontalKeys[0]);
        }
        if (verticalKeys && verticalKeys.length > 0) {
          keys.push(verticalKeys[0]);
        }

        // Fallback to arrow keys
        if (keys.length === 0) {
          keys.push(value > 0 ? 'ArrowRight' : 'ArrowLeft');
          keys.push(value > 0 ? 'ArrowUp' : 'ArrowDown');
        }
        break;
    }

    return keys;
  }
}
