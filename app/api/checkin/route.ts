import { NextRequest, NextResponse } from 'next/server'
import {
  getParticipantByQrToken,
  updateParticipantCheckIn,
  createCheckInLog,
  getEventById,
  getEventStats
} from '@/lib/lark'
import { verifyQRToken } from '@/lib/qr'

// POST /api/checkin - Check in a participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, deviceInfo } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify token format
    if (!verifyQRToken(token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Find participant by QR token
    const participant = await getParticipantByQrToken(token)

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Check if already checked in
    if (participant.checkedIn) {
      return NextResponse.json(
        {
          error: 'Already checked in',
          participant: {
            name: participant.name,
            email: participant.email,
            checkedInAt: participant.checkedInAt,
          },
        },
        { status: 409 }
      )
    }

    // Get event details
    const event = await getEventById(participant.eventId)

    // Update participant check-in status
    if (participant.record_id) {
      await updateParticipantCheckIn(participant.record_id, true)
    }

    // Create check-in log
    await createCheckInLog({
      participantId: participant.id,
      deviceInfo: deviceInfo || undefined,
    })

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        company: participant.company,
        checkedInAt: new Date().toISOString(),
        event: event ? {
          name: event.name,
          date: event.date,
        } : null,
      },
    })
  } catch (error) {
    console.error('Error checking in participant:', error)
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    )
  }
}

// GET /api/checkin/stats - Get check-in statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    const stats = await getEventStats(eventId)

    const checkInRate = stats.totalParticipants > 0
      ? Math.round((stats.checkedInCount / stats.totalParticipants) * 100)
      : 0

    return NextResponse.json({
      total: stats.totalParticipants,
      checkedIn: stats.checkedInCount,
      notCheckedIn: stats.totalParticipants - stats.checkedInCount,
      checkInRate,
    })
  } catch (error) {
    console.error('Error fetching check-in stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
