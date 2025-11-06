/**
 * TypeScript types matching the TestResult interface from reporter.ts
 */

export interface ActionTiming {
  actionIndex: number
  executionTime: number
  timestamp: string
  success: boolean
}

export interface LLMUsageMetrics {
  totalCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  estimatedCost: number
  stagehandTokens?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  evaluationTokens?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ActionMethodBreakdown {
  cua: number
  dom: number
  none: number
}

export interface AgentResult {
  message?: string
  stepsExecuted?: number
  success?: boolean
}

export interface Issue {
  type: string
  description: string
  timestamp: string
  actionIndex?: number
}

export interface ScreenshotMetadata {
  filename: string
  path: string
  timestamp: string
  label: string
  stepIndex: number
}

export interface GameState {
  game_over: boolean
  victory?: boolean
  score?: number
}

export interface Evaluation {
  heuristic_score: number
  llm_score?: number
  llm_confidence?: number
  final_score: number
  llm_issues?: string[]
  game_state?: GameState
  cache_hit?: boolean
}

export interface TestResult {
  url?: string
  timestamp: string
  test_duration?: number
  config_path?: string
  status: 'pass' | 'fail'
  playability_score: number
  evaluation?: Evaluation
  issues: Issue[]
  screenshots: string[]
  screenshot_metadata?: ScreenshotMetadata[]
  action_timings?: ActionTiming[]
  action_methods?: ActionMethodBreakdown
  agent_responses?: AgentResult[]
  browser_console_logs?: string
  llm_usage?: LLMUsageMetrics
  cost_estimate?: LLMUsageMetrics
}

export interface SessionData {
  sessionId: string
  result: TestResult
  screenshotPaths: string[]
  logsPath?: string
}

export interface GroupedSessions {
  [gameUrl: string]: SessionData[]
}

export interface SessionsResponse {
  sessions: SessionData[]
  grouped: GroupedSessions
  total: number
}

