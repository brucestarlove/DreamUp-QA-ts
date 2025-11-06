/**
 * Unit Tests - Reporter
 * Tests result generation and JSON output formatting
 */

import { describe, test, expect } from 'bun:test';
import { generateResult } from '../../src/reporter.js';
import type { ActionResult } from '../../src/interaction.js';
import type { CaptureResult } from '../../src/capture.js';
import type { Issue } from '../../src/utils/errors.js';
import type { CUAUsageMetrics } from '../../src/cua.js';
import { mockActionResults } from '../fixtures/mock-game-responses.js';

describe('Reporter', () => {
  describe('generateResult', () => {
    const gameUrl = 'https://example.com/game';
    test('generates pass result for successful actions', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [
          { filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' },
          { filename: 'end.png', path: '/test', timestamp: '2025-01-15T12:00:01Z' },
        ],
        issues: [],
      };
      const startTime = Date.now() - 5000; // 5 seconds ago

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.status).toBe('pass');
      expect(result.playability_score).toBeGreaterThan(0);
      expect(result.issues.length).toBe(0);
      expect(result.screenshots.length).toBe(2);
      expect(result.timestamp).toBeDefined();
      expect(result.test_duration).toBeGreaterThan(0);
    });

    test('generates fail result for failed actions', () => {
      const actionResults: ActionResult[] = mockActionResults.allFailure;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const startTime = Date.now() - 3000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.status).toBe('fail');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('aggregates issues from multiple sources', () => {
      const actionResults: ActionResult[] = [
        ...mockActionResults.allSuccess,
        ...mockActionResults.allFailure,
      ];
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [
          { type: 'screenshot_failed', description: 'Screenshot error', timestamp: '2025-01-15T12:00:00Z' },
        ],
      };
      const additionalIssues: Issue[] = [
        { type: 'load_timeout', description: 'Load timeout', timestamp: '2025-01-15T12:00:00Z' },
      ];
      const startTime = Date.now() - 4000;

      const result = generateResult(
        actionResults,
        captureResult,
        startTime,
        gameUrl,
        additionalIssues,
      );

      expect(result.issues.length).toBeGreaterThan(1);
      expect(result.issues.some((i) => i.type === 'screenshot_failed')).toBe(true);
      expect(result.issues.some((i) => i.type === 'load_timeout')).toBe(true);
      // Also check that failed action issues are included
      expect(result.issues.some((i) => i.type === 'action_failed' || i.type === 'action_timeout')).toBe(true);
    });

    test('calculates action method breakdown', () => {
      const actionResults: ActionResult[] = [
        { success: true, actionIndex: 0, methodUsed: 'cua' as const },
        { success: true, actionIndex: 1, methodUsed: 'dom' as const },
        { success: true, actionIndex: 2, methodUsed: 'dom' as const },
        { success: true, actionIndex: 3, methodUsed: 'none' as const },
      ];
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const startTime = Date.now() - 2000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.action_methods).toBeDefined();
      expect(result.action_methods?.cua).toBe(1);
      expect(result.action_methods?.dom).toBe(2);
      expect(result.action_methods?.none).toBe(1);
    });

    test('includes LLM usage metrics when provided', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const cuaUsage: CUAUsageMetrics = {
        totalCalls: 5,
        totalInputTokens: 10000,
        totalOutputTokens: 2000,
        totalTokens: 12000,
        estimatedCost: 0.15,
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl, [], cuaUsage);

      expect(result.llm_usage).toBeDefined();
      expect(result.llm_usage?.totalCalls).toBe(5);
      expect(result.llm_usage?.totalTokens).toBe(12000);
      expect(result.llm_usage?.estimatedCost).toBe(0.15);
      expect(result.cost_estimate).toEqual(result.llm_usage);
    });

    test('includes evaluation result when provided', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const evaluationResult = {
        heuristicScore: 0.85,
        llmScore: 0.9,
        llmConfidence: 0.95,
        finalScore: 0.87,
        issues: ['Minor issue'],
        gameState: {
          gameOver: true,
          victory: true,
          score: 100,
        },
        evaluationTokens: {
          promptTokens: 2000,
          completionTokens: 100,
          totalTokens: 2100,
        },
        cacheHit: false,
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(
        actionResults,
        captureResult,
        startTime,
        gameUrl,
        [],
        undefined, // cuaUsage
        undefined, // configPath
        evaluationResult,
      );

      expect(result.evaluation).toBeDefined();
      expect(result.evaluation?.heuristic_score).toBe(0.85);
      expect(result.evaluation?.llm_score).toBe(0.9);
      expect(result.evaluation?.final_score).toBe(0.87);
      expect(result.evaluation?.game_state?.victory).toBe(true);
      expect(result.playability_score).toBe(0.87);
    });

    test('includes config path when provided', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(
        actionResults,
        captureResult,
        startTime,
        gameUrl,
        [],
        undefined,
        '/path/to/config.json',
      );

      expect(result.config_path).toBe('/path/to/config.json');
    });

    test('includes agent responses when available', () => {
      const actionResults: ActionResult[] = [
        {
          success: true,
          actionIndex: 0,
          methodUsed: 'cua' as const,
          agentResult: {
            message: 'Game completed successfully',
            stepsExecuted: 5,
            success: true,
          },
        },
      ];
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.agent_responses).toBeDefined();
      expect(result.agent_responses?.length).toBe(1);
      expect(result.agent_responses?.[0].message).toBe('Game completed successfully');
      expect(result.agent_responses?.[0].stepsExecuted).toBe(5);
    });

    test('includes console logs path when available', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
        logsPath: '/path/to/logs/console.log',
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.browser_console_logs).toBe('/path/to/logs/console.log');
    });

    test('calculates test duration correctly', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const startTime = Date.now() - 5000; // 5 seconds ago

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.test_duration).toBeGreaterThanOrEqual(4);
      expect(result.test_duration).toBeLessThanOrEqual(6); // Allow some variance
    });

    test('includes screenshot metadata', () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [
          {
            filename: 'baseline.png',
            path: '/test/baseline.png',
            timestamp: '2025-01-15T12:00:00Z',
            label: 'baseline',
            stepIndex: -1,
          },
        ],
        issues: [],
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.screenshot_metadata).toBeDefined();
      expect(result.screenshot_metadata?.length).toBe(1);
      expect(result.screenshot_metadata?.[0].label).toBe('baseline');
    });

    test('includes action timings', () => {
      const actionResults: ActionResult[] = [
        {
          success: true,
          actionIndex: 0,
          executionTime: 100,
          timestamp: '2025-01-15T12:00:00Z',
        },
        {
          success: true,
          actionIndex: 1,
          executionTime: 200,
          timestamp: '2025-01-15T12:00:01Z',
        },
      ];
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const startTime = Date.now() - 1000;

      const result = generateResult(actionResults, captureResult, startTime, gameUrl);

      expect(result.action_timings).toBeDefined();
      expect(result.action_timings?.length).toBe(2);
      expect(result.action_timings?.[0].executionTime).toBe(100);
    });
  });
});

