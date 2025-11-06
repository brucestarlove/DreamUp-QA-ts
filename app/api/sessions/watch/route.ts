import { NextRequest } from 'next/server'
import chokidar from 'chokidar'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * SSE endpoint for real-time session updates
 * Watches the results directory for new sessions, screenshots, and output.json changes
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
      
      const resultsDir = join(process.cwd(), 'results')
      
      // Watch the results directory for changes
      const watcher = chokidar.watch(resultsDir, {
        ignoreInitial: true,
        depth: 3, // Watch up to 3 levels deep (results/session_*/screenshots/)
        awaitWriteFinish: {
          stabilityThreshold: 500, // Wait 500ms after file stops changing
          pollInterval: 100
        },
        persistent: true,
      })
      
      // Send keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':ping\n\n'))
        } catch (error) {
          // Stream closed, stop interval
          clearInterval(keepAliveInterval)
        }
      }, 30000)
      
      // Handle new session directory creation
      watcher.on('addDir', (path) => {
        if (path.includes('session_')) {
          const sessionId = path.split('/').pop() || path.split('\\').pop()
          if (sessionId) {
            try {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'session_created', 
                  sessionId,
                  timestamp: new Date().toISOString()
                })}\n\n`
              ))
            } catch (error) {
              console.error('Error sending session_created event:', error)
            }
          }
        }
      })
      
      // Handle output.json creation/updates
      watcher.on('add', (path) => {
        if (path.endsWith('output.json')) {
          const parts = path.split(/[/\\]/)
          const sessionIndex = parts.findIndex(p => p.startsWith('session_'))
          if (sessionIndex !== -1) {
            const sessionId = parts[sessionIndex]
            try {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'session_updated', 
                  sessionId,
                  timestamp: new Date().toISOString()
                })}\n\n`
              ))
            } catch (error) {
              console.error('Error sending session_updated event:', error)
            }
          }
        }
      })
      
      watcher.on('change', (path) => {
        if (path.endsWith('output.json')) {
          const parts = path.split(/[/\\]/)
          const sessionIndex = parts.findIndex(p => p.startsWith('session_'))
          if (sessionIndex !== -1) {
            const sessionId = parts[sessionIndex]
            try {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'session_updated', 
                  sessionId,
                  timestamp: new Date().toISOString()
                })}\n\n`
              ))
            } catch (error) {
              console.error('Error sending session_updated event:', error)
            }
          }
        }
      })
      
      // Handle new screenshot additions
      watcher.on('add', (path) => {
        if (path.includes('screenshots') && path.endsWith('.png')) {
          const parts = path.split(/[/\\]/)
          const sessionIndex = parts.findIndex(p => p.startsWith('session_'))
          if (sessionIndex !== -1) {
            const sessionId = parts[sessionIndex]
            const filename = parts[parts.length - 1]
            try {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'screenshot_added', 
                  sessionId,
                  filename,
                  timestamp: new Date().toISOString()
                })}\n\n`
              ))
            } catch (error) {
              console.error('Error sending screenshot_added event:', error)
            }
          }
        }
      })
      
      // Handle errors
      watcher.on('error', (error) => {
        console.error('File watcher error:', error)
        try {
          const message = error instanceof Error ? error.message : String(error)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ 
              type: 'error', 
              message 
            })}\n\n`
          ))
        } catch (e) {
          // Stream might be closed
        }
      })
      
      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        console.log('SSE connection closed, cleaning up watcher')
        clearInterval(keepAliveInterval)
        watcher.close().catch(err => {
          console.error('Error closing watcher:', err)
        })
        try {
          controller.close()
        } catch (e) {
          // Stream might already be closed
        }
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    }
  })
}

