'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ParticipantData {
  participant: {
    id: string
    name: string
    email: string
    company?: string
  }
  event: {
    name: string
    date: string
    location: string
  }
  qrCode: string
  token: string
}

export default function QRDisplayPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<ParticipantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQRData() {
      try {
        const response = await fetch(`/api/qr/token/${token}`)
        if (!response.ok) {
          throw new Error('QR code not found')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load QR code')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchQRData()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">&#9888;</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">QR Code Not Found</h1>
          <p className="text-red-600 mb-6">{error || 'Invalid or expired link'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {data.event.name}
          </h1>
          <p className="text-gray-600">
            {new Date(data.event.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-500 text-sm">{data.event.location}</p>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center">
            <img
              src={data.qrCode}
              alt="Check-in QR Code"
              className="mx-auto w-64 h-64"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{data.participant.name}</p>
              {data.participant.company && (
                <p className="text-gray-600">{data.participant.company}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">{data.participant.email}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <p className="text-gray-700 text-sm">
            Please show this QR code at the check-in counter
          </p>
          <p className="text-gray-500 text-xs mt-2">
            You can screenshot or print this page
          </p>
        </div>

        {/* Check-in button for testing */}
        <div className="mt-6 text-center">
          <Link
            href={`/checkin?token=${data.token}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check-in Now
          </Link>
        </div>
      </div>
    </div>
  )
}
