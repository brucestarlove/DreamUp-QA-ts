/**
 * Capture Manager Interface
 * Defines the contract for screenshot and log capture
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { ScreenshotMetadata, CaptureResult } from '../capture.js';
import type { Issue } from '../utils/errors.js';

export interface ICaptureManager {
  /**
   * Take a screenshot and save it
   */
  takeScreenshot(
    page: ReturnType<Stagehand['context']['pages']>[0] | undefined | null,
    label?: string,
    stepIndex?: number
  ): Promise<ScreenshotMetadata | null>;

  /**
   * Capture baseline screenshot after page load
   */
  captureBaseline(
    page: ReturnType<Stagehand['context']['pages']>[0]
  ): Promise<ScreenshotMetadata | null>;

  /**
   * Save console logs
   */
  saveConsoleLogs(logs: string[]): Promise<string | null>;

  /**
   * Get all captured screenshots
   */
  getScreenshots(): ScreenshotMetadata[];

  /**
   * Get captured issues
   */
  getIssues(): Issue[];

  /**
   * Get final capture result
   */
  getResult(logsPath?: string): CaptureResult;
}
