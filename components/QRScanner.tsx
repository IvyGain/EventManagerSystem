'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (token: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const readerElementId = 'qr-reader'

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      const scanner = new Html5Qrcode(readerElementId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract token from URL or use as-is
          const url = new URL(decodedText)
          const token = url.searchParams.get('token') || decodedText
          onScan(token)
          stopScanning()
        },
        undefined
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('カメラへのアクセスに失敗しました')
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div id={readerElementId} className="rounded-lg overflow-hidden" />

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
          >
            スキャン開始
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-8 py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-lg"
          >
            スキャン停止
          </button>
        )}
      </div>
    </div>
  )
}
