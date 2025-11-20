'use client'

import { useState } from 'react'
import QRScanner from '@/components/QRScanner'
import Link from 'next/link'

interface CheckInResult {
  success: boolean
  participant?: {
    name: string
    email: string
    company?: string
    checkedInAt: string
    event: {
      name: string
    }
  }
  error?: string
}

export default function CheckInPage() {
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleScan = async (token: string) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          deviceInfo: navigator.userAgent,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, participant: data.participant })
      } else {
        setResult({ success: false, error: data.error || 'チェックインに失敗しました' })
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setResult({ success: false, error: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← ホームに戻る
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              チェックイン
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              QRコードをカメラでスキャンしてください
            </p>
          </div>

          {loading && (
            <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
              処理中...
            </div>
          )}

          {result && !loading && (
            <div className={`mb-6 p-6 rounded-lg ${
              result.success
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {result.success && result.participant ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold mb-4">チェックイン完了！</h2>
                  <div className="space-y-2 text-lg">
                    <p><strong>イベント:</strong> {result.participant.event.name}</p>
                    <p><strong>お名前:</strong> {result.participant.name}</p>
                    <p><strong>メール:</strong> {result.participant.email}</p>
                    {result.participant.company && (
                      <p><strong>会社:</strong> {result.participant.company}</p>
                    )}
                    <p className="text-sm mt-4">
                      {new Date(result.participant.checkedInAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <button
                    onClick={() => setResult(null)}
                    className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    次の参加者をスキャン
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">✗</div>
                  <h2 className="text-2xl font-bold mb-4">エラー</h2>
                  <p className="text-lg mb-4">{result.error}</p>
                  <button
                    onClick={() => setResult(null)}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    再試行
                  </button>
                </div>
              )}
            </div>
          )}

          {!result && !loading && <QRScanner onScan={handleScan} />}
        </div>
      </div>
    </div>
  )
}
