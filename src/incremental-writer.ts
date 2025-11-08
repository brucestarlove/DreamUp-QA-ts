/**
 * Incremental Writer - Updates output.json in real-time as test executes
 * This enables the dashboard to show live progress
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.js';
import type { ActionTiming, TestResult } from './reporter.js';

export class IncrementalWriter {
  private outputPath: string;

  constructor(sessionDir: string) {
    this.outputPath = join(sessionDir, 'output.json');
  }

  /**
   * Read current output.json
   */
  private readCurrent(): TestResult {
    try {
      if (!existsSync(this.outputPath)) {
        throw new Error('output.json does not exist');
      }
      const content = readFileSync(this.outputPath, 'utf-8');
      return JSON.parse(content) as TestResult;
    } catch (error) {
      logger.error('Failed to read output.json:', error);
      throw error;
    }
  }

  /**
   * Write updated output.json atomically
   */
  private write(result: TestResult): void {
    try {
      const jsonContent = JSON.stringify(result, null, 2);
      writeFileSync(this.outputPath, jsonContent, 'utf-8');
      logger.debug('Updated output.json');
    } catch (error) {
      logger.error('Failed to write output.json:', error);
      throw error;
    }
  }

  /**
   * Add a completed action to the timeline
   * Called after each action completes
   */
  addAction(actionTiming: ActionTiming): void {
    try {
      const result = this.readCurrent();
      
      // Initialize action_timings if it doesn't exist
      if (!result.action_timings) {
        result.action_timings = [];
      }

      // Add or update the action timing
      const existingIndex = result.action_timings.findIndex(
        a => a.actionIndex === actionTiming.actionIndex
      );
      
      if (existingIndex >= 0) {
        result.action_timings[existingIndex] = actionTiming;
      } else {
        result.action_timings.push(actionTiming);
      }

      this.write(result);
    } catch (error) {
      logger.error('Failed to add action:', error);
      // Don't throw - we don't want to break the test if incremental updates fail
    }
  }

  /**
   * Add an evaluation step to the timeline
   * This shows evaluation steps (heuristic, LLM) in the timeline
   */
  addEvaluationStep(step: {
    type: 'heuristic' | 'llm';
    status: 'in_progress' | 'completed' | 'failed';
    score?: number;
    executionTime?: number;
    timestamp?: string;
  }): void {
    try {
      const result = this.readCurrent();

      // Store evaluation progress in a custom field
      if (!result.evaluation_progress) {
        (result as any).evaluation_progress = [];
      }

      const evaluationProgress = (result as any).evaluation_progress as any[];
      
      // Update or add the evaluation step
      const existingIndex = evaluationProgress.findIndex(e => e.type === step.type);
      
      if (existingIndex >= 0) {
        evaluationProgress[existingIndex] = { ...evaluationProgress[existingIndex], ...step };
      } else {
        evaluationProgress.push(step);
      }

      this.write(result);
    } catch (error) {
      logger.error('Failed to add evaluation step:', error);
    }
  }

  /**
   * Update action method breakdown in real-time
   */
  updateActionMethods(cua: number, dom: number, none: number): void {
    try {
      const result = this.readCurrent();
      
      result.action_methods = { cua, dom, none };
      
      this.write(result);
    } catch (error) {
      logger.error('Failed to update action methods:', error);
    }
  }
}

