import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

/**
 * Generate a unique QR token for a participant
 * @param eventId - Event ID
 * @param email - Participant email
 * @returns QR token string
 */
export function generateQRToken(eventId: string, email: string): string {
  const data = `${eventId}:${email}:${Date.now()}:${uuidv4()}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate QR code as data URL
 * @param token - QR token string
 * @returns Promise<string> - Data URL of QR code
 */
export async function generateQRCode(token: string): Promise<string> {
  try {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkin?token=${token}`
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Verify QR token
 * @param token - Token to verify
 * @returns boolean - True if valid format
 */
export function verifyQRToken(token: string): boolean {
  // Check if token is a valid SHA256 hash or UUID
  const sha256Pattern = /^[a-f0-9]{64}$/
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return sha256Pattern.test(token) || uuidPattern.test(token)
}
