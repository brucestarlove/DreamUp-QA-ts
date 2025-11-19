/**
 * Agent Action
 * Executes autonomous multi-step gameplay using Computer Use Agent
 */

import { BaseAction, type ActionContext, type ActionStep } from './base-action.js';
import type { ActionResult, AgentResult } from '../interaction.js';

export interface AgentStep extends ActionStep {
  action: 'agent';
  instruction: string;
  maxSteps?: number;
  useCUA?: boolean;
}

export class AgentAction extends BaseAction<AgentStep> {
  getActionType(): string {
    return 'agent';
  }

  getDescription(step: AgentStep): string {
    return `Agent: ${step.instruction || 'Execute task'}`;
  }

  validate(step: AgentStep): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!step.instruction || step.instruction.trim() === '') {
      errors.push('Agent action requires a non-empty instruction');
    }

    if (step.maxSteps !== undefined && step.maxSteps > 100) {
      errors.push('maxSteps should not exceed 100');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(
    context: ActionContext,
    step: AgentStep,
    actionIndex: number
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // Check if this specific agent action uses CUA (defaults to false, or global alwaysCUA)
      const useCUA = step.useCUA !== undefined ? step.useCUA : (context.config.alwaysCUA ?? false);

      if (useCUA && !context.cuaManager) {
        throw new Error(
          'Agent action with useCUA requires CUA to be enabled. Set useCUA: true on the action, alwaysCUA: true in config, or configure cuaModel.'
        );
      }

      if (!useCUA) {
        throw new Error(
          'Non-CUA agent actions not yet implemented. Please set useCUA: true on the action or alwaysCUA: true in config.'
        );
      }

      if (!context.cuaManager) {
        throw new Error('CUA manager not available');
      }

      const instruction = step.instruction;
      const maxSteps = step.maxSteps || 20; // Default 20 steps for autonomous gameplay

      // For autonomous agent tasks, use a longer timeout (2 minutes or config total timeout)
      const timeout = this.getTimeout(step, context.config);
      const agentTimeout = Math.max(timeout * 8, context.config.timeouts?.total || 120000);

      this.logger.info('Executing agent task', {
        instruction: instruction.substring(0, 100),
        maxSteps,
        timeout: agentTimeout,
        useCUA,
      });

      const result = await context.cuaManager.executeAgent(instruction, maxSteps, agentTimeout);

      const executionTime = Date.now() - startTime;
      const success = result?.success !== false;

      // Capture agent result data
      const agentResult: AgentResult = {
        message: result?.message || undefined,
        stepsExecuted: result?.stepsExecuted || undefined,
        success: result?.success !== false ? result?.success : undefined,
      };

      this.logger.info('Agent task completed', {
        success,
        stepsExecuted: agentResult.stepsExecuted,
        message: agentResult.message?.substring(0, 100),
      });

      return {
        success,
        actionIndex,
        executionTime,
        timestamp: new Date().toISOString(),
        methodUsed: 'cua',
        agentResult: agentResult.message || agentResult.stepsExecuted ? agentResult : undefined,
        action: 'agent',
        description: this.getDescription(step),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.createFailureResult(actionIndex, error as Error, executionTime);
    }
  }
}
