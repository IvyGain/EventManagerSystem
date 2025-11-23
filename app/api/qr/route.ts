import { NextRequest, NextResponse } from 'next/server'
import { getParticipantById, getParticipants } from '@/lib/lark'
import { generateQRCode } from '@/lib/qr'

// GET /api/qr?participantId=xxx - Generate QR code for a participant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const participantId = searchParams.get('participantId')

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 }
      )
    }

    const participant = await getParticipantById(participantId)

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    const qrCodeDataUrl = await generateQRCode(participant.qrToken)

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
      },
      qrCode: qrCodeDataUrl,
      token: participant.qrToken,
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

// POST /api/qr/bulk - Generate QR codes for multiple participants
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    const participants = await getParticipants(eventId)

    const qrCodes = await Promise.all(
      participants.map(async (participant) => {
        const qrCode = await generateQRCode(participant.qrToken)
        return {
          participantId: participant.id,
          name: participant.name,
          email: participant.email,
          qrCode,
        }
      })
    )

    return NextResponse.json({ qrCodes })
  } catch (error) {
    console.error('Error generating bulk QR codes:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR codes' },
      { status: 500 }
    )
  }
}
