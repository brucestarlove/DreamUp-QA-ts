import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import type { TestResult, SessionData, GroupedSessions, SessionsResponse } from '../types/test-result'

const RESULTS_DIR = join(process.cwd(), 'results')

/**
 * Get all session directories from the results folder
 */
async function getSessionDirs(): Promise<string[]> {
  try {
    const entries = await readdir(RESULTS_DIR, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('session_'))
      .map(entry => entry.name)
      .sort()
      .reverse() // Most recent first
  } catch (error) {
    console.error('Error reading results directory:', error)
    return []
  }
}

/**
 * Read a single session's output.json file
 */
async function readSessionResult(sessionId: string): Promise<TestResult | null> {
  try {
    const outputPath = join(RESULTS_DIR, sessionId, 'output.json')
    const content = await readFile(outputPath, 'utf-8')
    return JSON.parse(content) as TestResult
  } catch (error) {
    console.error(`Error reading session ${sessionId}:`, error)
    return null
  }
}

/**
 * Get screenshot paths for a session
 */
async function getSessionScreenshots(sessionId: string): Promise<string[]> {
  try {
    const screenshotsDir = join(RESULTS_DIR, sessionId, 'screenshots')
    const files = await readdir(screenshotsDir)
    return files.filter(file => file.endsWith('.png')).sort()
  } catch (error) {
    return []
  }
}

/**
 * Check if console logs exist for a session
 */
async function getSessionLogsPath(sessionId: string): Promise<string | undefined> {
  try {
    const logsDir = join(RESULTS_DIR, sessionId, 'logs')
    const files = await readdir(logsDir)
    const consoleLog = files.find(file => file.includes('console'))
    return consoleLog ? join(logsDir, consoleLog) : undefined
  } catch (error) {
    return undefined
  }
}

/**
 * Get all sessions with their results
 */
export async function getAllSessions(): Promise<SessionsResponse> {
  const sessionDirs = await getSessionDirs()
  const sessions: SessionData[] = []

  for (const sessionId of sessionDirs) {
    const result = await readSessionResult(sessionId)
    if (result) {
      const screenshotPaths = await getSessionScreenshots(sessionId)
      const logsPath = await getSessionLogsPath(sessionId)
      
      sessions.push({
        sessionId,
        result,
        screenshotPaths,
        logsPath,
      })
    }
  }

  // Group sessions by game URL
  const grouped: GroupedSessions = {}
  for (const session of sessions) {
    const gameUrl = session.result.url || 'Unknown Game'
    if (!grouped[gameUrl]) {
      grouped[gameUrl] = []
    }
    grouped[gameUrl].push(session)
  }

  return {
    sessions,
    grouped,
    total: sessions.length,
  }
}

/**
 * Get a single session by ID
 */
export async function getSessionById(sessionId: string): Promise<SessionData | null> {
  const result = await readSessionResult(sessionId)
  if (!result) {
    return null
  }

  const screenshotPaths = await getSessionScreenshots(sessionId)
  const logsPath = await getSessionLogsPath(sessionId)

  return {
    sessionId,
    result,
    screenshotPaths,
    logsPath,
  }
}

/**
 * Delete a session directory
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const { rm } = await import('fs/promises')
    const sessionPath = join(RESULTS_DIR, sessionId)
    await rm(sessionPath, { recursive: true, force: true })
    return true
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error)
    return false
  }
}

/**
 * Get available config files
 */
export async function getConfigFiles(): Promise<string[]> {
  try {
    const configsDir = join(process.cwd(), 'configs')
    const files = await readdir(configsDir)
    return files.filter(file => file.endsWith('.json')).sort()
  } catch (error) {
    console.error('Error reading configs directory:', error)
    return []
  }
}

/**
 * Read a config file
 */
export async function readConfigFile(filename: string): Promise<any> {
  try {
    const configPath = join(process.cwd(), 'configs', filename)
    const content = await readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Error reading config ${filename}:`, error)
    return null
  }
}

