'use client'

import { useEffect, useState, useRef } from 'react'

export interface SessionEvent {
  type: 'connected' | 'session_created' | 'session_updated' | 'screenshot_added' | 'error'
  sessionId?: string
  filename?: string
  message?: string
  timestamp?: string
}

interface UseSessionWatchOptions {
  onUpdate?: (event: SessionEvent) => void
  onConnected?: () => void
  onError?: (error: Event) => void
  enabled?: boolean
}

/**
 * React hook for real-time session updates via Server-Sent Events
 * 
 * Uses refs for callbacks to prevent unnecessary reconnections
 * 
 * @param options - Configuration options
 * @returns Connection status and latest event
 */
export function useSessionWatch(options: UseSessionWatchOptions = {}) {
  const {
    onUpdate,
    onConnected,
    onError,
    enabled = true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [latestEvent, setLatestEvent] = useState<SessionEvent | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  
  // Use refs to store callbacks so they don't trigger reconnections
  const onUpdateRef = useRef(onUpdate)
  const onConnectedRef = useRef(onConnected)
  const onErrorRef = useRef(onError)
  
  // Update refs when callbacks change (without causing reconnection)
  useEffect(() => {
    onUpdateRef.current = onUpdate
    onConnectedRef.current = onConnected
    onErrorRef.current = onError
  }, [onUpdate, onConnected, onError])

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsConnected(false)
      return
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // Reset reconnect attempts when manually reconnecting
    reconnectAttemptsRef.current = 0
    setReconnectAttempts(0)

    // Create new EventSource connection
    const eventSource = new EventSource('/api/sessions/watch')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
      setReconnectAttempts(0)
      onConnectedRef.current?.()
    }

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data: SessionEvent = JSON.parse(event.data)
        setLatestEvent(data)
        
        if (data.type === 'connected') {
          setIsConnected(true)
          reconnectAttemptsRef.current = 0
          setReconnectAttempts(0)
          onConnectedRef.current?.()
        } else {
          // Trigger update callback for non-connection events
          onUpdateRef.current?.(data)
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error: Event) => {
      // EventSource automatically attempts to reconnect on error
      // Check readyState to determine if this is a connection error
      if (eventSource.readyState === EventSource.CLOSED) {
        // Connection closed - will not auto-reconnect
        setIsConnected(false)
        reconnectAttemptsRef.current += 1
        setReconnectAttempts(reconnectAttemptsRef.current)
        onErrorRef.current?.(error)
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        // Reconnecting - just update state
        setIsConnected(false)
      }
      // EventSource.OPEN is healthy connection, no action needed
    }

    // Cleanup on unmount or when enabled changes
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [enabled]) // Only depend on enabled, not callbacks

  return { 
    isConnected, 
    latestEvent,
    reconnectAttempts 
  }
}

