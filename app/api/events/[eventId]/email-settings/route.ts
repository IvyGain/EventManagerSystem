import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// イベントのメール設定を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const settings = await prisma.eventEmailSettings.findUnique({
      where: { eventId }
    })

    // 設定がない場合はデフォルト値を返す
    if (!settings) {
      return NextResponse.json({
        eventId,
        qrSubject: '{{eventName}} - チェックイン用QRコード',
        qrGreeting: 'ご参加いただきありがとうございます！',
        qrMainMessage: '当日は下記のQRコードを受付でご提示ください。',
        qrInstructions: JSON.stringify([
          'このQRコードは参加者様専用です',
          '当日受付でスキャンするまで大切に保管してください',
          '印刷またはスマートフォンの画面で表示してください'
        ]),
        qrFooter: '皆様のご来場を心よりお待ちしております！',
        reminderEnabled: false,
        reminderDaysBefore: 1,
        reminderSubject: '【リマインド】{{eventName}} 開催のお知らせ',
        reminderMessage: 'いよいよ明日、イベントが開催されます。お忘れなくご参加ください。'
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to get email settings:', error)
    return NextResponse.json(
      { error: 'メール設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// イベントのメール設定を保存/更新
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await request.json()

    // イベントの存在確認
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'イベントが見つかりません' },
        { status: 404 }
      )
    }

    const settings = await prisma.eventEmailSettings.upsert({
      where: { eventId },
      update: {
        qrSubject: body.qrSubject,
        qrGreeting: body.qrGreeting,
        qrMainMessage: body.qrMainMessage,
        qrInstructions: body.qrInstructions,
        qrFooter: body.qrFooter,
        reminderEnabled: body.reminderEnabled,
        reminderDaysBefore: body.reminderDaysBefore,
        reminderSubject: body.reminderSubject,
        reminderMessage: body.reminderMessage
      },
      create: {
        eventId,
        qrSubject: body.qrSubject,
        qrGreeting: body.qrGreeting,
        qrMainMessage: body.qrMainMessage,
        qrInstructions: body.qrInstructions,
        qrFooter: body.qrFooter,
        reminderEnabled: body.reminderEnabled ?? false,
        reminderDaysBefore: body.reminderDaysBefore ?? 1,
        reminderSubject: body.reminderSubject,
        reminderMessage: body.reminderMessage
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to save email settings:', error)
    return NextResponse.json(
      { error: 'メール設定の保存に失敗しました' },
      { status: 500 }
    )
  }
}
