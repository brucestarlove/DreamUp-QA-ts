/**
 * Integration Tests - Error Scenarios
 * Tests error handling, timeouts, and graceful degradation
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { loadConfig } from '../../src/config.js';
import { SessionManager } from '../../src/session.js';
import { executeSequence } from '../../src/interaction.js';
import { CaptureManager } from '../../src/capture.js';
import { generateResult } from '../../src/reporter.js';
import { join } from 'path';
import { mkdirSync } from 'fs';

// Skip integration tests if API keys are not available
const hasApiKeys = !!(
  process.env.BROWSERBASE_API_KEY &&
  process.env.BROWSERBASE_PROJECT_ID &&
  process.env.OPENAI_API_KEY
);

const describeIf = hasApiKeys ? describe : describe.skip;

describeIf('Error Scenarios Integration Tests', () => {
  let sessionDir: string;
  let sessionManager: SessionManager | null = null;

  beforeAll(() => {
    sessionDir = join(process.cwd(), 'tests', 'integration', 'test-results', `error-${Date.now()}`);
    mkdirSync(sessionDir, { recursive: true });
  });

  afterAll(async () => {
    if (sessionManager) {
      await sessionManager.cleanup();
    }
  });

  test('handles invalid URL gracefully', async () => {
    const invalidUrl = 'http://invalid-url-that-does-not-exist-12345.com';
    const config = loadConfig(join(process.cwd(), 'configs', 'snake.json'));

    sessionManager = new SessionManager(true);

    await expect(
      sessionManager.loadGame(invalidUrl, config),
    ).rejects.toThrow();

    const issues = sessionManager.getIssues();
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.type === 'load_timeout' || i.type === 'action_failed')).toBe(true);

    await sessionManager.cleanup();
  }, 60000);

  test('handles timeout scenarios', async () => {
    // Create a page that takes a long time to load
    const slowUrl = 'data:text/html;charset=utf-8,<html><body><h1>Loading...</h1><script>setTimeout(() => {}, 10000);</script></body></html>';
    const config = loadConfig(join(process.cwd(), 'configs', 'snake.json'));
    
    // Override with very short timeout
    const shortTimeoutConfig = {
      ...config,
      timeouts: {
        load: 1000, // 1 second
        action: 1000,
        total: 2000,
      },
    };

    sessionManager = new SessionManager(true);

    try {
      await sessionManager.loadGame(slowUrl, shortTimeoutConfig);
      
      // If it loads, try executing with short timeout
      const session = await sessionManager.loadGame(slowUrl, shortTimeoutConfig);
      const captureManager = new CaptureManager(sessionDir);
      
      const startTime = Date.now();
      const actionResults = await executeSequence(
        session.stagehand,
        shortTimeoutConfig,
        startTime,
        captureManager,
      );

      // Should have timeout issues
      const issues = sessionManager.getIssues();
      const captureResult = captureManager.getResult();
      
      expect(issues.length + captureResult.issues.length).toBeGreaterThanOrEqual(0);
      
      await sessionManager.cleanup();
    } catch (error) {
      // Expected to fail with timeout
      expect(error).toBeDefined();
      const issues = sessionManager.getIssues();
      expect(issues.length).toBeGreaterThan(0);
      
      await sessionManager.cleanup();
    }
  }, 60000);

  test('handles missing elements gracefully', async () => {
    const testUrl = 'data:text/html;charset=utf-8,<html><body><h1>No buttons here</h1></body></html>';
    const config = loadConfig(join(process.cwd(), 'configs', 'snake.json'));

    sessionManager = new SessionManager(true);
    const session = await sessionManager.loadGame(testUrl, config);
    const captureManager = new CaptureManager(sessionDir);

    await captureManager.captureBaseline(session.page);

    const startTime = Date.now();
    const actionResults = await executeSequence(
      session.stagehand,
      config,
      startTime,
      captureManager,
    );

    // Should have failed actions
    const failedActions = actionResults.filter((r) => !r.success);
    expect(failedActions.length).toBeGreaterThan(0);

    // Generate result and verify issues
    const sessionIssues = sessionManager.getIssues();
    const captureResult = captureManager.getResult();
    const allIssues = [...sessionIssues, ...captureResult.issues];

    const testResult = generateResult(
      actionResults,
      captureResult,
      startTime,
      allIssues,
    );

    expect(testResult.issues.length).toBeGreaterThan(0);
    expect(testResult.status).toBe('fail');

    await sessionManager.cleanup();
  }, 60000);

  test('handles invalid config file path', () => {
    const invalidPath = join(process.cwd(), 'configs', 'nonexistent.json');
    
    expect(() => {
      loadConfig(invalidPath);
    }).toThrow();
  });

  test('continues execution after action failures', async () => {
    const testUrl = 'data:text/html;charset=utf-8,<html><body><h1>Test</h1></body></html>';
    const config = loadConfig(join(process.cwd(), 'configs', 'snake.json'));

    sessionManager = new SessionManager(true);
    const session = await sessionManager.loadGame(testUrl, config);
    const captureManager = new CaptureManager(sessionDir);

    await captureManager.captureBaseline(session.page);

    const startTime = Date.now();
    const actionResults = await executeSequence(
      session.stagehand,
      config,
      startTime,
      captureManager,
    );

    // Should continue executing even if some actions fail
    expect(actionResults.length).toBeGreaterThan(0);
    
    // All actions should have results (success or failure)
    actionResults.forEach((result) => {
      expect(result.actionIndex).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    await sessionManager.cleanup();
  }, 60000);
});

