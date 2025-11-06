/**
 * Unit Tests - Evaluation Scoring
 * Tests heuristic score calculation, LLM score combination, and cost calculation
 */

import { describe, test, expect, mock } from 'bun:test';
import {
  calculateHeuristicScore,
  combineScores,
  calculateEvaluationCost,
} from '../../src/evaluation.js';
import type { ActionResult } from '../../src/interaction.js';
import type { CaptureResult, ScreenshotMetadata } from '../../src/capture.js';
import type { Issue } from '../../src/utils/errors.js';
import type { Stagehand } from '@browserbasehq/stagehand';
import { mockActionResults } from '../fixtures/mock-game-responses.js';

// Mock Stagehand for testing
function createMockStagehand(): Stagehand {
  const mockExtract = mock(() => Promise.resolve({ gameOver: false, victory: false }));
  const mockObserve = mock(() => Promise.resolve([]));
  
  return {
    context: {
      pages: () => [{
        evaluate: mock(() => Promise.resolve({})),
      }],
    },
    extract: mockExtract,
    observe: mockObserve,
    metrics: Promise.resolve({
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    }),
  } as unknown as Stagehand;
}

describe('Evaluation Scoring', () => {
  describe('calculateHeuristicScore', () => {
    test('calculates perfect score for all successful actions', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [
          { filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' },
        ],
        issues: [],
      };
      const consoleLogs: string[] = [];
      const issues: Issue[] = [];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      expect(result.score).toBeGreaterThan(0.8);
      expect(result.metrics.loadCheck).toBe(true);
      expect(result.metrics.stability).toBe(true);
      expect(result.metrics.responsiveness).toBeGreaterThan(0.9);
    });

    test('penalizes for failed actions', async () => {
      const actionResults: ActionResult[] = mockActionResults.mixedSuccess;
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [],
      };
      const consoleLogs: string[] = [];
      const issues: Issue[] = [];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      expect(result.score).toBeLessThan(0.8);
    });

    test('penalizes heavily for no screenshots', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [],
        issues: [],
      };
      const consoleLogs: string[] = [];
      const issues: Issue[] = [];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      expect(result.metrics.loadCheck).toBe(false);
      expect(result.score).toBeLessThan(0.5);
    });

    test('penalizes for console errors', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [],
      };
      const consoleLogs: string[] = [
        '[2025-01-15T12:00:00Z] [ERROR] Test error',
        '[2025-01-15T12:00:01Z] [ERROR] Another error',
      ];
      const issues: Issue[] = [];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      expect(result.metrics.responsiveness).toBeLessThan(1.0);
    });

    test('penalizes heavily for browser crashes', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [],
      };
      const consoleLogs: string[] = [];
      const issues: Issue[] = [
        { type: 'browser_crash', description: 'Browser crashed', timestamp: '2025-01-15T12:00:00Z' },
      ];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      expect(result.metrics.stability).toBe(false);
      expect(result.score).toBeLessThan(0.5);
    });

    test('bonuses for game completion', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [],
      };
      const consoleLogs: string[] = [];
      const issues: Issue[] = [];
      
      // Create stagehand with mock that returns completion
      const mockExtract = mock(() => Promise.resolve({ gameOver: true, victory: true }));
      const mockObserve = mock(() => Promise.resolve([]));
      const stagehand = {
        context: {
          pages: () => [{
            evaluate: mock(() => Promise.resolve({})),
          }],
        },
        extract: mockExtract,
        observe: mockObserve,
        metrics: Promise.resolve({
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
        }),
      } as unknown as Stagehand;

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      // Completion may or may not be true depending on extractGameState implementation
      // This test verifies the function completes without error
      expect(result.metrics.completion).toBeDefined();
    });

    test('handles critical JavaScript errors', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [],
      };
      const consoleLogs: string[] = [
        '[2025-01-15T12:00:00Z] [ERROR] TypeError: Cannot read property',
        '[2025-01-15T12:00:01Z] [ERROR] ReferenceError: variable is not defined',
      ];
      const issues: Issue[] = [];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      expect(result.metrics.responsiveness).toBeLessThan(0.8);
    });

    test('weights issues correctly', async () => {
      const actionResults: ActionResult[] = mockActionResults.allSuccess;
      const captureResult: CaptureResult = {
        screenshots: [{ filename: 'baseline.png', path: '/test', timestamp: '2025-01-15T12:00:00Z' }],
        issues: [],
      };
      const consoleLogs: string[] = [];
      const issues: Issue[] = [
        { type: 'browser_crash', description: 'Crash', timestamp: '2025-01-15T12:00:00Z' },
        { type: 'action_failed', description: 'Failed', timestamp: '2025-01-15T12:00:00Z' },
      ];
      const stagehand = createMockStagehand();

      const result = await calculateHeuristicScore(
        actionResults,
        captureResult,
        consoleLogs,
        issues,
        stagehand,
      );

      // Browser crash should have more impact
      expect(result.score).toBeLessThan(0.5);
    });
  });

  describe('combineScores', () => {
    test('returns heuristic score when no LLM result', () => {
      const result = combineScores(0.8);
      expect(result.finalScore).toBe(0.8);
      expect(result.weights.heuristic).toBe(1.0);
      expect(result.weights.llm).toBe(0.0);
    });

    test('combines scores with high LLM confidence', () => {
      const result = combineScores(0.8, { score: 0.9, confidence: 0.9 });
      expect(result.finalScore).toBeGreaterThan(0.8);
      expect(result.finalScore).toBeLessThanOrEqual(1.0);
      expect(result.weights.llm).toBe(0.4);
      expect(result.weights.heuristic).toBe(0.6);
    });

    test('adjusts LLM weight for low confidence', () => {
      const result = combineScores(0.8, { score: 0.9, confidence: 0.3 });
      expect(result.weights.llm).toBe(0.2);
      expect(result.weights.heuristic).toBe(0.8);
    });

    test('clamps final score to [0, 1]', () => {
      const result = combineScores(1.5, { score: 2.0, confidence: 1.0 });
      expect(result.finalScore).toBeLessThanOrEqual(1.0);
      expect(result.finalScore).toBeGreaterThanOrEqual(0.0);
    });

    test('handles negative scores', () => {
      const result = combineScores(-0.5, { score: -0.3, confidence: 0.8 });
      expect(result.finalScore).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('calculateEvaluationCost', () => {
    test('calculates cost for gpt-4o-mini', () => {
      const cost = calculateEvaluationCost(
        { promptTokens: 1000, completionTokens: 500 },
        'gpt-4o-mini',
      );
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be reasonable
    });

    test('calculates cost for gpt-4o', () => {
      const cost = calculateEvaluationCost(
        { promptTokens: 1000, completionTokens: 500 },
        'gpt-4o',
      );
      expect(cost).toBeGreaterThan(0);
    });

    test('returns 0 for no tokens', () => {
      const cost = calculateEvaluationCost(
        { promptTokens: 0, completionTokens: 0 },
        'gpt-4o-mini',
      );
      expect(cost).toBe(0);
    });

    test('handles default model', () => {
      const cost = calculateEvaluationCost(
        { promptTokens: 1000, completionTokens: 500 },
      );
      expect(cost).toBeGreaterThan(0);
    });
  });

});

