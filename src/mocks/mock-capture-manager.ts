/**
 * Mock Capture Manager
 * Mock implementation for testing screenshot and log capture
 */

import type {
  ICaptureManager,
  ScreenshotMetadata,
  CaptureResult,
} from '../interfaces/capture-manager.interface.js';
import type { Issue } from '../utils/errors.js';

/**
 * Mock Capture Manager for testing
 */
export class MockCaptureManager implements ICaptureManager {
  private screenshots: ScreenshotMetadata[] = [];
  private logs: string[] = [];
  private issues: Issue[] = [];
  private shouldFail: boolean;

  constructor(options: { shouldFail?: boolean } = {}) {
    this.shouldFail = options.shouldFail ?? false;
  }

  /**
   * Take a mock screenshot
   */
  async takeScreenshot(
    page: any,
    label?: string,
    stepIndex?: number
  ): Promise<ScreenshotMetadata | null> {
    if (this.shouldFail) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const filename = label ? `${label}_mock.png` : `screenshot_mock.png`;

    const metadata: ScreenshotMetadata = {
      filename,
      path: `/mock/screenshots/${filename}`,
      timestamp,
      label,
      stepIndex,
    };

    this.screenshots.push(metadata);
    return metadata;
  }

  /**
   * Capture baseline screenshot
   */
  async captureBaseline(page: any): Promise<ScreenshotMetadata | null> {
    return this.takeScreenshot(page, 'baseline', -1);
  }

  /**
   * Save mock console logs
   */
  async saveConsoleLogs(logs: string[]): Promise<string | null> {
    if (this.shouldFail) {
      return null;
    }

    this.logs = [...logs];
    return '/mock/logs/console.log';
  }

  /**
   * Get screenshots
   */
  getScreenshots(): ScreenshotMetadata[] {
    return [...this.screenshots];
  }

  /**
   * Get issues
   */
  getIssues(): Issue[] {
    return [...this.issues];
  }

  /**
   * Get capture result
   */
  getResult(logsPath?: string): CaptureResult {
    return {
      screenshots: this.getScreenshots(),
      logsPath: logsPath || (this.logs.length > 0 ? '/mock/logs/console.log' : undefined),
      issues: this.getIssues(),
    };
  }

  /**
   * Get captured logs (for testing)
   */
  getMockLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Set failure mode (for testing)
   */
  setFailureMode(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  /**
   * Clear all captures (for testing)
   */
  clear(): void {
    this.screenshots = [];
    this.logs = [];
    this.issues = [];
  }
}

/**
 * Create a mock capture manager
 */
export function createMockCaptureManager(options?: {
  shouldFail?: boolean;
}): MockCaptureManager {
  return new MockCaptureManager(options);
}
