import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getParticipantById, getParticipants, getEventById } from '@/lib/lark'
import { generateQRCode } from '@/lib/qr'
import { generateEmailTemplate } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/email/send-qr - Send QR code via email to participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participantId } = body

    if (!participantId) {
      return NextResponse.json(
        { error: 'participantId is required' },
        { status: 400 }
      )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Get participant details
    const participant = await getParticipantById(participantId)

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
    const qrCodeDataUrl = await generateQRCode(participant.qrToken)

    // Generate QR page URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event-checkin-six.vercel.app'
    const qrPageUrl = `${appUrl}/qr/${participant.qrToken}`

    // Generate email HTML using template
    const emailHtml = generateEmailTemplate({
      eventName: event.name,
      eventDate: new Date(event.date).toLocaleString('ja-JP'),
      eventLocation: event.location,
      participantName: participant.name,
      participantEmail: participant.email,
      participantCompany: participant.company,
      qrCodeDataUrl,
      qrPageUrl,
    })

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: participant.email,
      subject: `${event.name} - チェックイン用QRコード`,
      html: emailHtml,
    })

    if (error) {
      console.error('Email sending error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: data?.id,
      recipient: participant.email,
    })
  } catch (error) {
    console.error('Error sending QR email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

// PUT /api/email/send-qr - Send QR codes to all participants in an event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Get event details
    const event = await getEventById(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all participants for the event
    const participants = await getParticipants(eventId)

    const results = {
      success: [] as string[],
      errors: [] as { email: string; error: string }[],
    }

    // Send emails in parallel (with a limit to avoid rate limiting)
    const batchSize = 5
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (participant) => {
          try {
            const qrCodeDataUrl = await generateQRCode(participant.qrToken)

            // Generate QR page URL
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event-checkin-six.vercel.app'
            const qrPageUrl = `${appUrl}/qr/${participant.qrToken}`

            const emailHtml = generateEmailTemplate({
              eventName: event.name,
              eventDate: new Date(event.date).toLocaleString('ja-JP'),
              eventLocation: event.location,
              participantName: participant.name,
              participantEmail: participant.email,
              participantCompany: participant.company,
              qrCodeDataUrl,
              qrPageUrl,
            })

            const { error } = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
              to: participant.email,
              subject: `${event.name} - チェックイン用QRコード`,
              html: emailHtml,
            })

            if (error) {
              results.errors.push({ email: participant.email, error: error.message })
            } else {
              results.success.push(participant.email)
            }
          } catch (err) {
            results.errors.push({
              email: participant.email,
              error: err instanceof Error ? err.message : 'Unknown error',
            })
          }
        })
      )
    }

    return NextResponse.json({
      message: 'Bulk email sending completed',
      summary: {
        total: participants.length,
        success: results.success.length,
        errors: results.errors.length,
      },
      details: results,
    })
  } catch (error) {
    console.error('Error sending bulk emails:', error)
    return NextResponse.json(
      { error: 'Failed to send bulk emails' },
      { status: 500 }
    )
  }
}
