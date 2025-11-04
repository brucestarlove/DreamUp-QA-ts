/**
 * Capture Manager - Handles screenshots and log collection
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.js';
import { getTimestamp } from './utils/time.js';
import { createIssue, type Issue } from './utils/errors.js';

export interface ScreenshotMetadata {
  filename: string;
  path: string;
  timestamp: string;
  label?: string;
  stepIndex?: number;
}

export interface CaptureResult {
  screenshots: ScreenshotMetadata[];
  logsPath?: string;
  issues: Issue[]; // Issues from capture failures
}

/**
 * Capture manager for screenshots and logs
 */
export class CaptureManager {
  private sessionDir: string;
  private screenshots: ScreenshotMetadata[] = [];
  private issues: Issue[] = [];

  constructor(sessionDir: string) {
    this.sessionDir = sessionDir;
    // Create directories
    try {
      mkdirSync(join(sessionDir, 'screenshots'), { recursive: true });
      mkdirSync(join(sessionDir, 'logs'), { recursive: true });
    } catch (error) {
      logger.warn('Failed to create capture directories:', error);
    }
  }

  /**
   * Get captured issues
   */
  getIssues(): Issue[] {
    return [...this.issues];
  }

  /**
   * Take a screenshot and save it
   */
  async takeScreenshot(
    page: ReturnType<Stagehand['context']['pages']>[0],
    label?: string,
    stepIndex?: number,
  ): Promise<ScreenshotMetadata | null> {
    try {
      const timestamp = getTimestamp().replace(/[:.]/g, '-').slice(0, -5);
      const filename = label ? `${label}_${timestamp}.png` : `screenshot_${timestamp}.png`;
      const filepath = join(this.sessionDir, 'screenshots', filename);

      // Take screenshot and save to file
      const buffer = await page.screenshot({ fullPage: false });
      const { writeFileSync } = await import('fs');
      writeFileSync(filepath, buffer);

      const metadata: ScreenshotMetadata = {
        filename,
        path: filepath,
        timestamp: getTimestamp(),
        label,
        stepIndex,
      };

      this.screenshots.push(metadata);
      logger.info(`Screenshot saved: ${filename}`);

      return metadata;
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.issues.push(
        createIssue('screenshot_failed', `Failed to capture screenshot: ${errorMessage}`),
      );
      return null;
    }
  }

  /**
   * Capture baseline screenshot after page load
   */
  async captureBaseline(
    page: ReturnType<Stagehand['context']['pages']>[0],
  ): Promise<ScreenshotMetadata | null> {
    return this.takeScreenshot(page, 'baseline', -1);
  }

  /**
   * Save console logs
   */
  async saveConsoleLogs(logs: string[]): Promise<string | null> {
    try {
      const logPath = join(this.sessionDir, 'logs', 'console.log');
      const logContent = logs.join('\n');
      writeFileSync(logPath, logContent, 'utf-8');
      logger.info(`Console logs saved: ${logPath}`);
      return logPath;
    } catch (error) {
      logger.error('Failed to save console logs:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.issues.push(
        createIssue('log_failed', `Failed to save console logs: ${errorMessage}`),
      );
      return null;
    }
  }

  /**
   * Get all captured screenshots
   */
  getScreenshots(): ScreenshotMetadata[] {
    return [...this.screenshots];
  }

  /**
   * Get final capture result
   */
  getResult(logsPath?: string): CaptureResult {
    return {
      screenshots: this.getScreenshots(),
      logsPath,
      issues: this.getIssues(),
    };
  }
}

