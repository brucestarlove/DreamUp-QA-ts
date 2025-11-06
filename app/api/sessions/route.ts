import { NextResponse } from 'next/server'
import { getAllSessions } from '@/lib/data/sessions'

export async function GET() {
  try {
    const data = await getAllSessions()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

