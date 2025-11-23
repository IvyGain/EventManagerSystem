import { NextRequest, NextResponse } from 'next/server'
import { getParticipants, createParticipant, getEventById } from '@/lib/lark'

// GET /api/participants - List all participants
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    const participants = await getParticipants(eventId || undefined)

    return NextResponse.json(participants)
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

// POST /api/participants - Create new participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, name, email, company } = body

    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, name, email' },
        { status: 400 }
      )
    }

    // Check if event exists
    const event = await getEventById(eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if participant already exists for this event
    const existingParticipants = await getParticipants(eventId)
    const existing = existingParticipants.find(p => p.email === email)

    if (existing) {
      return NextResponse.json(
        { error: 'Participant with this email already exists for this event' },
        { status: 409 }
      )
    }

    // Create participant
    const participant = await createParticipant({
      eventId,
      name,
      email,
      company,
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error('Error creating participant:', error)
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    )
  }
}
