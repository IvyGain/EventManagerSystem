import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/events - List all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        participants: {
          select: {
            id: true,
            checkedIn: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    const eventsWithStats = events.map((event: typeof events[number]) => ({
      ...event,
      totalParticipants: event.participants.length,
      checkedInCount: event.participants.filter((p: typeof event.participants[number]) => p.checkedIn).length,
    }))

    return NextResponse.json(eventsWithStats)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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

    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        location,
      },
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
