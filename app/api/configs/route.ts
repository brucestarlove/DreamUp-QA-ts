import { NextResponse } from 'next/server'
import { getConfigFiles } from '@/lib/data/sessions'

export async function GET() {
  try {
    const configs = await getConfigFiles()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error fetching configs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configs' },
      { status: 500 }
    )
  }
}

