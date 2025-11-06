'use client'

import { useState, useEffect } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import SessionDetail from '@/components/sessions/SessionDetail'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { SessionsResponse } from '@/lib/types/test-result'

interface DashboardLayoutProps {
  sessions: SessionsResponse | null
  selectedSession: string | null
  onSelectSession: (sessionId: string) => void
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export default function DashboardLayout({
  sessions,
  selectedSession,
  onSelectSession,
  loading,
  error,
  onRefresh,
}: DashboardLayoutProps) {
  const [expandedGameUrl, setExpandedGameUrl] = useState<string | null>(null)

  const handleRunTest = (config: any) => {
    console.log('Running test with config:', config)
  }

  const handleTestStarted = (gameUrl: string) => {
    // Expand the accordion for this game URL
    setExpandedGameUrl(gameUrl)
    
    // Trigger a refresh to get the new session
    onRefresh()
  }

  // When sessions update after a test starts, auto-select the newest running session for the expanded game
  useEffect(() => {
    if (expandedGameUrl && sessions?.grouped[expandedGameUrl]) {
      const gameSessions = sessions.grouped[expandedGameUrl]
      if (gameSessions.length > 0) {
        // Find the newest running session (one without test_duration, meaning it's still running)
        const runningSession = gameSessions.find(s => !s.result?.test_duration)
        const newestSession = runningSession || gameSessions[0]
        
        if (newestSession && newestSession.sessionId !== selectedSession) {
          onSelectSession(newestSession.sessionId)
        }
      }
    }
  }, [sessions, expandedGameUrl, selectedSession, onSelectSession])

  const currentSession = sessions?.sessions.find(s => s.sessionId === selectedSession)

  return (
    <div className="h-screen flex flex-col bg-background relative">
      <TopBar onRunTest={handleRunTest} onTestStarted={handleTestStarted} />
      
      <div className="flex-1 flex overflow-hidden relative z-10">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-light-blue mx-auto mb-4" />
              <p className="text-white/60">Loading sessions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Alert className="max-w-md bg-destructive/10 border-destructive/50">
              <AlertDescription className="text-white">{error}</AlertDescription>
            </Alert>
          </div>
        ) : sessions ? (
          <>
            <Sidebar
              grouped={sessions.grouped}
              selectedSession={selectedSession}
              onSelectSession={onSelectSession}
              expandedGameUrl={expandedGameUrl}
            />
            
            <div className="flex-1 overflow-auto">
              {currentSession ? (
                <SessionDetail
                  session={currentSession}
                  onRefresh={onRefresh}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/60">Select a session to view details</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/60">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

