'use client'

import { useState, useEffect, useCallback } from 'react'
import QRScanner from '@/components/QRScanner'

interface CheckInResult {
  success: boolean
  participant?: {
    name: string
    email: string
    company?: string
    checkedInAt: string
    event: {
      name: string
      date?: string
    }
  }
  error?: string
  alreadyCheckedIn?: boolean
}

type ScreenState = 'scanning' | 'processing' | 'success' | 'error' | 'already'

export default function CheckInPage() {
  const [screenState, setScreenState] = useState<ScreenState>('scanning')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [flashAnimation, setFlashAnimation] = useState(false)

  // Auto-return to scanning after success/error
  useEffect(() => {
    if (screenState === 'success' || screenState === 'error' || screenState === 'already') {
      // Flash animation
      setFlashAnimation(true)
      setTimeout(() => setFlashAnimation(false), 300)

      // Countdown timer
      setCountdown(3)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setScreenState('scanning')
            setResult(null)
            return 3
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [screenState])

  const handleScan = useCallback(async (token: string) => {
    // Prevent duplicate scans
    if (screenState !== 'scanning') return

    setScreenState('processing')

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
        setScreenState('success')
      } else if (response.status === 409) {
        // Already checked in
        setResult({
          success: false,
          error: data.error,
          alreadyCheckedIn: true,
          participant: data.participant
        })
        setScreenState('already')
      } else {
        setResult({ success: false, error: data.error || 'Check-in failed' })
        setScreenState('error')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setResult({ success: false, error: 'Network error' })
      setScreenState('error')
    }
  }, [screenState])

  // Full screen success view
  if (screenState === 'success' && result?.participant) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        flashAnimation ? 'bg-white' : 'bg-green-500'
      }`}>
        <div className="text-center text-white px-8 animate-fade-in">
          <div className="text-[120px] mb-4 animate-bounce-once">
            &#10003;
          </div>
          <h1 className="text-5xl font-bold mb-8">
            Check-in Complete!
          </h1>

          <div className="bg-white/20 backdrop-blur rounded-3xl p-8 mb-8 max-w-lg mx-auto">
            <p className="text-3xl font-bold mb-4">
              {result.participant.name}
            </p>
            {result.participant.company && (
              <p className="text-2xl opacity-90 mb-2">
                {result.participant.company}
              </p>
            )}
            <p className="text-xl opacity-80">
              {result.participant.email}
            </p>
            <div className="mt-6 pt-6 border-t border-white/30">
              <p className="text-xl opacity-90">
                {result.participant.event.name}
              </p>
            </div>
          </div>

          <div className="text-2xl opacity-80">
            {countdown} next scan...
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes bounce-once {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
          .animate-bounce-once {
            animation: bounce-once 0.5s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Already checked in view
  if (screenState === 'already' && result) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        flashAnimation ? 'bg-white' : 'bg-yellow-500'
      }`}>
        <div className="text-center text-white px-8 animate-fade-in">
          <div className="text-[100px] mb-4">
            &#9888;
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Already Checked In
          </h1>

          {result.participant && (
            <div className="bg-white/20 backdrop-blur rounded-3xl p-6 mb-8 max-w-lg mx-auto">
              <p className="text-2xl font-bold mb-2">
                {result.participant.name}
              </p>
              <p className="text-lg opacity-80">
                {new Date(result.participant.checkedInAt).toLocaleString('ja-JP')}
              </p>
            </div>
          )}

          <div className="text-2xl opacity-80">
            {countdown} next scan...
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Error view
  if (screenState === 'error') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        flashAnimation ? 'bg-white' : 'bg-red-500'
      }`}>
        <div className="text-center text-white px-8 animate-fade-in">
          <div className="text-[100px] mb-4">
            &#10007;
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Error
          </h1>

          <div className="bg-white/20 backdrop-blur rounded-3xl p-6 mb-8 max-w-lg mx-auto">
            <p className="text-xl">
              {result?.error || 'Unknown error'}
            </p>
          </div>

          <div className="text-2xl opacity-80">
            {countdown} next scan...
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Processing view
  if (screenState === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-500">
        <div className="text-center text-white px-8">
          <div className="text-[80px] mb-4 animate-pulse">
            &#8987;
          </div>
          <h1 className="text-3xl font-bold">
            Processing...
          </h1>
        </div>
      </div>
    )
  }

  // Scanning view (default)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white py-4 px-6 text-center">
        <h1 className="text-2xl font-bold">
          Event Check-in
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Scan QR code
        </p>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <QRScanner onScan={handleScan} />
        </div>
      </div>

      {/* Footer hint */}
      <div className="bg-gray-800 text-gray-400 py-4 px-6 text-center text-sm">
        Place QR code within the frame
      </div>
    </div>
  )
}
