/**
 * Test Fixtures - Mock Game Responses
 * Provides mock Stagehand/Playwright responses for testing
 */

/**
 * Mock Stagehand observe response (action candidates)
 */
export const mockObserveResponse = [
  {
    selector: 'button[data-testid="start-button"]',
    method: 'click',
    description: 'Start game button',
  },
  {
    selector: 'button:has-text("Start")',
    method: 'click',
    description: 'Alternative start button',
  },
];

/**
 * Mock Stagehand act response (action execution result)
 */
export const mockActResponse = {
  success: true,
  message: 'Action completed',
};

/**
 * Mock page evaluate result (for game state extraction)
 */
export const mockGameState = {
  gameOver: false,
  victory: false,
  score: 100,
};

/**
 * Mock screenshot buffer (PNG header + minimal data)
 */
export function createMockScreenshotBuffer(): Buffer {
  // PNG file signature + minimal IHDR chunk
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  ]);
  // Minimal valid PNG (just header, no actual image data needed for tests)
  return Buffer.concat([pngHeader, Buffer.alloc(100, 0)]);
}

/**
 * Mock console log entries
 */
export const mockConsoleLogs = [
  '[2025-01-15T12:00:00.000Z] [INFO] Game initialized',
  '[2025-01-15T12:00:01.000Z] [WARNING] Asset loading slowly',
  '[2025-01-15T12:00:02.000Z] [ERROR] Failed to load sprite',
  '[2025-01-15T12:00:03.000Z] [INFO] Player spawned',
];

/**
 * Mock Stagehand metrics
 */
export const mockStagehandMetrics = {
  totalPromptTokens: 1000,
  totalCompletionTokens: 500,
  totalTokens: 1500,
};

/**
 * Mock OpenAI API response for evaluation
 */
export const mockLLMEvaluationResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          playability_score: 0.85,
          issues: ['Minor performance lag detected'],
          confidence: 0.9,
        }),
      },
    },
  ],
  usage: {
    prompt_tokens: 2000,
    completion_tokens: 100,
    total_tokens: 2100,
  },
};

/**
 * Mock action results for testing
 */
export const mockActionResults = {
  allSuccess: [
    {
      success: true,
      actionIndex: 0,
      executionTime: 100,
      timestamp: '2025-01-15T12:00:00.000Z',
      methodUsed: 'dom' as const,
    },
    {
      success: true,
      actionIndex: 1,
      executionTime: 200,
      timestamp: '2025-01-15T12:00:01.000Z',
      methodUsed: 'cua' as const,
    },
  ],
  mixedSuccess: [
    {
      success: true,
      actionIndex: 0,
      executionTime: 100,
      timestamp: '2025-01-15T12:00:00.000Z',
      methodUsed: 'dom' as const,
    },
    {
      success: false,
      actionIndex: 1,
      error: 'Element not found',
      executionTime: 5000,
      timestamp: '2025-01-15T12:00:05.000Z',
      methodUsed: 'none' as const,
    },
  ],
  allFailure: [
    {
      success: false,
      actionIndex: 0,
      error: 'Timeout exceeded',
      executionTime: 10000,
      timestamp: '2025-01-15T12:00:10.000Z',
      methodUsed: 'none' as const,
    },
  ],
};

