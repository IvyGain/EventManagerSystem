import { NextRequest, NextResponse } from 'next/server'
import { getParticipantByQrToken, getEventById } from '@/lib/lark'
import { generateQRCode } from '@/lib/qr'

// GET /api/qr/token/[token] - Get QR code data by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
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

    // Get event details
    const event = await getEventById(participant.eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Generate QR code
    const qrCode = await generateQRCode(participant.qrToken)

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        company: participant.company,
      },
      event: {
        name: event.name,
        date: event.date,
        location: event.location,
      },
      qrCode,
      token: participant.qrToken,
    })
  } catch (error) {
    console.error('Error fetching QR data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QR data' },
      { status: 500 }
    )
  }
}
