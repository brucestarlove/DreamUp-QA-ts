/**
 * Test Orchestrator
 * Orchestrates the entire test execution flow
 * Extracted from cli.ts to improve testability and reusability
 */

import type { Config } from '../config.js';
import type { ISessionManager } from '../interfaces/session-manager.interface.js';
import type { ICaptureManager } from '../interfaces/capture-manager.interface.js';
import type { ICUAManager } from '../interfaces/cua-manager.interface.js';
import type { IProgressReporter } from '../interfaces/progress-reporter.interface.js';
import type { TestResult } from '../reporter.js';
import type { ActionResult } from '../interaction.js';
import { executeSequence } from '../interaction.js';
import { generateResult, writeResult } from '../reporter.js';
import { evaluatePlayability } from '../evaluation.js';
import { createLogger } from '../observability/structured-logger.js';

export interface TestExecutionOptions {
  gameUrl: string;
  config: Config;
  sessionDir: string;
  configPath?: string;
  enableLLM?: boolean;
  llmModel?: string;
}

export interface TestExecutionResult {
  result: TestResult;
  resultPath: string;
}

/**
 * Orchestrates test execution with dependency injection
 */
export class TestOrchestrator {
  private logger = createLogger({ service: 'test-orchestrator' });

  constructor(
    private sessionManager: ISessionManager,
    private captureManager: ICaptureManager,
    private progressReporter: IProgressReporter,
    private cuaManager?: ICUAManager
  ) {}

  /**
   * Execute a complete test
   */
  async executeTest(options: TestExecutionOptions): Promise<TestExecutionResult> {
    const { gameUrl, config, sessionDir, configPath, enableLLM, llmModel } = options;
    const startTime = Date.now();

    this.logger.info('Starting test execution', {
      gameUrl,
      sessionDir,
      configPath,
      enableLLM,
    });

    try {
      // Initialize session
      this.progressReporter.start('Initializing browser session...');
      const session = await this.sessionManager.loadGame(gameUrl, config);
      this.progressReporter.succeed('Browser session initialized');

      this.logger.info('Session initialized', {
        state: this.sessionManager.getState(),
      });

      // Capture baseline screenshot
      this.progressReporter.start('Capturing baseline screenshot...');
      await this.captureManager.captureBaseline(session.page);
      this.progressReporter.succeed('Baseline screenshot captured');

      // Execute action sequence
      this.progressReporter.start('Executing test sequence...');
      const actionResults = await executeSequence(
        session.stagehand,
        config,
        startTime,
        this.captureManager,
        (result) => this.handleActionComplete(result),
        this.cuaManager
      );

      const successfulActions = actionResults.filter((r) => r.success).length;
      this.progressReporter.succeed(
        `Executed ${successfulActions}/${actionResults.length} actions successfully`
      );

      this.logger.info('Action sequence completed', {
        total: actionResults.length,
        successful: successfulActions,
        failed: actionResults.length - successfulActions,
      });

      // Capture final screenshot
      await this.captureFinalScreenshot(session, actionResults.length);

      // Collect console logs
      const logsPath = await this.collectConsoleLogs(session);

      // Collect all issues
      const sessionIssues = this.sessionManager.getIssues();
      const captureResult = this.captureManager.getResult(logsPath || undefined);
      const allIssues = [...sessionIssues, ...captureResult.issues];

      this.logger.info('Issues collected', {
        sessionIssues: sessionIssues.length,
        captureIssues: captureResult.issues.length,
        total: allIssues.length,
      });

      // Get CUA usage metrics
      const cuaUsage = this.cuaManager?.getUsageMetrics();

      // Run evaluation
      const evaluationResult = await this.evaluatePlayability(
        session,
        actionResults,
        captureResult,
        allIssues,
        config,
        gameUrl,
        enableLLM,
        llmModel
      );

      // Generate and write result
      this.progressReporter.start('Generating test report...');
      const testResult = generateResult(
        actionResults,
        captureResult,
        startTime,
        gameUrl,
        allIssues,
        cuaUsage,
        configPath,
        evaluationResult
      );

      const resultPath = writeResult(testResult, sessionDir);
      this.progressReporter.succeed('Test report generated');

      this.logger.info('Test completed', {
        status: testResult.status,
        score: testResult.playability_score,
        duration: testResult.test_duration,
        issues: testResult.issues.length,
      });

      // Cleanup
      await this.sessionManager.cleanup();

      return {
        result: testResult,
        resultPath,
      };
    } catch (error) {
      this.logger.error('Test execution failed', error as Error, {
        gameUrl,
        sessionDir,
      });

      // Attempt cleanup even on error
      try {
        await this.sessionManager.cleanup();
      } catch (cleanupError) {
        this.logger.error('Cleanup failed', cleanupError as Error);
      }

      throw error;
    }
  }

  /**
   * Handle action completion callback
   */
  private handleActionComplete(result: ActionResult): void {
    if (!result.success) {
      this.progressReporter.warn(`Action ${result.actionIndex + 1} failed: ${result.error}`);
      this.logger.warn('Action failed', {
        actionIndex: result.actionIndex,
        error: result.error,
        action: result.action,
      });
    } else if (result.action) {
      this.logger.debug('Action completed', {
        actionIndex: result.actionIndex,
        action: result.action,
        executionTime: result.executionTime,
        methodUsed: result.methodUsed,
      });
    }
  }

  /**
   * Capture final screenshot with error handling
   */
  private async captureFinalScreenshot(
    session: any,
    actionCount: number
  ): Promise<void> {
    this.progressReporter.start('Capturing final screenshot...');
    try {
      const pages = session.stagehand.context.pages();
      const page = pages.length > 0 ? pages[0] : null;

      if (page) {
        const screenshotResult = await this.captureManager.takeScreenshot(page, 'end', actionCount);
        if (screenshotResult) {
          this.progressReporter.succeed('Final screenshot captured');
        } else {
          this.progressReporter.warn('Final screenshot skipped (page unavailable)');
        }
      } else {
        this.progressReporter.warn('Final screenshot skipped (browser connection closed)');
        this.logger.warn('Cannot capture final screenshot: browser connection is closed');
      }
    } catch (error) {
      this.progressReporter.warn('Failed to capture final screenshot');
      this.logger.error('Final screenshot capture failed', error as Error);
    }
  }

  /**
   * Collect console logs with error handling
   */
  private async collectConsoleLogs(session: any): Promise<string | null> {
    this.progressReporter.start('Collecting console logs...');
    try {
      const pages = session.stagehand.context.pages();
      const page = pages.length > 0 ? pages[0] : null;
      const logs = page ? await this.sessionManager.getConsoleLogs(page) : [];
      const logsPath = await this.captureManager.saveConsoleLogs(logs);

      if (logsPath) {
        this.progressReporter.succeed('Console logs collected');
        this.logger.info('Console logs saved', { logsPath, count: logs.length });
      } else {
        this.progressReporter.warn('Console logs skipped (page unavailable)');
      }

      return logsPath;
    } catch (error) {
      this.progressReporter.warn('Failed to collect console logs');
      this.logger.error('Console log collection failed', error as Error);

      // Continue with empty logs
      const logsPath = await this.captureManager.saveConsoleLogs([]);
      return logsPath;
    }
  }

  /**
   * Evaluate playability with error handling
   */
  private async evaluatePlayability(
    session: any,
    actionResults: ActionResult[],
    captureResult: any,
    issues: any[],
    config: Config,
    gameUrl: string,
    enableLLM?: boolean,
    llmModel?: string
  ): Promise<any> {
    this.progressReporter.start('Evaluating playability...');
    try {
      const pages = session.stagehand.context.pages();
      const page = pages.length > 0 ? pages[0] : null;
      const consoleLogs = page ? await this.sessionManager.getConsoleLogs(page) : [];

      const evaluationResult = await evaluatePlayability(
        session.stagehand,
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        config,
        gameUrl,
        {
          enableLLM: enableLLM || false,
          model: llmModel || 'gpt-4o-mini',
        }
      );

      this.progressReporter.succeed('Playability evaluation completed');
      this.logger.info('Evaluation completed', {
        heuristicScore: evaluationResult.heuristicScore,
        llmScore: evaluationResult.llmScore,
        finalScore: evaluationResult.finalScore,
      });

      return evaluationResult;
    } catch (error) {
      this.progressReporter.warn('Evaluation failed, using heuristic-only score');
      this.logger.warn('Evaluation error', error as Error);
      return undefined;
    }
  }
}
