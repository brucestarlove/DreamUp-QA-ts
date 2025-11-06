import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; filename: string }> }
) {
  try {
    const { sessionId, filename } = await params
    
    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }
    
    const imagePath = join(
      process.cwd(),
      'results',
      sessionId,
      'screenshots',
      filename
    )
    
    const imageBuffer = await readFile(imagePath)
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving screenshot:', error)
    return NextResponse.json(
      { error: 'Screenshot not found' },
      { status: 404 }
    )
  }
}

