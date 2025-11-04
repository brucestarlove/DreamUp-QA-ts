/**
 * Reporter - Generates structured JSON output
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.js';
import { getTimestamp } from './utils/time.js';
import type { CaptureResult, ScreenshotMetadata } from './capture.js';
import type { ActionResult } from './interaction.js';
import type { Issue } from './utils/errors.js';
import type { CUAUsageMetrics } from './cua.js';
import { createIssue, classifyError } from './utils/errors.js';

export interface ActionTiming {
  actionIndex: number;
  executionTime: number;
  timestamp: string;
  success: boolean;
}

export interface LLMUsageMetrics {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCost: number; // USD
}

export interface TestResult {
  status: 'pass' | 'fail';
  playability_score: number;
  issues: Issue[];
  screenshots: string[];
  screenshot_metadata?: ScreenshotMetadata[];
  action_timings?: ActionTiming[];
  timestamp: string;
  logs?: string;
  test_duration?: number;
  llm_usage?: LLMUsageMetrics;
}

/**
 * Generate test result from execution data
 */
export function generateResult(
  actionResults: ActionResult[],
  captureResult: CaptureResult,
  startTime: number,
  additionalIssues: Issue[] = [],
  cuaUsage?: CUAUsageMetrics,
): TestResult {
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Collect issues from failed actions and additional issues
  const issues: Issue[] = [...additionalIssues];
  
  // Convert failed actions to structured issues
  const failedActions = actionResults.filter((r) => !r.success);
  failedActions.forEach((r) => {
    if (r.error) {
      const issueType = classifyError(r.error, { isAction: true });
      issues.push(
        createIssue(
          issueType,
          `Action ${r.actionIndex + 1} failed: ${r.error}`,
          r.actionIndex,
        ),
      );
    }
  });

  // Determine status
  const status: 'pass' | 'fail' = issues.length === 0 ? 'pass' : 'fail';

  // Calculate playability score (placeholder for now)
  // Phase 1: Simple heuristic based on action success rate
  const totalActions = actionResults.length;
  const successfulActions = actionResults.filter((r) => r.success).length;
  const playability_score = totalActions > 0 ? successfulActions / totalActions : 0.0;

  // Collect screenshot filenames and metadata
  const screenshots = captureResult.screenshots.map((s) => s.filename);
  const screenshot_metadata = captureResult.screenshots;

  // Collect action timings
  const action_timings: ActionTiming[] = actionResults
    .filter((r) => r.executionTime !== undefined && r.timestamp !== undefined)
    .map((r) => ({
      actionIndex: r.actionIndex,
      executionTime: r.executionTime!,
      timestamp: r.timestamp!,
      success: r.success,
    }));

  // Add capture issues to the issues list
  issues.push(...captureResult.issues);

  const result: TestResult = {
    status,
    playability_score,
    issues,
    screenshots,
    screenshot_metadata,
    action_timings,
    timestamp: getTimestamp(),
    test_duration: Math.round(duration / 1000), // seconds
  };

  // Add logs path if available
  if (captureResult.logsPath) {
    result.logs = captureResult.logsPath;
  }

  // Add LLM usage metrics if available
  if (cuaUsage && cuaUsage.totalCalls > 0) {
    result.llm_usage = {
      totalCalls: cuaUsage.totalCalls,
      totalInputTokens: cuaUsage.totalInputTokens,
      totalOutputTokens: cuaUsage.totalOutputTokens,
      totalTokens: cuaUsage.totalTokens,
      estimatedCost: Number(cuaUsage.estimatedCost.toFixed(6)), // Round to 6 decimal places
    };
  }

  return result;
}

/**
 * Write result to JSON file
 */
export function writeResult(result: TestResult, sessionDir: string): string {
  try {
    const outputPath = join(sessionDir, 'output.json');
    const jsonContent = JSON.stringify(result, null, 2);
    writeFileSync(outputPath, jsonContent, 'utf-8');
    logger.info(`Result written to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Failed to write result:', error);
    throw error;
  }
}

