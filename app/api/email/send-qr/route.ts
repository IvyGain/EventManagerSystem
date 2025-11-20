import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'
import { generateQRCode } from '@/lib/qr'

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

    // Get participant and event details
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { event: true },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(participant.qrToken)

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: participant.email,
      subject: `${participant.event.name} - チェックイン用QRコード`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                text-align: center;
              }
              h1 {
                color: #2563eb;
                margin-bottom: 20px;
              }
              .qr-code {
                margin: 30px 0;
                padding: 20px;
                background-color: white;
                border-radius: 10px;
                display: inline-block;
              }
              .qr-code img {
                max-width: 300px;
                height: auto;
              }
              .info {
                background-color: white;
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
                text-align: left;
              }
              .info-row {
                margin: 10px 0;
                padding: 10px;
                border-bottom: 1px solid #eee;
              }
              .info-label {
                font-weight: bold;
                color: #666;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📱 ${participant.event.name}</h1>
              <p>ご参加いただきありがとうございます。</p>
              <p>当日は下記のQRコードを受付でご提示ください。</p>

              <div class="qr-code">
                <img src="${qrCodeDataUrl}" alt="QRコード" />
              </div>

              <div class="info">
                <div class="info-row">
                  <span class="info-label">お名前:</span> ${participant.name}
                </div>
                <div class="info-row">
                  <span class="info-label">メールアドレス:</span> ${participant.email}
                </div>
                ${participant.company ? `
                <div class="info-row">
                  <span class="info-label">会社名:</span> ${participant.company}
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">日時:</span> ${new Date(participant.event.date).toLocaleString('ja-JP')}
                </div>
                <div class="info-row">
                  <span class="info-label">場所:</span> ${participant.event.location}
                </div>
              </div>

              <div class="footer">
                <p><strong>注意事項:</strong></p>
                <ul style="text-align: left;">
                  <li>このQRコードは参加者様専用です</li>
                  <li>当日受付でスキャンするまで大切に保管してください</li>
                  <li>印刷またはスマートフォンの画面で表示してください</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `,
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

// POST /api/email/send-qr/bulk - Send QR codes to multiple participants
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

    // Get all participants for the event
    const participants = await prisma.participant.findMany({
      where: { eventId },
      include: { event: true },
    })

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

            const { error } = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
              to: participant.email,
              subject: `${participant.event.name} - チェックイン用QRコード`,
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                      }
                      .container {
                        background-color: #f9f9f9;
                        border-radius: 10px;
                        padding: 30px;
                        text-align: center;
                      }
                      h1 {
                        color: #2563eb;
                        margin-bottom: 20px;
                      }
                      .qr-code {
                        margin: 30px 0;
                        padding: 20px;
                        background-color: white;
                        border-radius: 10px;
                        display: inline-block;
                      }
                      .qr-code img {
                        max-width: 300px;
                        height: auto;
                      }
                      .info {
                        background-color: white;
                        border-radius: 10px;
                        padding: 20px;
                        margin-top: 20px;
                        text-align: left;
                      }
                      .info-row {
                        margin: 10px 0;
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                      }
                      .info-label {
                        font-weight: bold;
                        color: #666;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>📱 ${participant.event.name}</h1>
                      <p>ご参加いただきありがとうございます。</p>
                      <p>当日は下記のQRコードを受付でご提示ください。</p>

                      <div class="qr-code">
                        <img src="${qrCodeDataUrl}" alt="QRコード" />
                      </div>

                      <div class="info">
                        <div class="info-row">
                          <span class="info-label">お名前:</span> ${participant.name}
                        </div>
                        <div class="info-row">
                          <span class="info-label">メールアドレス:</span> ${participant.email}
                        </div>
                        ${participant.company ? `
                        <div class="info-row">
                          <span class="info-label">会社名:</span> ${participant.company}
                        </div>
                        ` : ''}
                        <div class="info-row">
                          <span class="info-label">日時:</span> ${new Date(participant.event.date).toLocaleString('ja-JP')}
                        </div>
                        <div class="info-row">
                          <span class="info-label">場所:</span> ${participant.event.location}
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
              `,
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
