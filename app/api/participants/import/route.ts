import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateQRToken } from '@/lib/qr'

interface CSVRow {
  name: string
  email: string
  company?: string
}

// POST /api/participants/import - Import participants from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, participants } = body as {
      eventId: string
      participants: CSVRow[]
    }

    if (!eventId || !participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, participants (array)' },
        { status: 400 }
      )
    }

    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const results = {
      success: [] as string[],
      errors: [] as { row: number; email: string; error: string }[],
      duplicates: [] as string[],
    }

    // Process each participant
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      const rowNumber = i + 1

      // Validate required fields
      if (!participant.name || !participant.email) {
        results.errors.push({
          row: rowNumber,
          email: participant.email || 'unknown',
          error: 'Missing name or email',
        })
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(participant.email)) {
        results.errors.push({
          row: rowNumber,
          email: participant.email,
          error: 'Invalid email format',
        })
        continue
      }

      try {
        // Check if participant already exists for this event
        const existing = await prisma.participant.findFirst({
          where: {
            eventId,
            email: participant.email,
          },
        })

        if (existing) {
          results.duplicates.push(participant.email)
          continue
        }

        // Generate QR token
        const qrToken = generateQRToken(eventId, participant.email)

        // Create participant
        await prisma.participant.create({
          data: {
            eventId,
            name: participant.name.trim(),
            email: participant.email.trim().toLowerCase(),
            company: participant.company?.trim() || null,
            qrToken,
          },
        })

        results.success.push(participant.email)
      } catch (error) {
        console.error(`Error creating participant ${participant.email}:`, error)
        results.errors.push({
          row: rowNumber,
          email: participant.email,
          error: 'Database error',
        })
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      summary: {
        total: participants.length,
        success: results.success.length,
        errors: results.errors.length,
        duplicates: results.duplicates.length,
      },
      details: results,
    })
  } catch (error) {
    console.error('Error importing participants:', error)
    return NextResponse.json(
      { error: 'Failed to import participants' },
      { status: 500 }
    )
  }
}
