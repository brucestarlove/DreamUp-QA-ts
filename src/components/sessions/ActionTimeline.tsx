'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { TestResult } from '@/lib/types/test-result'

interface ActionTimelineProps {
  result: TestResult
}

export default function ActionTimeline({ result }: ActionTimelineProps) {
  // TODO: Implement full timeline visualization with screenshot keyframes
  // For now, show a stub with action timings data
  
  return (
    <div className="space-y-6">
      <Card variant="dark-glass" className="border-2 border-dashed border-light-blue/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-light-blue" />
            Action Timeline (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-white/60 mb-4">
              Interactive timeline visualization with screenshot keyframes will be implemented here.
            </p>
            <p className="text-sm text-white/50">
              This will show a horizontal scrolling timeline with visual keyframes for each action,
              including tooltips and modals with action details and error information.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Show action timings table as temporary content */}
      {result.action_timings && result.action_timings.length > 0 && (
        <Card variant="dark-glass">
          <CardHeader>
            <CardTitle>Action Timings (Debug View)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-blue/20">
                    <th className="text-left py-2 px-3 text-white/80">Action</th>
                    <th className="text-left py-2 px-3 text-white/80">Duration</th>
                    <th className="text-left py-2 px-3 text-white/80">Timestamp</th>
                    <th className="text-left py-2 px-3 text-white/80">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.action_timings.map((action, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-light-blue/5">
                      <td className="py-2 px-3 text-white">Action {action.actionIndex + 1}</td>
                      <td className="py-2 px-3 text-white">{action.executionTime}ms</td>
                      <td className="py-2 px-3 text-white/70 text-xs">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs ${action.success ? 'text-green-400' : 'text-destructive'}`}>
                          {action.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

