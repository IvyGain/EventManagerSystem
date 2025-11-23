// Lark Base (Bitable) API Integration

const LARK_API_BASE = 'https://open.larksuite.com/open-apis'

interface LarkConfig {
  appId: string
  appSecret: string
  baseId: string
}

interface AccessToken {
  token: string
  expiresAt: number
}

let cachedToken: AccessToken | null = null

// Get Lark configuration from environment
function getConfig(): LarkConfig {
  const appId = process.env.LARK_APP_ID
  const appSecret = process.env.LARK_APP_SECRET
  const baseId = process.env.LARK_BASE_ID

  if (!appId || !appSecret || !baseId) {
    throw new Error('Missing Lark configuration. Set LARK_APP_ID, LARK_APP_SECRET, and LARK_BASE_ID')
  }

  return { appId, appSecret, baseId }
}

// Get tenant access token
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  const config = getConfig()

  const response = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  })

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`Failed to get access token: ${data.msg}`)
  }

  cachedToken = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + (data.expire - 300) * 1000, // Refresh 5 min early
  }

  return cachedToken.token
}

// Generic API request helper
async function larkRequest(
  method: string,
  endpoint: string,
  body?: object
): Promise<any> {
  const token = await getAccessToken()

  const response = await fetch(`${LARK_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (data.code !== 0) {
    console.error('Lark API Error:', data)
    throw new Error(`Lark API Error: ${data.msg}`)
  }

  return data.data
}

// Get Table IDs from environment (called inside functions for serverless compatibility)
function getTableIds() {
  return {
    events: process.env.LARK_TABLE_EVENTS || '',
    participants: process.env.LARK_TABLE_PARTICIPANTS || '',
    checkInLogs: process.env.LARK_TABLE_CHECKIN_LOGS || '',
  }
}

// ============ Events API ============

export interface LarkEvent {
  record_id?: string
  id: string
  name: string
  date: string
  location: string
  createdAt: string
}

export async function getEvents(): Promise<LarkEvent[]> {
  const config = getConfig()
  const data = await larkRequest(
    'GET',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().events}/records`
  )

  return (data.items || []).map((item: any) => ({
    record_id: item.record_id,
    id: item.fields.id || item.record_id,
    name: item.fields.name || '',
    date: item.fields.date || '',
    location: item.fields.location || '',
    createdAt: item.fields.createdAt || '',
  }))
}

export async function createEvent(event: Omit<LarkEvent, 'record_id' | 'id' | 'createdAt'>): Promise<LarkEvent> {
  const config = getConfig()
  const id = crypto.randomUUID()

  const data = await larkRequest(
    'POST',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().events}/records`,
    {
      fields: {
        id,
        name: event.name,
        date: event.date,
        location: event.location,
        createdAt: new Date().toISOString(),
      },
    }
  )

  return {
    record_id: data.record.record_id,
    id,
    name: event.name,
    date: event.date,
    location: event.location,
    createdAt: new Date().toISOString(),
  }
}

export async function getEventById(eventId: string): Promise<LarkEvent | null> {
  const events = await getEvents()
  return events.find(e => e.id === eventId) || null
}

// ============ Participants API ============

export interface LarkParticipant {
  record_id?: string
  id: string
  eventId: string
  name: string
  email: string
  company?: string
  qrToken: string
  checkedIn: boolean
  checkedInAt?: string
  createdAt: string
}

export async function getParticipants(eventId?: string): Promise<LarkParticipant[]> {
  const config = getConfig()

  let endpoint = `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().participants}/records`

  // Add filter if eventId is provided
  if (eventId) {
    endpoint += `?filter=CurrentValue.[eventId]="${eventId}"`
  }

  const data = await larkRequest('GET', endpoint)

  return (data.items || []).map((item: any) => ({
    record_id: item.record_id,
    id: item.fields.id || item.record_id,
    eventId: item.fields.eventId || '',
    name: item.fields.name || '',
    email: item.fields.email || '',
    company: item.fields.company || '',
    qrToken: item.fields.qrToken || '',
    checkedIn: item.fields.checkedIn === true || item.fields.checkedIn === 'true',
    checkedInAt: item.fields.checkedInAt || undefined,
    createdAt: item.fields.createdAt || '',
  }))
}

export async function createParticipant(
  participant: Omit<LarkParticipant, 'record_id' | 'id' | 'qrToken' | 'checkedIn' | 'checkedInAt' | 'createdAt'>
): Promise<LarkParticipant> {
  const config = getConfig()
  const id = crypto.randomUUID()
  const qrToken = crypto.randomUUID()

  const data = await larkRequest(
    'POST',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().participants}/records`,
    {
      fields: {
        id,
        eventId: participant.eventId,
        name: participant.name,
        email: participant.email,
        company: participant.company || '',
        qrToken,
        checkedIn: false,
        createdAt: new Date().toISOString(),
      },
    }
  )

  return {
    record_id: data.record.record_id,
    id,
    eventId: participant.eventId,
    name: participant.name,
    email: participant.email,
    company: participant.company,
    qrToken,
    checkedIn: false,
    createdAt: new Date().toISOString(),
  }
}

export async function createParticipantsBatch(
  participants: Array<Omit<LarkParticipant, 'record_id' | 'id' | 'qrToken' | 'checkedIn' | 'checkedInAt' | 'createdAt'>>
): Promise<LarkParticipant[]> {
  const config = getConfig()

  const records = participants.map(p => ({
    fields: {
      id: crypto.randomUUID(),
      eventId: p.eventId,
      name: p.name,
      email: p.email,
      company: p.company || '',
      qrToken: crypto.randomUUID(),
      checkedIn: false,
      createdAt: new Date().toISOString(),
    },
  }))

  const data = await larkRequest(
    'POST',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().participants}/records/batch_create`,
    { records }
  )

  return (data.records || []).map((item: any) => ({
    record_id: item.record_id,
    id: item.fields.id,
    eventId: item.fields.eventId,
    name: item.fields.name,
    email: item.fields.email,
    company: item.fields.company,
    qrToken: item.fields.qrToken,
    checkedIn: false,
    createdAt: item.fields.createdAt,
  }))
}

export async function getParticipantById(participantId: string): Promise<LarkParticipant | null> {
  const participants = await getParticipants()
  return participants.find(p => p.id === participantId) || null
}

export async function getParticipantByQrToken(qrToken: string): Promise<LarkParticipant | null> {
  const config = getConfig()

  const data = await larkRequest(
    'GET',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().participants}/records?filter=CurrentValue.[qrToken]="${qrToken}"`
  )

  if (!data.items || data.items.length === 0) {
    return null
  }

  const item = data.items[0]
  return {
    record_id: item.record_id,
    id: item.fields.id || item.record_id,
    eventId: item.fields.eventId || '',
    name: item.fields.name || '',
    email: item.fields.email || '',
    company: item.fields.company || '',
    qrToken: item.fields.qrToken || '',
    checkedIn: item.fields.checkedIn === true || item.fields.checkedIn === 'true',
    checkedInAt: item.fields.checkedInAt || undefined,
    createdAt: item.fields.createdAt || '',
  }
}

export async function updateParticipantCheckIn(
  recordId: string,
  checkedIn: boolean
): Promise<void> {
  const config = getConfig()

  await larkRequest(
    'PUT',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().participants}/records/${recordId}`,
    {
      fields: {
        checkedIn,
        checkedInAt: checkedIn ? new Date().toISOString() : null,
      },
    }
  )
}

// ============ Check-in Logs API ============

export interface LarkCheckInLog {
  record_id?: string
  id: string
  participantId: string
  checkedInAt: string
  deviceInfo?: string
}

export async function createCheckInLog(log: {
  participantId: string
  deviceInfo?: string
}): Promise<LarkCheckInLog> {
  const config = getConfig()
  const id = crypto.randomUUID()

  const data = await larkRequest(
    'POST',
    `/bitable/v1/apps/${config.baseId}/tables/${getTableIds().checkInLogs}/records`,
    {
      fields: {
        id,
        participantId: log.participantId,
        checkedInAt: new Date().toISOString(),
        deviceInfo: log.deviceInfo || '',
      },
    }
  )

  return {
    record_id: data.record.record_id,
    id,
    participantId: log.participantId,
    checkedInAt: new Date().toISOString(),
    deviceInfo: log.deviceInfo,
  }
}

// ============ Stats ============

export async function getEventStats(eventId: string): Promise<{
  totalParticipants: number
  checkedInCount: number
}> {
  const participants = await getParticipants(eventId)

  return {
    totalParticipants: participants.length,
    checkedInCount: participants.filter(p => p.checkedIn).length,
  }
}
