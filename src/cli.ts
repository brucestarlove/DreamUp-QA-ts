#!/usr/bin/env bun
/**
 * CLI Entry Point - QA Agent for Browser Games
 * Refactored to use Test Orchestrator for better testability and reusability
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { loadConfig } from './config.js';
import { generateSessionId } from './utils/time.js';
import { writeInitialResult } from './reporter.js';
import { createTestOrchestrator } from './services/container.js';
import { OraProgressReporter } from './interfaces/ora-progress-reporter.js';
import { createLogger } from './observability/structured-logger.js';
import type { TestResult } from './reporter.js';

const program = new Command();
const logger = createLogger({ service: 'cli' });

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
    const startTime = Date.now();

    try {
      // Load configuration
      logger.info('Loading configuration', { configPath: options.config });
      const config = loadConfig(options.config);

      // Generate session directory
      const sessionId = generateSessionId();
      const outputDir = options.outputDir || 'results';
      const sessionDir = join(process.cwd(), outputDir, sessionId);
      mkdirSync(sessionDir, { recursive: true });

      logger.info('Test session started', {
        sessionId,
        gameUrl,
        sessionDir,
        configPath: options.config,
      });

      // Write initial output.json so the session appears in the dashboard immediately
      writeInitialResult(gameUrl, sessionDir, options.config);

      // Create progress reporter
      const progressReporter = new OraProgressReporter();

      // Create test orchestrator with dependency injection
      progressReporter.start('Initializing QA agent...');
      const orchestrator = await createTestOrchestrator({
        config,
        sessionDir,
        headless: !options.headed,
        progressReporter,
      });
      progressReporter.succeed('QA agent initialized');

      // Execute test
      const { result, resultPath } = await orchestrator.executeTest({
        gameUrl,
        config,
        sessionDir,
        configPath: options.config ? join(process.cwd(), options.config) : undefined,
        enableLLM: options.llm || false,
        llmModel: options.model,
      });

      // Display summary
      displaySummary(result, resultPath);

      // Exit with appropriate code
      process.exit(result.status === 'pass' ? 0 : 1);
    } catch (error) {
      handleError(error, logger);
      process.exit(1);
    }
  });

/**
 * Display test summary
 */
function displaySummary(result: TestResult, resultPath: string): void {
  console.log('\n' + chalk.bold('Test Summary:'));
  console.log(
    chalk[result.status === 'pass' ? 'green' : 'red'](`Status: ${result.status.toUpperCase()}`)
  );
  console.log(chalk.cyan(`Score: ${result.playability_score.toFixed(2)}`));
  console.log(chalk.yellow(`Issues: ${result.issues.length}`));
  console.log(chalk.blue(`Duration: ${result.test_duration}s`));

  // Show action method breakdown
  if (result.action_methods) {
    const { cua, dom, none } = result.action_methods;
    console.log(chalk.magenta(`Actions: CUA=${cua}, DOM=${dom}, Other=${none}`));
  }

  // Show LLM usage if available
  if (result.llm_usage) {
    const usage = result.llm_usage;
    console.log(
      chalk.cyan(
        `LLM Usage: ${usage.totalCalls} calls, ${usage.totalTokens} tokens, $${usage.estimatedCost.toFixed(4)}`
      )
    );
  }

  // Show agent responses if available (for agent actions)
  if (result.agent_responses && result.agent_responses.length > 0) {
    console.log('\n' + chalk.bold('Agent Responses:'));
    result.agent_responses.forEach((agentResult, index) => {
      if (agentResult.message) {
        console.log(chalk.green(`  ${index + 1}. ${agentResult.message}`));
      }
      if (agentResult.stepsExecuted !== undefined) {
        console.log(chalk.gray(`     (${agentResult.stepsExecuted} steps executed)`));
      }
    });
  }

  console.log(chalk.gray(`Results: ${resultPath}`));

  if (result.issues.length > 0) {
    console.log('\n' + chalk.red('Issues:'));
    result.issues.forEach((issue) => {
      const actionInfo =
        issue.actionIndex !== undefined ? ` [Action ${issue.actionIndex + 1}]` : '';
      console.log(chalk.red(`  - [${issue.type}]${actionInfo} ${issue.description}`));
    });
  }
}

/**
 * Handle errors with structured logging
 */
function handleError(error: unknown, logger: ReturnType<typeof createLogger>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(chalk.red('\nError:'), errorMessage);
  if (errorStack) {
    console.error(chalk.gray(errorStack));
  }

  logger.error('Test failed', error as Error);
}

// Parse command line arguments
program.parse();
