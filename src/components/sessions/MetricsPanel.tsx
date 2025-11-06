'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Clock, Zap, DollarSign, Activity, CheckCircle2, XCircle } from 'lucide-react'
import type { TestResult } from '@/lib/types/test-result'

interface MetricsPanelProps {
  result: TestResult
}

export default function MetricsPanel({ result }: MetricsPanelProps) {
  const successRate = result.action_timings
    ? (result.action_timings.filter(a => a.success).length / result.action_timings.length) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card variant="dark-glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-light-blue" />
              Playability Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-light-blue">
              {(result.playability_score * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        {result.test_duration && (
          <Card variant="dark-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-light-blue" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {result.test_duration}s
              </div>
            </CardContent>
          </Card>
        )}

        {result.action_timings && (
          <Card variant="dark-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-light-blue" />
                Action Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {successRate.toFixed(0)}%
              </div>
              <div className="text-xs text-white/60 mt-1">
                {result.action_timings.filter(a => a.success).length}/{result.action_timings.length} actions
              </div>
            </CardContent>
          </Card>
        )}

        {result.issues && (
          <Card variant="dark-glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {result.issues.length}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Evaluation Details */}
      {result.evaluation && (
        <Card variant="dark-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-light-blue" />
              Evaluation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-white/60 mb-1">Heuristic Score</div>
                <div className="text-2xl font-bold text-white">
                  {(result.evaluation.heuristic_score * 100).toFixed(0)}%
                </div>
              </div>

              {result.evaluation.llm_score !== undefined && (
                <div>
                  <div className="text-sm text-white/60 mb-1">LLM Score</div>
                  <div className="text-2xl font-bold text-white">
                    {(result.evaluation.llm_score * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              {result.evaluation.llm_confidence !== undefined && (
                <div>
                  <div className="text-sm text-white/60 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-white">
                    {(result.evaluation.llm_confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>

            {result.evaluation.game_state && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-sm text-white/60 mb-2">Game State</div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80">Game Over:</span>
                    <span className="text-white font-medium">
                      {result.evaluation.game_state.game_over ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {result.evaluation.game_state.victory !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/80">Victory:</span>
                      <span className="text-white font-medium">
                        {result.evaluation.game_state.victory ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {result.evaluation.game_state.score !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/80">Score:</span>
                      <span className="text-white font-medium">
                        {result.evaluation.game_state.score}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.evaluation.cache_hit !== undefined && (
              <div className="mt-2 text-xs text-white/50">
                {result.evaluation.cache_hit ? '✓ Cached result' : '○ Fresh evaluation'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Methods Breakdown */}
      {result.action_methods && (
        <Card variant="dark-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-light-blue" />
              Action Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-white/60 mb-1">Computer Use Agent</div>
                <div className="text-2xl font-bold text-light-blue">
                  {result.action_methods.cua}
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">DOM Actions</div>
                <div className="text-2xl font-bold text-white">
                  {result.action_methods.dom}
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Other</div>
                <div className="text-2xl font-bold text-white/60">
                  {result.action_methods.none}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LLM Usage */}
      {result.llm_usage && result.llm_usage.totalTokens > 0 && (
        <Card variant="dark-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-light-blue" />
              LLM Usage & Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-white/60 mb-1">Total Calls</div>
                <div className="text-2xl font-bold text-white">
                  {result.llm_usage.totalCalls}
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Total Tokens</div>
                <div className="text-2xl font-bold text-white">
                  {result.llm_usage.totalTokens.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Input Tokens</div>
                <div className="text-xl font-bold text-white/80">
                  {result.llm_usage.totalInputTokens.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Est. Cost</div>
                <div className="text-2xl font-bold text-light-blue">
                  ${result.llm_usage.estimatedCost.toFixed(4)}
                </div>
              </div>
            </div>

            {(result.llm_usage.evaluationTokens || result.llm_usage.stagehandTokens) && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                {result.llm_usage.evaluationTokens && (
                  <div>
                    <div className="text-white/60 mb-1">Evaluation</div>
                    <div className="text-white">
                      {result.llm_usage.evaluationTokens.totalTokens.toLocaleString()} tokens
                    </div>
                  </div>
                )}
                {result.llm_usage.stagehandTokens && (
                  <div>
                    <div className="text-white/60 mb-1">Stagehand</div>
                    <div className="text-white">
                      {result.llm_usage.stagehandTokens.totalTokens.toLocaleString()} tokens
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

