/**
 * Optimized Capture Manager
 * Enhanced version with screenshot optimization, caching, and deduplication
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../observability/structured-logger.js';
import { getTimestamp } from '../utils/time.js';
import { createIssue, type Issue } from '../utils/errors.js';
import type { ICaptureManager } from '../interfaces/capture-manager.interface.js';
import {
  ScreenshotOptimizer,
  createScreenshotOptimizer,
  type OptimizationOptions,
} from './screenshot-optimizer.js';

const logger = createLogger({ service: 'OptimizedCaptureManager' });

export interface ScreenshotMetadata {
  filename: string;
  path: string;
  timestamp: string;
  label?: string;
  stepIndex?: number;
  hash?: string;
  size?: number;
  compressed?: boolean;
  isDuplicate?: boolean;
  originalPath?: string;
}

export interface CaptureResult {
  screenshots: ScreenshotMetadata[];
  logsPath?: string;
  issues: Issue[];
}

export interface OptimizedCaptureOptions extends OptimizationOptions {
  enableOptimization?: boolean;
}

/**
 * Optimized Capture Manager with screenshot optimization
 */
export class OptimizedCaptureManager implements ICaptureManager {
  private sessionDir: string;
  private screenshots: ScreenshotMetadata[] = [];
  private issues: Issue[] = [];
  private optimizer?: ScreenshotOptimizer;
  private enableOptimization: boolean;

  constructor(sessionDir: string, options: OptimizedCaptureOptions = {}) {
    this.sessionDir = sessionDir;
    this.enableOptimization = options.enableOptimization ?? true;

    // Create directories
    try {
      mkdirSync(join(sessionDir, 'screenshots'), { recursive: true });
      mkdirSync(join(sessionDir, 'logs'), { recursive: true });
    } catch (error) {
      logger.warn('Failed to create capture directories', { error });
    }

    // Initialize optimizer if enabled
    if (this.enableOptimization) {
      this.optimizer = createScreenshotOptimizer(options);
      logger.info('Screenshot optimization enabled', {
        compression: options.enableCompression ?? true,
        deduplication: options.enableDeduplication ?? true,
        thumbnails: options.enableThumbnails ?? false,
      });
    }
  }

  /**
   * Get captured issues
   */
  getIssues(): Issue[] {
    return [...this.issues];
  }

  /**
   * Take an optimized screenshot
   */
  async takeScreenshot(
    page: ReturnType<Stagehand['context']['pages']>[0] | undefined | null,
    label?: string,
    stepIndex?: number
  ): Promise<ScreenshotMetadata | null> {
    // Check if page exists
    if (!page) {
      logger.warn('Cannot take screenshot: page not available');
      return null;
    }

    try {
      const timestamp = getTimestamp().replace(/[:.]/g, '-').slice(0, -5);
      const filename = label ? `${label}_${timestamp}.png` : `screenshot_${timestamp}.png`;
      const filepath = join(this.sessionDir, 'screenshots', filename);

      // Check if page has screenshot method
      if (typeof page.screenshot !== 'function') {
        logger.warn('Page does not have screenshot method available');
        return null;
      }

      // Take screenshot
      const buffer = await page.screenshot({ fullPage: false });

      // Optimize if enabled
      let metadata: ScreenshotMetadata = {
        filename,
        path: filepath,
        timestamp: getTimestamp(),
        label,
        stepIndex,
      };

      if (this.optimizer) {
        const optimized = await this.optimizer.optimize(
          buffer,
          filepath,
          this.sessionDir
        );

        metadata = {
          ...metadata,
          hash: optimized.hash,
          size: optimized.size,
          compressed: optimized.compressed,
          isDuplicate: optimized.isDuplicate,
          originalPath: optimized.originalPath,
        };

        if (optimized.isDuplicate) {
          logger.info('Duplicate screenshot detected, skipping save', {
            filename,
            originalPath: optimized.originalPath,
          });
        } else {
          logger.info('Screenshot saved and optimized', {
            filename,
            size: optimized.size,
            compressed: optimized.compressed,
          });
        }
      } else {
        // Save without optimization
        writeFileSync(filepath, buffer);
        logger.info('Screenshot saved', { filename });
      }

      this.screenshots.push(metadata);
      return metadata;
    } catch (error) {
      logger.error('Failed to take screenshot', { error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.issues.push(
        createIssue('screenshot_failed', `Failed to capture screenshot: ${errorMessage}`)
      );
      return null;
    }
  }

  /**
   * Capture baseline screenshot after page load
   */
  async captureBaseline(
    page: ReturnType<Stagehand['context']['pages']>[0]
  ): Promise<ScreenshotMetadata | null> {
    return this.takeScreenshot(page, 'baseline', -1);
  }

  /**
   * Save console logs
   */
  async saveConsoleLogs(logs: string[]): Promise<string | null> {
    if (!logs || logs.length === 0) {
      logger.debug('No console logs to save');
      return null;
    }

    try {
      const logPath = join(this.sessionDir, 'logs', 'console.log');
      const logContent = logs.join('\n');
      writeFileSync(logPath, logContent, 'utf-8');
      logger.info('Console logs saved', { logPath, entries: logs.length });
      return logPath;
    } catch (error) {
      logger.error('Failed to save console logs', { error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.issues.push(
        createIssue('log_failed', `Failed to save console logs: ${errorMessage}`)
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

  /**
   * Get optimizer statistics
   */
  getOptimizerStats() {
    return this.optimizer?.getStats() || null;
  }
}
