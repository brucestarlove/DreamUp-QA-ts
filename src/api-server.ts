#!/usr/bin/env bun
/**
 * API Server - HTTP endpoint for running tests remotely
 * Deploy this separately (Railway, Render, Fly.io) to handle long-running tests
 * Refactored to use Test Orchestrator
 */

import { serve } from 'bun';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { loadConfig } from './config.js';
import { generateSessionId } from './utils/time.js';
import { writeInitialResult } from './reporter.js';
import { createTestOrchestrator } from './services/container.js';
import { SilentProgressReporter } from './interfaces/progress-reporter.interface.js';
import { createLogger } from './observability/structured-logger.js';

const PORT = process.env.PORT || 3001;
const RESULTS_DIR = process.env.RESULTS_DIR || join(process.cwd(), 'results');

const logger = createLogger({ service: 'api-server' });

// Ensure results directory exists
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true });
}

interface TestRequest {
  gameUrl: string;
  config?: string;
  llm?: boolean;
  model?: string;
  headed?: boolean;
  retries?: number;
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // List all sessions endpoint
    if (req.method === 'GET' && url.pathname === '/sessions') {
      try {
        const { readdir } = await import('fs/promises');
        const entries = await readdir(RESULTS_DIR, { withFileTypes: true });
        const sessionDirs = entries
          .filter((entry) => entry.isDirectory() && entry.name.startsWith('session_'))
          .map((entry) => entry.name)
          .sort()
          .reverse();

        return new Response(JSON.stringify({ sessions: sessionDirs }), { headers });
      } catch (error) {
        logger.error('Error listing sessions', error as Error);
        return new Response(
          JSON.stringify({ error: 'Failed to list sessions', sessions: [] }),
          { status: 500, headers }
        );
      }
    }

    // Serve results endpoint - allows Vercel to fetch results
    if (req.method === 'GET' && url.pathname.startsWith('/results/')) {
      const sessionId = url.pathname.replace('/results/', '').split('/')[0];
      const filePath = url.pathname.replace(`/results/${sessionId}`, '') || 'output.json';

      try {
        const fullPath = join(RESULTS_DIR, sessionId, filePath);

        if (!existsSync(fullPath)) {
          return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers,
          });
        }

        // Serve JSON files
        if (filePath.endsWith('.json')) {
          const content = readFileSync(fullPath, 'utf-8');
          return new Response(content, {
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Serve images
        if (filePath.endsWith('.png')) {
          const image = await Bun.file(fullPath).arrayBuffer();
          return new Response(image, {
            headers: { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' },
          });
        }

        // Default: serve as text
        const content = readFileSync(fullPath, 'utf-8');
        return new Response(content, { headers });
      } catch (error) {
        logger.error('Error serving result', error as Error, { sessionId, filePath });
        return new Response(JSON.stringify({ error: 'Failed to serve result' }), {
          status: 500,
          headers,
        });
      }
    }

    // Run test endpoint
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
      });
    }

    try {
      const body: TestRequest = await req.json();
      const { gameUrl, config: configPath, llm, model, headed, retries } = body;

      if (!gameUrl) {
        return new Response(JSON.stringify({ error: 'Game URL is required' }), {
          status: 400,
          headers,
        });
      }

      logger.info('Starting test', { gameUrl, configPath, llm, model });

      // Generate session
      const sessionId = generateSessionId();
      const sessionDir = join(RESULTS_DIR, sessionId);
      mkdirSync(sessionDir, { recursive: true });

      // Write initial result
      writeInitialResult(gameUrl, sessionDir, configPath);

      // Start test in background (don't await - return immediately)
      runTest({
        gameUrl,
        configPath,
        llm,
        model,
        headed,
        retries,
        sessionId,
        sessionDir,
      }).catch((error) => {
        logger.error('Test failed', error as Error, { sessionId });
      });

      // Return immediately
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test started',
          sessionId,
        }),
        { status: 200, headers }
      );
    } catch (error) {
      logger.error('Error starting test', error as Error);
      return new Response(
        JSON.stringify({
          error: 'Failed to start test',
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 500, headers }
      );
    }
  },
});

logger.info('CLI API Server running', { port: PORT, resultsDir: RESULTS_DIR });

async function runTest(options: {
  gameUrl: string;
  configPath?: string;
  llm?: boolean;
  model?: string;
  headed?: boolean;
  retries?: number;
  sessionId: string;
  sessionDir: string;
}) {
  const { gameUrl, configPath, llm, model, headed, sessionId, sessionDir } = options;

  try {
    // Load config
    const config = loadConfig(configPath);

    // Create progress reporter (silent for API)
    const progressReporter = new SilentProgressReporter();

    // Create test orchestrator
    const orchestrator = await createTestOrchestrator({
      config,
      sessionDir,
      headless: !headed,
      progressReporter,
    });

    // Execute test
    await orchestrator.executeTest({
      gameUrl,
      config,
      sessionDir,
      configPath,
      enableLLM: llm || false,
      llmModel: model || 'gpt-4o-mini',
    });

    logger.info('Test completed', { sessionId });
  } catch (error) {
    logger.error('Test failed', error as Error, { sessionId });
    throw error;
  }
}
