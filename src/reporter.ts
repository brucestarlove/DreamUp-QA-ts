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

export interface ActionMethodBreakdown {
  cua: number;
  dom: number;
  none: number; // wait, screenshot, failed actions
}

export interface AgentResult {
  message?: string; // Agent's completion message (e.g., "The game ended with a win for the computer")
  stepsExecuted?: number; // Number of steps the agent actually executed
  success?: boolean; // Agent's reported success status
}

export interface TestResult {
  timestamp: string;
  test_duration?: number;
  config_path?: string; // Path to the config file used
  status: 'pass' | 'fail';
  playability_score: number;
  issues: Issue[];
  screenshots: string[];
  screenshot_metadata?: ScreenshotMetadata[];
  action_timings?: ActionTiming[];
  action_methods?: ActionMethodBreakdown; // Breakdown of CUA vs DOM usage
  agent_responses?: AgentResult[]; // Agent result messages (for agent actions)
  browser_console_logs?: string; // Path to browser console logs file
  llm_usage?: LLMUsageMetrics;
  cost_estimate?: LLMUsageMetrics; // Alias for llm_usage (for PRD compatibility)
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
  configPath?: string,
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

  // Calculate action method breakdown (CUA vs DOM)
  const action_methods: ActionMethodBreakdown = {
    cua: actionResults.filter((r) => r.methodUsed === 'cua').length,
    dom: actionResults.filter((r) => r.methodUsed === 'dom').length,
    none: actionResults.filter((r) => !r.methodUsed || r.methodUsed === 'none').length,
  };

  // Collect agent responses (for agent actions)
  const agent_responses: AgentResult[] = actionResults
    .filter((r) => r.agentResult && (r.agentResult.message || r.agentResult.stepsExecuted !== undefined))
    .map((r) => r.agentResult!);

  // Add capture issues to the issues list
  issues.push(...captureResult.issues);

  // Build result object with proper field ordering
  const result: TestResult = {
    timestamp: getTimestamp(),
    test_duration: Math.round(duration / 1000), // seconds
    status,
    playability_score,
    issues,
    screenshots,
    screenshot_metadata,
    action_timings,
    action_methods,
  };

  // Add config path if provided (after timestamp/test_duration, before status)
  if (configPath) {
    result.config_path = configPath;
  }

  // Add agent responses if any
  if (agent_responses.length > 0) {
    result.agent_responses = agent_responses;
  }

  // Add browser console logs path if available and logs were actually captured
  // Only include logs path if there are meaningful console logs to review
  if (captureResult.logsPath && captureResult.logsPath.length > 0) {
    result.browser_console_logs = captureResult.logsPath;
  }

  // Add LLM usage metrics if available
  if (cuaUsage && cuaUsage.totalCalls > 0) {
    const llmUsage = {
      totalCalls: cuaUsage.totalCalls,
      totalInputTokens: cuaUsage.totalInputTokens,
      totalOutputTokens: cuaUsage.totalOutputTokens,
      totalTokens: cuaUsage.totalTokens,
      estimatedCost: Number(cuaUsage.estimatedCost.toFixed(6)), // Round to 6 decimal places
    };
    result.llm_usage = llmUsage;
    result.cost_estimate = llmUsage; // Alias for PRD compatibility
  }

  // Reorder fields to match user's requirements: timestamp, test_duration, config_path, then status
  const { timestamp, test_duration, config_path, ...rest } = result;
  return {
    timestamp,
    test_duration,
    ...(config_path ? { config_path } : {}),
    ...rest,
  };
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

