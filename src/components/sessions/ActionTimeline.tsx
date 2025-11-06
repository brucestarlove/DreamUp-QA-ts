'use client'

import { useMemo } from 'react'
import { Clock, CheckCircle2, XCircle, Camera, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TestResult, ActionTiming, ScreenshotMetadata } from '@/lib/types/test-result'

interface ActionTimelineProps {
  result: TestResult
}

// Helper to format execution time
function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Helper to determine action method from screenshot metadata
function getActionMethod(actionIndex: number, result: TestResult): string | null {
  // If we have screenshot metadata, check the label for method indicators
  const screenshot = result.screenshot_metadata?.find(
    s => s.stepIndex === actionIndex
  )
  
  if (screenshot?.label) {
    if (screenshot.label.includes('cua')) return 'cua'
    if (screenshot.label.includes('dom')) return 'dom'
  }
  
  return null
}

// Helper to get method badge color
function getMethodBadgeColor(method: string | null): string {
  switch (method) {
    case 'cua':
      return 'bg-gradient-purple-pink'
    case 'dom':
      return 'bg-gradient-blue-cyan'
    default:
      return 'bg-mid-navy'
  }
}

export default function ActionTimeline({ result }: ActionTimelineProps) {
  // Calculate timeline statistics
  const stats = useMemo(() => {
    const timings = result.action_timings || []
    const totalActions = timings.length
    const successfulActions = timings.filter(t => t.success).length
    const failedActions = totalActions - successfulActions
    
    const totalExecutionTime = timings.reduce((sum, t) => sum + t.executionTime, 0)
    const avgExecutionTime = totalActions > 0 ? totalExecutionTime / totalActions : 0
    
    const minExecutionTime = totalActions > 0 
      ? Math.min(...timings.map(t => t.executionTime))
      : 0
    const maxExecutionTime = totalActions > 0
      ? Math.max(...timings.map(t => t.executionTime))
      : 0
    
    return {
      totalActions,
      successfulActions,
      failedActions,
      avgExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      totalExecutionTime
    }
  }, [result.action_timings])

  // Merge action timings with screenshot metadata
  const timelineItems = useMemo(() => {
    const timings = result.action_timings || []
    const screenshots = result.screenshot_metadata || []
    
    return timings.map(timing => {
      const relatedScreenshot = screenshots.find(
        s => s.stepIndex === timing.actionIndex
      )
      
      return {
        ...timing,
        screenshot: relatedScreenshot,
        method: getActionMethod(timing.actionIndex, result)
      }
    })
  }, [result.action_timings, result.screenshot_metadata])

  if (!result.action_timings || result.action_timings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No action timeline data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-mid-navy rounded-lg p-4 border border-light-blue/20">
          <div className="text-white/60 text-sm mb-1">Total Actions</div>
          <div className="text-2xl font-bold text-light-blue">
            {stats.totalActions}
          </div>
        </div>
        
        <div className="bg-mid-navy rounded-lg p-4 border border-light-blue/20">
          <div className="text-white/60 text-sm mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.totalActions > 0 
              ? ((stats.successfulActions / stats.totalActions) * 100).toFixed(0)
              : 0}%
          </div>
        </div>
        
        <div className="bg-mid-navy rounded-lg p-4 border border-light-blue/20">
          <div className="text-white/60 text-sm mb-1">Avg Execution</div>
          <div className="text-2xl font-bold text-white">
            {formatExecutionTime(stats.avgExecutionTime)}
          </div>
        </div>
        
        <div className="bg-mid-navy rounded-lg p-4 border border-light-blue/20">
          <div className="text-white/60 text-sm mb-1">Total Time</div>
          <div className="text-2xl font-bold text-white">
            {formatExecutionTime(stats.totalExecutionTime)}
          </div>
        </div>
      </div>

      {/* Method Breakdown */}
      {result.action_methods && (
        <div className="bg-mid-navy rounded-lg p-4 border border-light-blue/20">
          <div className="text-white/80 font-semibold mb-3">Action Methods Used</div>
          <div className="flex gap-4 flex-wrap">
            {result.action_methods.cua > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-purple-pink" />
                <span className="text-white/80">CUA: {result.action_methods.cua}</span>
              </div>
            )}
            {result.action_methods.dom > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-blue-cyan" />
                <span className="text-white/80">DOM: {result.action_methods.dom}</span>
              </div>
            )}
            {result.action_methods.none > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-mid-navy border border-white/20" />
                <span className="text-white/80">None: {result.action_methods.none}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-light-blue/20" />
        
        {/* Timeline items */}
        <div className="space-y-6">
          {timelineItems.map((item, index) => (
            <div key={item.actionIndex} className="relative flex gap-6">
              {/* Timeline node */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  ${item.success 
                    ? 'bg-gradient-green-emerald shadow-lg shadow-green-500/20' 
                    : 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20'
                  }
                `}>
                  {item.success ? (
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white" />
                  )}
                </div>
                
                {/* Action number badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-light-blue text-dark-navy font-bold text-xs flex items-center justify-center">
                  {item.actionIndex}
                </div>
              </div>

              {/* Timeline content */}
              <div className="flex-1 pb-4">
                <div className="bg-mid-navy rounded-lg p-4 border border-light-blue/20 hover:border-light-blue/40 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold text-lg">
                          Action {item.actionIndex}
                        </h4>
                        {item.description && (
                          <span className="text-white/70 text-sm font-normal">
                            — {item.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.method && (
                        <Badge className={`${getMethodBadgeColor(item.method)} text-white uppercase text-xs`}>
                          {item.method}
                        </Badge>
                      )}
                      <Badge 
                        variant={item.success ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {item.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-light-blue" />
                      <span className="text-white/60">Execution:</span>
                      <span className={`font-mono font-semibold ${
                        item.executionTime > stats.avgExecutionTime * 1.5
                          ? 'text-orange-400'
                          : 'text-white'
                      }`}>
                        {formatExecutionTime(item.executionTime)}
                      </span>
                    </div>

                    {item.screenshot && (
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-light-blue" />
                        <span className="text-white/60">Screenshot:</span>
                        <span className="text-white font-mono text-xs">
                          {item.screenshot.filename}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Execution time bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-dark-navy rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          item.success
                            ? 'bg-gradient-green-emerald'
                            : 'bg-gradient-to-r from-red-500 to-orange-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (item.executionTime / stats.maxExecutionTime) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>{formatExecutionTime(stats.minExecutionTime)}</span>
                      <span>{formatExecutionTime(stats.maxExecutionTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline end marker */}
      <div className="relative flex gap-6 items-center">
        <div className="w-16 h-16 rounded-full bg-gradient-deepspace border-2 border-light-blue/40 flex items-center justify-center flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-light-blue animate-pulse" />
        </div>
        <div className="text-white/60 text-sm">
          Test completed in {result.test_duration ? `${result.test_duration}s` : 'unknown time'}
        </div>
      </div>
    </div>
  )
}
