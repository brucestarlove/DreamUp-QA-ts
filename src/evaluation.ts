/**
 * Evaluation Engine - Heuristic and LLM-based playability evaluation
 */

import type { Stagehand } from '@browserbasehq/stagehand';
import type { ActionResult } from './interaction.js';
import type { CaptureResult, ScreenshotMetadata } from './capture.js';
import type { Config } from './config.js';
import type { Issue } from './utils/errors.js';
import { logger } from './utils/logger.js';
import { z } from 'zod';
import OpenAI from 'openai';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface EvaluationMetrics {
  heuristicScore: number;
  llmScore?: number;
  llmConfidence?: number;
  finalScore: number;
  issues: string[];
  gameState?: {
    gameOver: boolean;
    victory?: boolean;
    score?: number;
  };
}

export interface LLMEvaluationResult {
  playability_score: number;
  issues: string[];
  confidence: number;
}

export interface EvaluationResult extends EvaluationMetrics {
  evaluationTokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  stagehandTokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cacheHit?: boolean;
}

/**
 * Get Stagehand metrics
 */
export async function getStagehandMetrics(stagehand: Stagehand): Promise<{
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} | null> {
  try {
    const metrics = await stagehand.metrics;
    return {
      promptTokens: metrics.totalPromptTokens || 0,
      completionTokens: metrics.totalCompletionTokens || 0,
      totalTokens: (metrics.totalPromptTokens || 0) + (metrics.totalCompletionTokens || 0),
    };
  } catch (error) {
    logger.debug('Failed to get Stagehand metrics:', error);
    return null;
  }
}

// Cache directory for LLM evaluations
const CACHE_DIR = 'cache/llm-evaluations';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Initialize cache directory
 */
function ensureCacheDir(): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
  } catch (error) {
    logger.debug('Cache directory creation skipped:', error);
  }
}

/**
 * Generate cache key from game URL, config, and action results
 */
function generateCacheKey(gameUrl: string, config: Config, actionResults: ActionResult[]): string {
  // Create a hash of config sequence and action results summary
  const configHash = createHash('sha256')
    .update(JSON.stringify({ sequence: config.sequence, metadata: config.metadata }))
    .digest('hex')
    .substring(0, 16);
  
  const resultsHash = createHash('sha256')
    .update(JSON.stringify(actionResults.map(r => ({ success: r.success, actionIndex: r.actionIndex }))))
    .digest('hex')
    .substring(0, 16);
  
  const urlHash = createHash('sha256')
    .update(gameUrl)
    .digest('hex')
    .substring(0, 16);
  
  return `${urlHash}-${configHash}-${resultsHash}.json`;
}

/**
 * Get cached evaluation if available and not expired
 */
function getEvaluationCache(cacheKey: string): LLMEvaluationResult | null {
  try {
    const cachePath = join(CACHE_DIR, cacheKey);
    if (!existsSync(cachePath)) {
      return null;
    }
    
    const cached = JSON.parse(readFileSync(cachePath, 'utf-8'));
    const timestamp = new Date(cached.timestamp).getTime();
    const now = Date.now();
    
    if (now - timestamp > CACHE_EXPIRY_MS) {
      // Cache expired
      return null;
    }
    
    logger.debug(`Cache hit for evaluation: ${cacheKey}`);
    return cached.result;
  } catch (error) {
    logger.debug('Cache read failed:', error);
    return null;
  }
}

/**
 * Store evaluation result in cache
 */
function setEvaluationCache(cacheKey: string, result: LLMEvaluationResult): void {
  try {
    ensureCacheDir();
    const cachePath = join(CACHE_DIR, cacheKey);
    const cacheData = {
      timestamp: new Date().toISOString(),
      result,
    };
    writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
    logger.debug(`Cached evaluation: ${cacheKey}`);
  } catch (error) {
    logger.debug('Cache write failed:', error);
    // Non-critical - continue without cache
  }
}

/**
 * Extract game state using Stagehand extract
 */
export async function extractGameState(
  stagehand: Stagehand,
): Promise<{ gameOver: boolean; victory?: boolean; score?: number } | null> {
  try {
    const page = stagehand.context.pages()[0];
    if (!page) {
      logger.debug('No page available for game state extraction');
      return null;
    }

    // Try to find HUD container first (reduce tokens)
    const hudActions = await stagehand.observe('find the game HUD or score display');
    if (hudActions.length === 0) {
      logger.debug('No HUD elements found');
      // Still try to extract game state from page
    }

    const HudSchema = z.object({
      gameOver: z.boolean().describe('Whether game over text is visible'),
      score: z.number().optional().describe('Current score value'),
      victory: z.boolean().optional().describe('Whether victory/win text is visible'),
    });

    // Extract with optional selector if HUD was found
    const selector = hudActions.length > 0 ? hudActions[0].selector : undefined;
    const hud = await stagehand.extract('read HUD state and check for game over or victory text', HudSchema, {
      selector,
      timeout: 5000, // Short timeout for extraction
    });

    return {
      gameOver: hud.gameOver || false,
      victory: hud.victory,
      score: hud.score,
    };
  } catch (error) {
    logger.debug('Game state extraction failed:', error);
    return null;
  }
}

/**
 * Calculate heuristic playability score
 */
export async function calculateHeuristicScore(
  actionResults: ActionResult[],
  captureResult: CaptureResult,
  consoleLogs: string[],
  issues: Issue[],
  stagehand: Stagehand,
): Promise<{ score: number; metrics: { loadCheck: boolean; responsiveness: number; stability: boolean; completion: boolean } }> {
  const totalActions = Math.max(actionResults.length, 1);
  const successfulActions = actionResults.filter((r) => r.success).length;
  
  // Load Check: Verify initial screenshot shows content
  const loadCheck = captureResult.screenshots.length > 0 && captureResult.screenshots[0] !== undefined;
  
  // Responsiveness Check: Count JavaScript errors
  const errorCount = consoleLogs.filter((log) => log.toLowerCase().includes('[error]')).length;
  const warningCount = consoleLogs.filter((log) => log.toLowerCase().includes('[warning]')).length;
  const criticalErrors = consoleLogs.filter((log) => {
    const lower = log.toLowerCase();
    return lower.includes('typeerror') || lower.includes('referenceerror') || lower.includes('syntaxerror');
  }).length;
  
  // Responsiveness score: 1.0 if no errors, decreasing with errors
  const responsiveness = Math.max(0, 1 - (errorCount * 0.1 + criticalErrors * 0.2));
  
  // Stability Check: Check for browser crashes
  const browserCrashes = issues.filter((i) => i.type === 'browser_crash').length;
  const stability = browserCrashes === 0;
  
  // Completion Check: Try to extract game state
  let completion = false;
  try {
    const gameState = await extractGameState(stagehand);
    if (gameState) {
      // Game reached an end state (game over or victory)
      completion = gameState.gameOver || gameState.victory === true;
    }
  } catch (error) {
    logger.debug('Completion check failed:', error);
  }
  
  // Weight issues by severity
  const issueWeights: Record<string, number> = {
    browser_crash: 0.5,
    load_timeout: 0.4,
    action_timeout: 0.2,
    action_failed: 0.1,
    selector_not_found: 0.15,
    screenshot_failed: 0.05,
    log_failed: 0.05,
    headless_incompatibility: 0.1,
    total_timeout: 0.5,
  };
  
  const weightedIssues = issues.reduce((sum, issue) => {
    return sum + (issueWeights[issue.type] || 0.1);
  }, 0);
  
  // Base score: success rate minus weighted issues
  let score = (successfulActions / totalActions) * (1 - Math.min(weightedIssues / totalActions, 0.5));
  
  // Apply bonuses/penalties
  if (!loadCheck) score *= 0.5; // Heavy penalty for no load
  if (!stability) score *= 0.3; // Heavy penalty for crashes
  score *= 0.8 + (responsiveness * 0.2); // Responsiveness factor
  if (completion) score = Math.min(1.0, score + 0.1); // Bonus for completion
  
  // Clamp to [0, 1]
  score = Math.max(0, Math.min(1, score));
  
  return {
    score,
    metrics: {
      loadCheck,
      responsiveness,
      stability,
      completion,
    },
  };
}

/**
 * Evaluate with LLM using OpenAI SDK
 */
export async function evaluateWithLLM(
  actionResults: ActionResult[],
  captureResult: CaptureResult,
  consoleLogs: string[],
  config: Config,
  modelName: string = 'gpt-4o-mini',
  finalScreenshot?: ScreenshotMetadata,
): Promise<{ result: LLMEvaluationResult; tokens: { promptTokens: number; completionTokens: number; totalTokens: number } } | null> {
  // Parse model name (remove provider prefix if present)
  const model = modelName.includes('/') ? modelName.split('/')[1] : modelName;
  
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY not set, skipping LLM evaluation');
    return null;
  }
  
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  try {
    // Summarize action results
    const totalActions = actionResults.length;
    const successfulActions = actionResults.filter((r) => r.success).length;
    const failedActions = actionResults.filter((r) => !r.success);
    const errorMessages = failedActions.map((r) => r.error).filter(Boolean) as string[];
    
    // Summarize console logs (first 10 errors/warnings)
    const errors = consoleLogs.filter((log) => log.toLowerCase().includes('[error]')).slice(0, 10);
    const warnings = consoleLogs.filter((log) => log.toLowerCase().includes('[warning]')).slice(0, 10);
    
    // Prepare screenshot (base64)
    let screenshotBase64: string | undefined;
    if (finalScreenshot) {
      try {
        const screenshotBuffer = readFileSync(finalScreenshot.path);
        screenshotBase64 = screenshotBuffer.toString('base64');
      } catch (error) {
        logger.debug('Failed to read screenshot for LLM evaluation:', error);
      }
    }
    
    // Build system prompt
    const systemPrompt = `You are a QA expert analyzing browser game test sessions. Evaluate playability based on loading, controls, and completion. Respond with valid JSON matching this exact schema: { "playability_score": number (0-1), "issues": string[], "confidence": number (0-1) }`;
    
    // Build user prompt
    const userPromptText = `Analyze this browser game test session:

Game Genre: ${config.metadata?.genre || 'unknown'}
Total Actions: ${totalActions}
Successful Actions: ${successfulActions}
Failed Actions: ${failedActions.length}

${errorMessages.length > 0 ? `Action Errors:\n${errorMessages.slice(0, 5).join('\n')}\n` : ''}

${errors.length > 0 ? `Console Errors:\n${errors.slice(0, 5).join('\n')}\n` : ''}

${warnings.length > 0 ? `Console Warnings:\n${warnings.slice(0, 5).join('\n')}\n` : ''}

Questions to answer:
1. Did the game load successfully?
2. Were controls responsive?
3. Did the game complete without crashes?
4. Are there any visible issues in the final screenshot?

Respond with JSON: { "playability_score": number (0-1), "issues": string[], "confidence": number (0-1) }`;
    
    // Build message content - with or without image
    const userContent = screenshotBase64
      ? [
          { type: 'text' as const, text: userPromptText },
          {
            type: 'image_url' as const,
            image_url: {
              url: `data:image/png;base64,${screenshotBase64}`,
            },
          },
        ]
      : userPromptText;
    
    // Make API call
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });
  
    // Parse and validate response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    const parsed = JSON.parse(content);
    const EvaluationSchema = z.object({
      playability_score: z.number().min(0).max(1),
      issues: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    });
    
    const validated = EvaluationSchema.parse(parsed);
    
    // Extract token usage
    const tokens = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };
    
    return {
      result: validated,
      tokens,
    };
  } catch (error) {
    logger.warn('LLM evaluation failed:', error);
    return null;
  }
}

/**
 * Combine heuristic and LLM scores
 */
export function combineScores(
  heuristicScore: number,
  llmResult?: { score: number; confidence: number },
): { finalScore: number; weights: { heuristic: number; llm: number } } {
  if (!llmResult) {
    return {
      finalScore: heuristicScore,
      weights: { heuristic: 1.0, llm: 0.0 },
    };
  }
  
  // Adjust LLM score by confidence
  const adjustedLLMScore = llmResult.score * llmResult.confidence;
  
  // Default weights: heuristic 0.6, LLM 0.4
  // If LLM confidence is low, weight heuristic more
  const llmWeight = llmResult.confidence < 0.5 ? 0.2 : 0.4;
  const heuristicWeight = 1.0 - llmWeight;
  
  const finalScore = (heuristicScore * heuristicWeight) + (adjustedLLMScore * llmWeight);
  
  return {
    finalScore: Math.max(0, Math.min(1, finalScore)),
    weights: { heuristic: heuristicWeight, llm: llmWeight },
  };
}

/**
 * Main evaluation function
 */
export async function evaluatePlayability(
  stagehand: Stagehand,
  actionResults: ActionResult[],
  captureResult: CaptureResult,
  consoleLogs: string[],
  issues: Issue[],
  config: Config,
  gameUrl: string,
  options: {
    enableLLM?: boolean;
    model?: string;
  } = {},
): Promise<EvaluationResult> {
  // Calculate heuristic score
  const heuristic = await calculateHeuristicScore(actionResults, captureResult, consoleLogs, issues, stagehand);
  
  let llmResult: LLMEvaluationResult | undefined;
  let evaluationTokens: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
  let cacheHit = false;
  
  // LLM evaluation (if enabled)
  if (options.enableLLM) {
    const cacheKey = generateCacheKey(gameUrl, config, actionResults);
    const cached = getEvaluationCache(cacheKey);
    
    if (cached) {
      llmResult = cached;
      cacheHit = true;
      logger.debug('Using cached LLM evaluation');
    } else {
      // Get final screenshot
      const finalScreenshot = captureResult.screenshots.length > 0
        ? captureResult.screenshots[captureResult.screenshots.length - 1]
        : undefined;
      
      const llm = await evaluateWithLLM(
        actionResults,
        captureResult,
        consoleLogs,
        config,
        options.model || 'gpt-4o-mini',
        finalScreenshot,
      );
      
      if (llm) {
        llmResult = llm.result;
        evaluationTokens = llm.tokens;
        
        // Cache the result
        setEvaluationCache(cacheKey, llmResult);
      }
    }
  }
  
  // Combine scores
  const combined = combineScores(heuristic.score, llmResult ? {
    score: llmResult.playability_score,
    confidence: llmResult.confidence,
  } : undefined);
  
  // Extract game state if available
  let gameState: { gameOver: boolean; victory?: boolean; score?: number } | undefined;
  try {
    const extracted = await extractGameState(stagehand);
    if (extracted) {
      gameState = extracted;
    }
  } catch (error) {
    logger.debug('Game state extraction skipped:', error);
  }
  
  // Get Stagehand metrics
  const stagehandTokens = await getStagehandMetrics(stagehand);
  
  return {
    heuristicScore: heuristic.score,
    llmScore: llmResult?.playability_score,
    llmConfidence: llmResult?.confidence,
    finalScore: combined.finalScore,
    issues: llmResult?.issues || [],
    gameState,
    evaluationTokens,
    stagehandTokens: stagehandTokens || undefined,
    cacheHit,
  };
}


