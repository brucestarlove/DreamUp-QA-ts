import { NextResponse } from 'next/server'

// URL of your deployed CLI service (Railway, Render, etc.)
// Set this in Vercel environment variables as CLI_API_URL
const CLI_API_URL = process.env.CLI_API_URL || 'http://localhost:3001'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameUrl, config, llm, model, headed, retries } = body

    if (!gameUrl) {
      return NextResponse.json(
        { error: 'Game URL is required' },
        { status: 400 }
      )
    }

    // Call the external CLI service
    const response = await fetch(`${CLI_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameUrl,
        config,
        llm,
        model,
        headed,
        retries,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(
        { error: 'Failed to start test', details: error },
        { status: response.status }
      )
    }

    const result = await response.json()

    // Return immediately - the test will run in the background
    // The SSE watch endpoint will notify when the session is created
    return NextResponse.json({
      success: true,
      message: 'Test started',
      sessionId: result.sessionId,
    })
  } catch (error) {
    console.error('Error calling CLI service:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start test', 
        details: error instanceof Error ? error.message : String(error),
        hint: 'Make sure CLI_API_URL is set in Vercel environment variables'
      },
      { status: 500 }
    )
  }
}

