/**
 * Reporter - Generates structured JSON output
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.js';
import { getTimestamp } from './utils/time.js';
import type { CaptureResult } from './capture.js';
import type { ActionResult } from './interaction.js';

export interface TestResult {
  status: 'pass' | 'fail';
  playability_score: number;
  issues: string[];
  screenshots: string[];
  timestamp: string;
  logs?: string;
  test_duration?: number;
  cost_estimate?: number;
}

/**
 * Generate test result from execution data
 */
export function generateResult(
  actionResults: ActionResult[],
  captureResult: CaptureResult,
  startTime: number,
): TestResult {
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Collect issues from failed actions
  const issues: string[] = [];
  const failedActions = actionResults.filter((r) => !r.success);
  
  if (failedActions.length > 0) {
    issues.push(`${failedActions.length} action(s) failed`);
    failedActions.forEach((r) => {
      if (r.error) {
        issues.push(`action_${r.actionIndex + 1}: ${r.error}`);
      }
    });
  }

  // Determine status
  const status: 'pass' | 'fail' = issues.length === 0 ? 'pass' : 'fail';

  // Calculate playability score (placeholder for now)
  // Phase 1: Simple heuristic based on action success rate
  const totalActions = actionResults.length;
  const successfulActions = actionResults.filter((r) => r.success).length;
  const playability_score = totalActions > 0 ? successfulActions / totalActions : 0.0;

  // Collect screenshot filenames
  const screenshots = captureResult.screenshots.map((s) => s.filename);

  const result: TestResult = {
    status,
    playability_score,
    issues,
    screenshots,
    timestamp: getTimestamp(),
    test_duration: Math.round(duration / 1000), // seconds
  };

  // Add logs path if available
  if (captureResult.logsPath) {
    result.logs = captureResult.logsPath;
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

