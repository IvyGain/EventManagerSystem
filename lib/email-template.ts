/**
 * Email template generator with customizable content
 */

interface EmailTemplateData {
  participantName: string
  participantEmail: string
  participantCompany?: string
  eventName: string
  eventDate: string
  eventLocation: string
  qrCodeDataUrl: string
  qrPageUrl?: string  // URL to the QR display page
  customMessage?: string
}

/**
 * Generate HTML email with QR code
 * @param data - Email template data
 * @param customMessage - Optional custom message (supports {{QR_CODE}} placeholder)
 */
export function generateEmailTemplate(
  data: EmailTemplateData,
  customMessage?: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event-checkin-six.vercel.app'
  const qrPageUrl = data.qrPageUrl || `${appUrl}/qr/${data.qrCodeDataUrl.includes('token=') ? '' : ''}` // Will be passed from API

  const defaultMessage = `
    <p>Thank you for registering!</p>
    <p>Please show the QR code below at the check-in counter.</p>

    {{QR_CODE}}
  `

  // Use custom message if provided, otherwise use default
  let messageContent = customMessage || defaultMessage

  // Replace {{QR_CODE}} placeholder with actual QR code
  messageContent = messageContent.replace(
    /\{\{QR_CODE\}\}/g,
    `<div class="qr-code">
      <img src="${data.qrCodeDataUrl}" alt="QR Code" />
    </div>`
  )

  // Replace other placeholders
  messageContent = messageContent
    .replace(/\{\{NAME\}\}/g, data.participantName)
    .replace(/\{\{EMAIL\}\}/g, data.participantEmail)
    .replace(/\{\{COMPANY\}\}/g, data.participantCompany || '')
    .replace(/\{\{EVENT_NAME\}\}/g, data.eventName)
    .replace(/\{\{EVENT_DATE\}\}/g, data.eventDate)
    .replace(/\{\{EVENT_LOCATION\}\}/g, data.eventLocation)
    .replace(/\{\{QR_PAGE_URL\}\}/g, data.qrPageUrl || '')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .qr-section {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            text-align: center;
          }
          .qr-code {
            display: inline-block;
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .qr-code img {
            max-width: 250px;
            height: auto;
            display: block;
          }
          .participant-name {
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
            color: #333;
          }
          .participant-email {
            color: #666;
            font-size: 14px;
          }
          .qr-link-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .qr-link-box a {
            color: #1976d2;
            font-weight: bold;
            font-size: 16px;
            text-decoration: none;
          }
          .qr-link-box a:hover {
            text-decoration: underline;
          }
          .qr-link-box p {
            margin: 8px 0 0 0;
            font-size: 12px;
            color: #666;
          }
          .info-section {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
          }
          .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            width: 100px;
            flex-shrink: 0;
          }
          .info-value {
            color: #333;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            font-size: 13px;
            color: #666;
          }
          .footer ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .footer li {
            margin: 5px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.eventName}</h1>
            <p>${data.eventDate}</p>
            <p>${data.eventLocation}</p>
          </div>

          <div class="content">
            ${messageContent}

            <div class="qr-section">
              <div class="qr-code">
                <img src="${data.qrCodeDataUrl}" alt="Check-in QR Code" />
              </div>
              <div class="participant-name">${data.participantName}</div>
              ${data.participantCompany ? `<div class="participant-email">${data.participantCompany}</div>` : ''}
              <div class="participant-email">${data.participantEmail}</div>
            </div>

            ${data.qrPageUrl ? `
            <div class="qr-link-box">
              <a href="${data.qrPageUrl}">&#128279; View QR Code Online</a>
              <p>Save this link - access your QR code anytime from any device</p>
              <p style="font-size: 11px; color: #999; word-break: break-all;">${data.qrPageUrl}</p>
            </div>
            ` : ''}

            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Name</span>
                <span class="info-value">${data.participantName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">${data.participantEmail}</span>
              </div>
              ${data.participantCompany ? `
              <div class="info-row">
                <span class="info-label">Company</span>
                <span class="info-value">${data.participantCompany}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${data.eventDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location</span>
                <span class="info-value">${data.eventLocation}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>This QR code is for your personal use only</li>
              <li>Please keep it safe until check-in</li>
              <li>Display on smartphone or print this email</li>
            </ul>
            <p style="text-align: center; margin-top: 20px;">We look forward to seeing you!</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Default email templates
 */
export const EMAIL_TEMPLATES = {
  default: `
    <p>Thank you for registering!</p>
    <p>Please show the QR code below at the check-in counter.</p>
  `,

  formal: `
    <p>Dear {{NAME}},</p>
    <p>Thank you for registering for "{{EVENT_NAME}}".</p>
    <p>Please present the QR code below at the reception desk.</p>
  `,

  casual: `
    <p>Hi {{NAME}}! &#127881;</p>
    <p>Thanks for signing up for {{EVENT_NAME}}!</p>
    <p>Just show this QR code at check-in - that's it!</p>
  `,

  reminder: `
    <p>Dear {{NAME}},</p>
    <p>{{EVENT_NAME}} is coming up soon!</p>
    <p>Date: {{EVENT_DATE}}</p>
    <p>Location: {{EVENT_LOCATION}}</p>
    <p>Please bring this QR code with you.</p>
  `
}

/**
 * Available placeholders for email templates
 */
export const EMAIL_PLACEHOLDERS = [
  '{{QR_CODE}}',        // QR code image (required)
  '{{QR_PAGE_URL}}',    // URL to QR display page
  '{{NAME}}',           // Participant name
  '{{EMAIL}}',          // Email address
  '{{COMPANY}}',        // Company name
  '{{EVENT_NAME}}',     // Event name
  '{{EVENT_DATE}}',     // Event date/time
  '{{EVENT_LOCATION}}'  // Event location
]
