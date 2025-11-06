'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import type { SessionEvent } from '@/hooks/useSessionWatch'

interface ConnectionStatusProps {
  isConnected: boolean
  reconnectAttempts: number
  latestEvent: SessionEvent | null
}

export default function ConnectionStatus({ 
  isConnected, 
  reconnectAttempts,
  latestEvent 
}: ConnectionStatusProps) {
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null)

  // Auto-hide tooltip after 3 seconds when a new event arrives
  useEffect(() => {
    // Get message from latest event
    let message: string | null = null
    if (latestEvent && latestEvent.type !== 'connected') {
      switch (latestEvent.type) {
        case 'session_created':
          message = `New session: ${latestEvent.sessionId?.slice(-8)}`
          break
        case 'session_updated':
          message = `Session updated: ${latestEvent.sessionId?.slice(-8)}`
          break
        case 'screenshot_added':
          message = `New screenshot: ${latestEvent.filename}`
          break
        default:
          message = null
      }
    }
    
    if (message) {
      // Show the message immediately
      setDisplayedMessage(message)
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setDisplayedMessage(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    } else {
      // Clear message if event is null or connected
      setDisplayedMessage(null)
    }
  }, [latestEvent])

  const eventMessage = displayedMessage

  return (
    <>
      {/* Connection Status Badge - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Badge
          variant={isConnected ? 'default' : 'destructive'}
          className="flex items-center gap-2 px-3 py-1.5 shadow-elevated"
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                {reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts})` : 'Disconnected'}
              </span>
            </>
          )}
        </Badge>
      </div>

      {/* Event Notification - Center Top */}
      {eventMessage && isConnected && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-light-blue/20 border border-light-blue/40 text-light-blue px-3 py-1.5 rounded-md text-xs shadow-elevated animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            {eventMessage}
          </div>
        </div>
      )}
    </>
  )
}

