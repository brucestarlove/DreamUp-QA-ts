'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import type { SessionData } from '@/lib/types/test-result'
import { useSessionWatch } from '@/hooks/useSessionWatch'
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
  const [sessionData, setSessionData] = useState<SessionData>(session)
  const { result, sessionId, screenshotPaths } = sessionData
  
  // Check if test is still running (no test_duration = incomplete)
  const isRunning = !result || !result.test_duration

  // Memoize callbacks to prevent SSE reconnection
  const sseCallbacks = useMemo(() => ({
    onUpdate: (event: any) => {
      // Only update if this is OUR session
      if (event.sessionId !== sessionId) {
        return
      }

      // When output.json is updated, refresh the entire session data
      if (event.type === 'session_updated') {
        onRefresh()
      } 
      // When screenshots are added, update optimistically (no refetch needed)
      else if (event.type === 'screenshot_added' && event.filename) {
        setSessionData((prev) => {
          // Check if screenshot already exists
          if (prev.screenshotPaths.includes(event.filename)) {
            return prev
          }
          
          // Add to screenshot paths
          const newScreenshotPaths = [...prev.screenshotPaths, event.filename]
          
          // Also add to screenshot_metadata if we have it
          const newMetadata = prev.result.screenshot_metadata 
            ? [
                ...prev.result.screenshot_metadata,
                {
                  filename: event.filename,
                  path: `/api/sessions/${sessionId}/screenshots/${event.filename}`,
                  timestamp: event.timestamp || new Date().toISOString(),
                  label: event.filename.replace('.png', ''),
                  stepIndex: -1 // Will be corrected on next full refresh
                }
              ]
            : undefined
          
          return {
            ...prev,
            screenshotPaths: newScreenshotPaths,
            result: {
              ...prev.result,
              screenshot_metadata: newMetadata
            }
          }
        })
      }
    }
  }), [sessionId, onRefresh])

  // Watch for real-time updates to this specific session
  useSessionWatch({
    ...sseCallbacks,
    enabled: true
  })

  // Update session data when prop changes
  useEffect(() => {
    setSessionData(session)
  }, [session])

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

  // Show running state if test is incomplete
  if (isRunning) {
    return (
      <div className="flex flex-col h-full bg-card rounded-lg shadow-elevated overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-sm animate-pulse">
              RUNNING
            </Badge>
            <span className="text-2xl font-bold text-light-blue">
              Test in Progress...
            </span>
          </div>
          <div className="space-y-1 mt-2">
            {result?.url && (
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
            <p className="text-white/60 text-sm">
              Started: {formatTimestamp(result?.timestamp || new Date().toISOString())}
            </p>
            {result?.config_path && (
              <p className="text-white/60 text-sm">
                Config: {result.config_path.split('/').pop()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-4 max-w-2xl">
            <div className="w-16 h-16 border-4 border-light-blue/20 border-t-light-blue rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <p className="text-white/70">Waiting for test to complete...</p>
              <p className="text-white/50 text-sm">
                Screenshots will appear here as they're captured
              </p>
            </div>
            
            {/* Show any screenshots that have been captured so far */}
            {screenshotPaths.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border w-full">
                <p className="text-white/60 text-sm mb-4">
                  {screenshotPaths.length} screenshot(s) captured so far
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {screenshotPaths.map((filename) => (
                    <img
                      key={filename}
                      src={`/api/sessions/${sessionId}/screenshots/${filename}`}
                      alt={filename}
                      className="w-full aspect-video object-cover rounded border border-border hover:scale-105 transition-transform"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
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
              Screenshots ({sessionData.result.screenshot_metadata?.length || screenshotPaths.length})
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
                screenshots={sessionData.result.screenshot_metadata || []}
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

