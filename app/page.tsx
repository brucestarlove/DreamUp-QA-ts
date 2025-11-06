'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function DashboardPage() {
  const [sessions, setSessions] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data)
      
      // Select the most recent session by default
      if (data.sessions && data.sessions.length > 0) {
        setSelectedSession(data.sessions[0].sessionId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      sessions={sessions}
      selectedSession={selectedSession}
      onSelectSession={setSelectedSession}
      loading={loading}
      error={error}
      onRefresh={fetchSessions}
    />
  )
}

