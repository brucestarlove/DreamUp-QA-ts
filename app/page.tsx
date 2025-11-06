'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSessionWatch } from '@/hooks/useSessionWatch'
import ConnectionStatus from '@/components/layout/ConnectionStatus'

export default function DashboardPage() {
  const [sessions, setSessions] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data)
      
      // Auto-select newest session if none selected or if current session doesn't exist
      if (data.sessions && data.sessions.length > 0) {
        setSelectedSession((current) => {
          if (!current || !data.sessions.find((s: any) => s.sessionId === current)) {
            return data.sessions[0].sessionId
          }
          return current
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }, []) // Remove selectedSession dependency

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Memoize callbacks to prevent SSE reconnection on every render
  const sseCallbacks = useMemo(() => ({
    onUpdate: (event: any) => {
      // Smart updates: only refetch when output.json changes (session complete/updated)
      // Don't refetch on new directories or individual screenshots
      if (event.type === 'session_updated') {
        fetchSessions()
      }
      // session_created and screenshot_added don't need full refetch
      // SessionDetail will handle individual screenshot updates
    },
    onConnected: () => {
      // Initial fetch when connected
      fetchSessions()
    }
  }), [fetchSessions])

  // Connect to SSE for real-time updates
  const { isConnected, latestEvent, reconnectAttempts } = useSessionWatch({
    ...sseCallbacks,
    enabled: true
  })

  return (
    <>
      <ConnectionStatus 
        isConnected={isConnected} 
        reconnectAttempts={reconnectAttempts}
        latestEvent={latestEvent}
      />
      <DashboardLayout
        sessions={sessions}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
        loading={loading}
        error={error}
        onRefresh={fetchSessions}
      />
    </>
  )
}

