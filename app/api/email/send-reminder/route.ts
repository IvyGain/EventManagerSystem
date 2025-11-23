import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { generateReminderEmailTemplate } from '@/lib/email-template'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/email/send-reminder - リマインドメールを送信
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, participantIds } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventIdは必須です' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'メールサービスが設定されていません。RESEND_API_KEYを設定してください。' },
        { status: 500 }
      )
    }

    // イベント情報を取得
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        emailSettings: true,
        participants: participantIds?.length > 0
          ? { where: { id: { in: participantIds } } }
          : true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      )
    }

    const settings = event.emailSettings
    const participants = event.participants
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event-checkin-six.vercel.app'

    const results = {
      success: [] as string[],
      errors: [] as { email: string; error: string }[]
    }

    // バッチ送信（レート制限対策）
    const batchSize = 5
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (participant) => {
          try {
            const qrPageUrl = `${appUrl}/qr/${participant.qrToken}`

            const emailHtml = generateReminderEmailTemplate({
              participantName: participant.name,
              participantEmail: participant.email,
              participantCompany: participant.company || undefined,
              eventName: event.name,
              eventDate: new Date(event.date).toLocaleString('ja-JP'),
              eventLocation: event.location,
              qrPageUrl
            }, {
              message: settings?.reminderMessage || undefined
            })

            const subject = (settings?.reminderSubject || '【リマインド】{{eventName}} 開催のお知らせ')
              .replace('{{eventName}}', event.name)

            const { error } = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
              to: participant.email,
              subject,
              html: emailHtml
            })

            // メール送信ログを記録
            await prisma.emailLog.create({
              data: {
                participantId: participant.id,
                type: 'reminder',
                status: error ? 'failed' : 'sent',
                errorMessage: error?.message
              }
            })

            if (error) {
              results.errors.push({ email: participant.email, error: error.message })
            } else {
              results.success.push(participant.email)
            }
          } catch (err) {
            // エラーログを記録
            await prisma.emailLog.create({
              data: {
                participantId: participant.id,
                type: 'reminder',
                status: 'failed',
                errorMessage: err instanceof Error ? err.message : 'Unknown error'
              }
            }).catch(console.error)

            results.errors.push({
              email: participant.email,
              error: err instanceof Error ? err.message : 'Unknown error'
            })
          }
        })
      )
    }

    return NextResponse.json({
      message: 'リマインドメール送信が完了しました',
      summary: {
        total: participants.length,
        success: results.success.length,
        errors: results.errors.length
      },
      details: results
    })
  } catch (error) {
    console.error('リマインドメール送信エラー:', error)
    return NextResponse.json(
      { error: 'リマインドメールの送信に失敗しました' },
      { status: 500 }
    )
  }
}
