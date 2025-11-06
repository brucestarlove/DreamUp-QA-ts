'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { GroupedSessions } from '@/lib/types/test-result'
import SessionCard from '@/components/sessions/SessionCard'

interface SidebarProps {
  grouped: GroupedSessions
  selectedSession: string | null
  onSelectSession: (sessionId: string) => void
  expandedGameUrl?: string | null
}

export default function Sidebar({ grouped, selectedSession, onSelectSession, expandedGameUrl }: SidebarProps) {
  const gameUrls = Object.keys(grouped).sort()
  
  // Determine which accordions should be open
  // If expandedGameUrl is provided, open that one; otherwise open all by default
  const defaultValues = expandedGameUrl 
    ? [expandedGameUrl] 
    : gameUrls // Open all by default, or [] to close all

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
        <Accordion type="multiple" className="px-2" defaultValue={defaultValues}>
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
                      <SessionCard
                        key={session.sessionId}
                        session={session}
                        isSelected={selectedSession === session.sessionId}
                        onClick={() => onSelectSession(session.sessionId)}
                      />
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

