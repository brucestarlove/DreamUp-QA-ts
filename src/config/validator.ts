/**
 * Config Validator
 * Validates configuration and provides helpful warnings
 */

import type { Config } from '../config.js';
import { createLogger } from '../observability/structured-logger.js';

const logger = createLogger({ service: 'ConfigValidator' });

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  suggestions?: string[];
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export class ConfigValidator {
  /**
   * Validate configuration
   */
  async validate(config: Config): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Check for empty sequence
    if (!config.sequence || config.sequence.length === 0) {
      issues.push({
        level: 'error',
        message: 'Sequence cannot be empty',
      });
    }

    // Check for consecutive wait actions
    const consecutiveWaits = this.detectConsecutiveWaits(config.sequence);
    if (consecutiveWaits.length > 0) {
      issues.push({
        level: 'warning',
        message: `Found ${consecutiveWaits.length} consecutive wait actions that could be combined`,
        suggestions: consecutiveWaits.map(
          (indexes) => `Combine waits at positions ${indexes.join(', ')}`
        ),
      });
    }

    // Validate action targets
    for (let i = 0; i < config.sequence.length; i++) {
      const step = config.sequence[i];

      if ('action' in step) {
        switch (step.action) {
          case 'click':
            if (!step.target || step.target.trim() === '') {
              issues.push({
                level: 'error',
                message: `Click action at position ${i} requires non-empty target`,
              });
            }
            break;

          case 'press':
            if (!step.key && (!step.alternateKeys || step.alternateKeys.length === 0)) {
              issues.push({
                level: 'error',
                message: `Press action at position ${i} requires either "key" or "alternateKeys"`,
              });
            }
            break;

          case 'agent':
            if (!step.instruction || step.instruction.trim() === '') {
              issues.push({
                level: 'error',
                message: `Agent action at position ${i} requires non-empty instruction`,
              });
            }
            if (!step.useCUA && !config.alwaysCUA) {
              issues.push({
                level: 'warning',
                message: `Agent action at position ${i} should have useCUA: true`,
                suggestions: ['Set useCUA: true on the action or alwaysCUA: true in config'],
              });
            }
            break;

          case 'axis':
            if (!step.direction) {
              issues.push({
                level: 'error',
                message: `Axis action at position ${i} requires a direction`,
              });
            }
            break;
        }
      }
    }

    // Check timeout configuration
    if (config.timeouts) {
      if (config.timeouts.action > config.timeouts.total) {
        issues.push({
          level: 'warning',
          message: 'Action timeout is greater than total timeout',
          suggestions: ['Ensure action timeout is less than total timeout'],
        });
      }
    }

    // Check CUA configuration
    if (config.alwaysCUA && !process.env.OPENAI_API_KEY) {
      issues.push({
        level: 'warning',
        message: 'alwaysCUA is enabled but OPENAI_API_KEY is not set',
        suggestions: ['Set OPENAI_API_KEY environment variable'],
      });
    }

    return {
      valid: !issues.some((i) => i.level === 'error'),
      issues,
    };
  }

  /**
   * Detect consecutive wait actions
   */
  private detectConsecutiveWaits(sequence: any[]): number[][] {
    const consecutiveGroups: number[][] = [];
    let currentGroup: number[] = [];

    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];

      if ('wait' in step) {
        currentGroup.push(i);
      } else {
        if (currentGroup.length > 1) {
          consecutiveGroups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    }

    if (currentGroup.length > 1) {
      consecutiveGroups.push(currentGroup);
    }

    return consecutiveGroups;
  }
}

/**
 * Create a config validator instance
 */
export function createConfigValidator(): ConfigValidator {
  return new ConfigValidator();
}
