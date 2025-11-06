'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import type { GroupedSessions } from '@/lib/types/test-result'
import { formatDistanceToNow } from '@/lib/utils/date'

interface SidebarProps {
  grouped: GroupedSessions
  selectedSession: string | null
  onSelectSession: (sessionId: string) => void
}

export default function Sidebar({ grouped, selectedSession, onSelectSession }: SidebarProps) {
  const gameUrls = Object.keys(grouped).sort()

  if (gameUrls.length === 0) {
    return (
      <div className="w-[320px] h-full bg-mid-navy border-r border-light-blue/20 flex items-center justify-center p-6">
        <p className="text-white/60 text-sm text-center">
          No test sessions found. Run your first test to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="w-[320px] h-full bg-mid-navy border-r border-light-blue/20 flex flex-col">
      <div className="p-4 border-b border-light-blue/10">
        <h2 className="text-lg font-semibold text-light-blue">Test Sessions</h2>
        <p className="text-xs text-white/60 mt-1">
          {Object.values(grouped).flat().length} total sessions
        </p>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" className="px-2">
          {gameUrls.map((gameUrl) => {
            const sessions = grouped[gameUrl]
            const gameName = new URL(gameUrl).hostname + new URL(gameUrl).pathname
            
            return (
              <AccordionItem key={gameUrl} value={gameUrl} className="border-light-blue/10">
                <AccordionTrigger className="text-white/90 hover:text-light-blue text-sm px-2">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{gameName}</span>
                    <span className="text-xs text-white/50">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pl-2">
                    {sessions.map((session) => (
                      <button
                        key={session.sessionId}
                        onClick={() => onSelectSession(session.sessionId)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                          selectedSession === session.sessionId
                            ? 'bg-light-blue/20 border border-light-blue/40'
                            : 'bg-dark-navy/50 hover:bg-dark-navy border border-transparent hover:border-light-blue/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={session.result.status === 'pass' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {session.result.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-white/60">
                            {formatDistanceToNow(session.result.timestamp)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/70">Score</span>
                            <span className="text-sm font-semibold text-light-blue">
                              {(session.result.playability_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          
                          {session.result.test_duration && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/70">Duration</span>
                              <span className="text-xs text-white/90">
                                {session.result.test_duration}s
                              </span>
                            </div>
                          )}
                          
                          {session.result.issues && session.result.issues.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/70">Issues</span>
                              <span className="text-xs text-destructive">
                                {session.result.issues.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </div>
  )
}

