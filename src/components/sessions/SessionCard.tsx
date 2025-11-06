'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, AlertCircle } from 'lucide-react'
import type { SessionData } from '@/lib/types/test-result'
import { formatDistanceToNow } from '@/lib/utils/date'

interface SessionCardProps {
  session: SessionData
  isSelected: boolean
  onClick: () => void
}

export default function SessionCard({ session, isSelected, onClick }: SessionCardProps) {
  const { result, sessionId } = session
  
  // Check if test is still running (no test_duration = incomplete)
  const isRunning = !result || !result.test_duration

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
        isSelected
          ? 'bg-light-blue/20 border border-light-blue/40'
          : 'bg-dark-navy/50 hover:bg-dark-navy border border-transparent hover:border-light-blue/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        {isRunning ? (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            RUNNING
          </Badge>
        ) : (
          <Badge
            variant={result.status === 'pass' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {result.status.toUpperCase()}
          </Badge>
        )}
        <span className="text-xs text-white/60">
          {formatDistanceToNow(result?.timestamp || new Date().toISOString())}
        </span>
      </div>
      
      {isRunning ? (
        <div className="space-y-1">
          <div className="text-xs text-white/70">Test in progress...</div>
          <div className="text-xs text-white/50">{sessionId}</div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">Score</span>
            <span className="text-sm font-semibold text-light-blue">
              {(result.playability_score * 100).toFixed(0)}%
            </span>
          </div>
          
          {result.test_duration && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Duration</span>
              <span className="text-xs text-white/90">
                {result.test_duration}s
              </span>
            </div>
          )}
          
          {result.issues && result.issues.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Issues</span>
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {result.issues.length}
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  )
}

