#!/usr/bin/env bun
/**
 * CLI Entry Point - QA Agent for Browser Games
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { loadConfig } from './config.js';
import { SessionManager } from './session.js';
import { executeSequence } from './interaction.js';
import { CaptureManager } from './capture.js';
import { generateResult, writeResult } from './reporter.js';
import { generateSessionId } from './utils/time.js';

const program = new Command();

program
  .name('qa-agent')
  .description('Agent-driven browser game QA system')
  .version('0.1.0');

program
  .command('test')
  .description('Test a browser game')
  .argument('<game-url>', 'URL of the game to test')
  .option('-c, --config <file>', 'Path to config file')
  .option('--headed', 'Run in headed (visible) browser mode', false)
  .option('--retries <number>', 'Number of retries for page load (currently unused, will be used in Phase 2)', '3')
  .option('-o, --output-dir <dir>', 'Output directory for results', 'results')
  .option('--llm', 'Enable LLM-based evaluation', false)
  .option('--model <model>', 'Override LLM model')
  .action(async (gameUrl: string, options) => {
    const spinner = ora('Initializing QA agent...').start();
    const startTime = Date.now();

    try {
      // Load configuration
      spinner.text = 'Loading configuration...';
      const config = loadConfig(options.config);

      // Generate session directory
      const sessionId = generateSessionId();
      const outputDir = options.outputDir || 'results';
      const sessionDir = join(process.cwd(), outputDir, sessionId);
      const { mkdirSync } = await import('fs');
      mkdirSync(sessionDir, { recursive: true });

      spinner.succeed('Configuration loaded');

      // Initialize session manager
      spinner.start('Initializing browser session...');
      const sessionManager = new SessionManager(!options.headed);
      const session = await sessionManager.loadGame(gameUrl, config);
      spinner.succeed('Browser session initialized');

      // Setup capture manager
      const captureManager = new CaptureManager(sessionDir);

      // Capture baseline screenshot
      spinner.start('Capturing baseline screenshot...');
      await captureManager.captureBaseline(session.page);
      spinner.succeed('Baseline screenshot captured');

      // Execute action sequence
      spinner.start('Executing test sequence...');
      const actionResults = await executeSequence(session.stagehand, config, startTime, captureManager, (result) => {
        if (!result.success) {
          spinner.warn(`Action ${result.actionIndex + 1} failed: ${result.error}`);
        }
      });

      const successfulActions = actionResults.filter((r) => r.success).length;
      spinner.succeed(`Executed ${successfulActions}/${actionResults.length} actions successfully`);

      // Capture final screenshot
      spinner.start('Capturing final screenshot...');
      await captureManager.takeScreenshot(session.page, 'end', actionResults.length);
      spinner.succeed('Final screenshot captured');

      // Collect console logs
      spinner.start('Collecting console logs...');
      const logs = await sessionManager.getConsoleLogs(session.page);
      const logsPath = await captureManager.saveConsoleLogs(logs);
      spinner.succeed('Console logs collected');

      // Collect all issues from session and capture managers
      const sessionIssues = sessionManager.getIssues();
      const captureResult = captureManager.getResult(logsPath || undefined);
      const allIssues = [...sessionIssues, ...captureResult.issues];

      // Generate and write result
      spinner.start('Generating test report...');
      let testResult;
      let resultPath: string;
      
      try {
        testResult = generateResult(actionResults, captureResult, startTime, allIssues);

        // Note: Model override (--model) and LLM evaluation (--llm) are placeholders for Phase 5

        resultPath = writeResult(testResult, sessionDir);
        spinner.succeed('Test report generated');
      } catch (error) {
        spinner.warn('Failed to generate full report, creating minimal report');
        logger.error('Report generation failed:', error);
        
        // Generate minimal report to ensure output is always created
        try {
          const minimalResult = {
            status: 'fail' as const,
            playability_score: 0.0,
            issues: [
              ...allIssues,
              {
                type: 'action_failed' as const,
                description: `Report generation failed: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: new Date().toISOString(),
              },
            ],
            screenshots: captureResult.screenshots.map((s) => s.filename),
            timestamp: new Date().toISOString(),
            test_duration: Math.round((Date.now() - startTime) / 1000),
          };
          resultPath = writeResult(minimalResult, sessionDir);
        } catch (minimalError) {
          // Last resort: write basic JSON
          const { writeFileSync } = await import('fs');
          const emergencyPath = join(sessionDir, 'output.json');
          writeFileSync(
            emergencyPath,
            JSON.stringify(
              {
                status: 'fail',
                error: 'Failed to generate report',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
            'utf-8',
          );
          resultPath = emergencyPath;
          logger.error('Emergency report written:', emergencyPath);
        }
      }

      // Cleanup
      await sessionManager.cleanup();

      // Display summary
      console.log('\n' + chalk.bold('Test Summary:'));
      console.log(chalk[testResult.status === 'pass' ? 'green' : 'red'](`Status: ${testResult.status.toUpperCase()}`));
      console.log(chalk.cyan(`Score: ${testResult.playability_score.toFixed(2)}`));
      console.log(chalk.yellow(`Issues: ${testResult.issues.length}`));
      console.log(chalk.blue(`Duration: ${testResult.test_duration}s`));
      console.log(chalk.gray(`Results: ${resultPath}`));

      if (testResult.issues.length > 0) {
        console.log('\n' + chalk.red('Issues:'));
        testResult.issues.forEach((issue) => {
          const actionInfo = issue.actionIndex !== undefined ? ` [Action ${issue.actionIndex + 1}]` : '';
          console.log(chalk.red(`  - [${issue.type}]${actionInfo} ${issue.description}`));
        });
      }

      process.exit(testResult.status === 'pass' ? 0 : 1);
    } catch (error) {
      spinner.fail('Test failed');
      console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

