import { NextRequest, NextResponse } from 'next/server'
import { getEvents, createEvent, getEventStats } from '@/lib/lark'

// GET /api/events - List all events
export async function GET() {
  try {
    // Log environment variables for debugging
    console.log('LARK_APP_ID:', process.env.LARK_APP_ID ? 'set' : 'not set')
    console.log('LARK_BASE_ID:', process.env.LARK_BASE_ID ? 'set' : 'not set')
    console.log('LARK_TABLE_EVENTS:', process.env.LARK_TABLE_EVENTS ? 'set' : 'not set')

    const events = await getEvents()

    // Get stats for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const stats = await getEventStats(event.id)
        return {
          ...event,
          totalParticipants: stats.totalParticipants,
          checkedInCount: stats.checkedInCount,
        }
      })
    )

    return NextResponse.json(eventsWithStats)
  } catch (error) {
    console.error('Error fetching events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch events', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, location } = body

    if (!name || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, date, location' },
        { status: 400 }
      )
    }

    const event = await createEvent({
      name,
      date: new Date(date).toISOString(),
      location,
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
