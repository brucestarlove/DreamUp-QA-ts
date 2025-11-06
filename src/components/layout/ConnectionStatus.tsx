'use client'

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
  const getEventMessage = (event: SessionEvent | null) => {
    if (!event || event.type === 'connected') return null
    
    switch (event.type) {
      case 'session_created':
        return `New session: ${event.sessionId?.slice(-8)}`
      case 'session_updated':
        return `Session updated: ${event.sessionId?.slice(-8)}`
      case 'screenshot_added':
        return `New screenshot: ${event.filename}`
      default:
        return null
    }
  }

  const eventMessage = getEventMessage(latestEvent)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      {/* Connection Status Badge */}
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

      {/* Event Notification */}
      {eventMessage && isConnected && (
        <div className="bg-light-blue/20 border border-light-blue/40 text-light-blue px-3 py-1.5 rounded-md text-xs shadow-elevated animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {eventMessage}
        </div>
      )}
    </div>
  )
}

