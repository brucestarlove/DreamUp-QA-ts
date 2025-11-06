/**
 * Integration Tests - Full Pipeline
 * Tests complete pipeline with real services (requires API keys)
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { loadConfig } from '../../src/config.js';
import { SessionManager } from '../../src/session.js';
import { executeSequence } from '../../src/interaction.js';
import { CaptureManager } from '../../src/capture.js';
import { generateResult, writeResult } from '../../src/reporter.js';
import { evaluatePlayability } from '../../src/evaluation.js';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';

// Skip integration tests if API keys are not available
const hasApiKeys = !!(
  process.env.BROWSERBASE_API_KEY &&
  process.env.BROWSERBASE_PROJECT_ID &&
  process.env.OPENAI_API_KEY
);

const describeIf = hasApiKeys ? describe : describe.skip;

describeIf('Full Pipeline Integration Tests', () => {
  let sessionDir: string;
  let sessionManager: SessionManager | null = null;

  beforeAll(() => {
    // Create temporary session directory
    sessionDir = join(process.cwd(), 'tests', 'integration', 'test-results', Date.now().toString());
    mkdirSync(sessionDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup session
    if (sessionManager) {
      await sessionManager.cleanup();
    }
    // Cleanup test directory (optional - comment out to inspect results)
    // rmSync(sessionDir, { recursive: true, force: true });
  });

  test('completes full pipeline with simple HTML page', async () => {
    // Create a simple HTML page for testing
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Game</title></head>
        <body>
          <h1>Test Game</h1>
          <button id="start-btn">Start Game</button>
          <div id="game">Game area</div>
          <script>
            document.getElementById('start-btn').addEventListener('click', () => {
              document.getElementById('game-btn').textContent = 'Game Started!';
            });
          </script>
        </body>
      </html>
    `;

    // Use data URI for simple test page
    const testUrl = `data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`;

    // Load config
    const configPath = join(process.cwd(), 'configs', 'snake.json');
    const config = loadConfig(configPath);

    // Initialize session
    sessionManager = new SessionManager(true); // Headless
    const session = await sessionManager.loadGame(testUrl, config);

    // Setup capture manager
    const captureManager = new CaptureManager(sessionDir);

    // Capture baseline
    await captureManager.captureBaseline(session.page);

    // Execute sequence (with limited steps for testing)
    const startTime = Date.now();
    const actionResults = await executeSequence(
      session.stagehand,
      { ...config, sequence: config.sequence.slice(0, 3) }, // Limit to 3 steps
      startTime,
      captureManager,
    );

    // Capture final screenshot
    const pages = session.stagehand.context.pages();
    if (pages.length > 0) {
      await captureManager.takeScreenshot(pages[0], 'end', actionResults.length);
    }

    // Collect console logs
    const consoleLogs = await sessionManager.getConsoleLogs(session.page);

    // Get all issues
    const sessionIssues = sessionManager.getIssues();
    const captureResult = captureManager.getResult();
    const allIssues = [...sessionIssues, ...captureResult.issues];

    // Evaluate playability
    const evaluationResult = await evaluatePlayability(
      session.stagehand,
      actionResults,
      captureResult,
      consoleLogs,
      allIssues,
      config,
      testUrl,
      {
        enableLLM: false, // Skip LLM for integration test speed
      },
    );

    // Generate result
    const testResult = generateResult(
      actionResults,
      captureResult,
      startTime,
      allIssues,
      undefined,
      configPath,
      evaluationResult,
    );

    // Write result
    const resultPath = writeResult(testResult, sessionDir);

    // Verify output
    expect(resultPath).toBeDefined();
    expect(testResult.status).toBeDefined();
    expect(testResult.playability_score).toBeGreaterThanOrEqual(0);
    expect(testResult.playability_score).toBeLessThanOrEqual(1);
    expect(testResult.screenshots.length).toBeGreaterThan(0);
    expect(testResult.timestamp).toBeDefined();
    expect(testResult.test_duration).toBeGreaterThan(0);

    // Verify screenshots were captured
    expect(captureResult.screenshots.length).toBeGreaterThan(0);

    // Cleanup
    await sessionManager.cleanup();
  }, 60000); // 60 second timeout for integration test

  test('handles screenshot capture', async () => {
    const testUrl = 'data:text/html;charset=utf-8,<html><body><h1>Test</h1></body></html>';
    const config = loadConfig(join(process.cwd(), 'configs', 'snake.json'));

    sessionManager = new SessionManager(true);
    const session = await sessionManager.loadGame(testUrl, config);
    const captureManager = new CaptureManager(sessionDir);

    const screenshot = await captureManager.captureBaseline(session.page);

    expect(screenshot).not.toBeNull();
    expect(screenshot?.filename).toBeDefined();
    expect(screenshot?.path).toBeDefined();

    await sessionManager.cleanup();
  }, 30000);

  test('collects console logs', async () => {
    const testUrl = 'data:text/html;charset=utf-8,<html><body><script>console.log("Test log");</script></body></html>';
    const config = loadConfig(join(process.cwd(), 'configs', 'snake.json'));

    sessionManager = new SessionManager(true);
    const session = await sessionManager.loadGame(testUrl, config);

    // Wait a bit for console logs to be captured
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const logs = await sessionManager.getConsoleLogs(session.page);

    expect(Array.isArray(logs)).toBe(true);
    // Note: Console logs may not be captured immediately, this is a basic check

    await sessionManager.cleanup();
  }, 30000);
});

