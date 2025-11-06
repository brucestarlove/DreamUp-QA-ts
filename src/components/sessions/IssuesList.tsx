'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { Issue } from '@/lib/types/test-result'
import { formatTimestamp } from '@/lib/utils/date'

interface IssuesListProps {
  issues: Issue[]
}

const issueTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  action_failed: { icon: XCircle, color: 'text-destructive', label: 'Action Failed' },
  load_timeout: { icon: AlertCircle, color: 'text-yellow-500', label: 'Load Timeout' },
  browser_crash: { icon: XCircle, color: 'text-destructive', label: 'Browser Crash' },
  headless_incompatibility: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Headless Issue' },
  console_error: { icon: AlertCircle, color: 'text-orange-500', label: 'Console Error' },
}

export default function IssuesList({ issues }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No issues found - all tests passed!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {issues.map((issue, index) => {
        const config = issueTypeConfig[issue.type] || issueTypeConfig.action_failed
        const Icon = config.icon

        return (
          <Card key={index} variant="dark-glass" className="border-l-4 border-l-destructive/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <Badge variant="outline" className="text-xs">
                    {config.label}
                  </Badge>
                  {issue.actionIndex !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      Action {issue.actionIndex + 1}
                    </Badge>
                  )}
                </CardTitle>
                <span className="text-xs text-white/50">
                  {formatTimestamp(issue.timestamp)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-sm whitespace-pre-wrap">
                {issue.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

