#!/usr/bin/env bun
/**
 * API Server - HTTP endpoint for running tests remotely
 * Deploy this separately (Railway, Render, Fly.io) to handle long-running tests
 */

import { serve } from 'bun'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { loadConfig } from './config.js'
import { SessionManager } from './session.js'
import { executeSequence } from './interaction.js'
import { CaptureManager } from './capture.js'
import { CUAManager } from './cua.js'
import { generateResult, writeResult, writeInitialResult } from './reporter.js'
import { generateSessionId } from './utils/time.js'
import { logger } from './utils/logger.js'
import { evaluatePlayability } from './evaluation.js'

const PORT = process.env.PORT || 3001
const RESULTS_DIR = process.env.RESULTS_DIR || join(process.cwd(), 'results')

// Ensure results directory exists
if (!existsSync(RESULTS_DIR)) {
  mkdirSync(RESULTS_DIR, { recursive: true })
}

interface TestRequest {
  gameUrl: string
  config?: string
  llm?: boolean
  model?: string
  headed?: boolean
  retries?: number
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    // List all sessions endpoint
    if (req.method === 'GET' && url.pathname === '/sessions') {
      try {
        const { readdir } = await import('fs/promises')
        const entries = await readdir(RESULTS_DIR, { withFileTypes: true })
        const sessionDirs = entries
          .filter(entry => entry.isDirectory() && entry.name.startsWith('session_'))
          .map(entry => entry.name)
          .sort()
          .reverse()
        
        return new Response(
          JSON.stringify({ sessions: sessionDirs }),
          { headers }
        )
      } catch (error) {
        logger.error('[API] Error listing sessions:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to list sessions', sessions: [] }),
          { status: 500, headers }
        )
      }
    }

    // Serve results endpoint - allows Vercel to fetch results
    if (req.method === 'GET' && url.pathname.startsWith('/results/')) {
      const sessionId = url.pathname.replace('/results/', '').split('/')[0]
      const filePath = url.pathname.replace(`/results/${sessionId}`, '') || 'output.json'
      
      try {
        const fullPath = join(RESULTS_DIR, sessionId, filePath)
        
        if (!existsSync(fullPath)) {
          return new Response(
            JSON.stringify({ error: 'File not found' }),
            { status: 404, headers }
          )
        }

        // Serve JSON files
        if (filePath.endsWith('.json')) {
          const content = readFileSync(fullPath, 'utf-8')
          return new Response(content, {
            headers: { ...headers, 'Content-Type': 'application/json' }
          })
        }
        
        // Serve images
        if (filePath.endsWith('.png')) {
          const image = await Bun.file(fullPath).arrayBuffer()
          return new Response(image, {
            headers: { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' }
          })
        }
        
        // Default: serve as text
        const content = readFileSync(fullPath, 'utf-8')
        return new Response(content, { headers })
      } catch (error) {
        logger.error('[API] Error serving result:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to serve result' }),
          { status: 500, headers }
        )
      }
    }

    // Run test endpoint
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    try {
      const body: TestRequest = await req.json()
      const { gameUrl, config: configPath, llm, model, headed, retries } = body

      if (!gameUrl) {
        return new Response(
          JSON.stringify({ error: 'Game URL is required' }),
          { status: 400, headers }
        )
      }

      logger.info(`[API] Starting test for ${gameUrl}`)

      // Generate session
      const sessionId = generateSessionId()
      const sessionDir = join(RESULTS_DIR, sessionId)
      mkdirSync(sessionDir, { recursive: true })

      // Write initial result
      writeInitialResult(gameUrl, sessionDir, configPath)

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
        logger.error(`[API] Test failed for ${sessionId}:`, error)
      })

      // Return immediately
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test started',
          sessionId,
        }),
        { status: 200, headers }
      )
    } catch (error) {
      logger.error('[API] Error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to start test',
          details: error instanceof Error ? error.message : String(error),
        }),
        { status: 500, headers }
      )
    }
  },
})

logger.info(`🚀 CLI API Server running on port ${PORT}`)
logger.info(`📁 Results directory: ${RESULTS_DIR}`)

async function runTest(options: {
  gameUrl: string
  configPath?: string
  llm?: boolean
  model?: string
  headed?: boolean
  retries?: number
  sessionId: string
  sessionDir: string
}) {
  const {
    gameUrl,
    configPath,
    llm,
    model,
    headed,
    retries,
    sessionId,
    sessionDir,
  } = options

  const startTime = Date.now()

  try {
    // Load config
    const config = loadConfig(configPath)

    // Initialize session
    const sessionManager = new SessionManager(!headed)
    const session = await sessionManager.loadGame(gameUrl, config)

    // Setup capture manager
    const captureManager = new CaptureManager(sessionDir)

    // Initialize CUA if needed
    const hasCUAInClickActions = config.sequence.some(
      (step) => 'action' in step && step.action === 'click' && step.useCUA === true,
    )
    const hasAgentActionsWithCUA = config.sequence.some(
      (step) => 'action' in step && step.action === 'agent' && step.useCUA === true,
    )
    const shouldInitializeCUA = config.alwaysCUA || hasCUAInClickActions || hasAgentActionsWithCUA

    let cuaManager: CUAManager | undefined
    if (shouldInitializeCUA) {
      try {
        cuaManager = new CUAManager(session.stagehand, {
          model: config.cuaModel || 'openai/computer-use-preview',
          maxSteps: config.cuaMaxSteps || 3,
        })
        await cuaManager.initialize()
      } catch (error) {
        logger.error('CUA initialization error:', error)
        cuaManager = undefined
      }
    }

    // Capture baseline
    await captureManager.captureBaseline(session.page)

    // Execute sequence
    const actionResults = await executeSequence(
      session.stagehand,
      config,
      startTime,
      captureManager,
      undefined, // onActionComplete
      cuaManager,
    )

    // Capture final screenshot
    try {
      const pages = session.stagehand.context.pages()
      const page = pages.length > 0 ? pages[0] : null
      if (page) {
        await captureManager.takeScreenshot(page, 'end', actionResults.length)
      }
    } catch (error) {
      logger.error('Final screenshot failed:', error)
    }

    // Collect console logs
    let logsPath: string | null = null
    try {
      const pages = session.stagehand.context.pages()
      const page = pages.length > 0 ? pages[0] : null
      const logs = page ? await sessionManager.getConsoleLogs(page) : []
      logsPath = await captureManager.saveConsoleLogs(logs)
    } catch (error) {
      logger.error('Console logs failed:', error)
    }

    // Evaluate
    let evaluationResult
    try {
      const pages = session.stagehand.context.pages()
      const page = pages.length > 0 ? pages[0] : null
      const consoleLogs = page ? await sessionManager.getConsoleLogs(page) : []

      evaluationResult = await evaluatePlayability(
        session.stagehand,
        actionResults,
        captureManager.getResult(),
        consoleLogs,
        [],
        config,
        gameUrl,
        {
          enableLLM: llm || false,
          model: model || 'gpt-4o-mini',
        },
      )
    } catch (error) {
      logger.error('Evaluation failed:', error)
    }

    // Generate final result
    const result = generateResult(
      actionResults,
      captureManager.getResult(),
      startTime,
      gameUrl,
      [],
      cuaManager?.getUsageMetrics(),
      configPath,
      evaluationResult,
    )

    // Write result
    writeResult(result, sessionDir)

    // Cleanup
    await sessionManager.cleanup()

    logger.info(`✅ Test completed: ${sessionId}`)
  } catch (error) {
    logger.error(`❌ Test failed: ${sessionId}`, error)
    throw error
  }
}

