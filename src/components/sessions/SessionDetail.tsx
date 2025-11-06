'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import type { SessionData } from '@/lib/types/test-result'
import MetricsPanel from './MetricsPanel'
import ScreenshotGallery from './ScreenshotGallery'
import IssuesList from './IssuesList'
import ActionTimeline from './ActionTimeline'
import { formatTimestamp } from '@/lib/utils/date'

interface SessionDetailProps {
  session: SessionData
  onRefresh: () => void
}

export default function SessionDetail({ session, onRefresh }: SessionDetailProps) {
  const [deleting, setDeleting] = useState(false)
  const { result, sessionId, screenshotPaths } = session

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRefresh()
      } else {
        alert('Failed to delete session')
      }
    } catch (error) {
      alert('Failed to delete session')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-light-blue/20 bg-gradient-deepspace">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant={result.status === 'pass' ? 'default' : 'destructive'}
                className="text-sm"
              >
                {result.status.toUpperCase()}
              </Badge>
              <span className="text-2xl font-bold text-light-blue">
                {(result.playability_score * 100).toFixed(0)}% Playability
              </span>
            </div>
            
            <div className="space-y-1">
              {result.url && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">Game:</span>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-light-blue hover:underline text-sm flex items-center gap-1"
                  >
                    {result.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>Session: {sessionId}</span>
                <span>•</span>
                <span>{formatTimestamp(result.timestamp)}</span>
                {result.test_duration && (
                  <>
                    <span>•</span>
                    <span>Duration: {result.test_duration}s</span>
                  </>
                )}
              </div>

              {result.config_path && (
                <div className="text-xs text-white/50">
                  Config: {result.config_path.split('/').pop()}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4 bg-mid-navy">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="screenshots">
              Screenshots ({screenshotPaths.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            {result.issues && result.issues.length > 0 && (
              <TabsTrigger value="issues">
                Issues ({result.issues.length})
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="p-6 space-y-6">
              <MetricsPanel result={result} />
            </TabsContent>

            <TabsContent value="screenshots" className="p-6">
              <ScreenshotGallery
                screenshots={result.screenshot_metadata || []}
                sessionId={sessionId}
              />
            </TabsContent>

            <TabsContent value="timeline" className="p-6">
              <ActionTimeline result={result} />
            </TabsContent>

            {result.issues && result.issues.length > 0 && (
              <TabsContent value="issues" className="p-6">
                <IssuesList issues={result.issues} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

