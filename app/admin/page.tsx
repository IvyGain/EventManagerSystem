'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CSVImport from '@/components/CSVImport'

interface Event {
  id: string
  name: string
  date: string
  location: string
  totalParticipants: number
  checkedInCount: number
}

interface Participant {
  id: string
  name: string
  email: string
  company?: string
  checkedIn: boolean
  checkedInAt?: string
  qrToken: string
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [showNewEventForm, setShowNewEventForm] = useState(false)
  const [showNewParticipantForm, setShowNewParticipantForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [loading, setLoading] = useState(false)

  // New event form state
  const [newEvent, setNewEvent] = useState({ name: '', date: '', location: '' })

  // New participant form state
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    company: '',
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchParticipants(selectedEventId)
    }
  }, [selectedEventId])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data)
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchParticipants = async (eventId: string) => {
    try {
      const response = await fetch(`/api/participants?eventId=${eventId}`)
      const data = await response.json()
      setParticipants(data)
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
      if (response.ok) {
        setShowNewEventForm(false)
        setNewEvent({ name: '', date: '', location: '' })
        fetchEvents()
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId) return
    setLoading(true)
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newParticipant,
          eventId: selectedEventId,
        }),
      })
      if (response.ok) {
        setShowNewParticipantForm(false)
        setNewParticipant({ name: '', email: '', company: '' })
        fetchParticipants(selectedEventId)
      }
    } catch (error) {
      console.error('Error creating participant:', error)
    } finally {
      setLoading(false)
    }
  }

  const showQRCode = async (participantId: string) => {
    try {
      const response = await fetch(`/api/qr?participantId=${participantId}`)
      const data = await response.json()

      // Open QR code in new window
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(`
          <html>
            <head><title>QR Code - ${data.participant.name}</title></head>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
              <h2>${data.participant.name}</h2>
              <p>${data.participant.email}</p>
              <img src="${data.qrCode}" alt="QR Code" style="max-width:400px;"/>
              <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;font-size:16px;cursor:pointer;">印刷</button>
            </body>
          </html>
        `)
      }
    } catch (error) {
      console.error('Error showing QR code:', error)
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            管理画面
          </h1>
        </div>

        {/* Events Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              イベント
            </h2>
            <button
              onClick={() => setShowNewEventForm(!showNewEventForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showNewEventForm ? 'キャンセル' : '新規イベント'}
            </button>
          </div>

          {showNewEventForm && (
            <form onSubmit={handleCreateEvent} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="イベント名"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  required
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="場所"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  required
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                作成
              </button>
            </form>
          )}

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white mb-4"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} - {new Date(event.date).toLocaleDateString('ja-JP')} ({event.checkedInCount}/{event.totalParticipants})
              </option>
            ))}
          </select>

          {selectedEvent && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                  {selectedEvent.totalParticipants}
                </div>
                <div className="text-gray-600 dark:text-gray-300">総参加者</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {selectedEvent.checkedInCount}
                </div>
                <div className="text-gray-600 dark:text-gray-300">チェックイン済み</div>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {Math.round((selectedEvent.checkedInCount / (selectedEvent.totalParticipants || 1)) * 100)}%
                </div>
                <div className="text-gray-600 dark:text-gray-300">チェックイン率</div>
              </div>
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              参加者リスト
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCSVImport(!showCSVImport)
                  setShowNewParticipantForm(false)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!selectedEventId}
              >
                {showCSVImport ? 'キャンセル' : 'CSVインポート'}
              </button>
              <button
                onClick={() => {
                  setShowNewParticipantForm(!showNewParticipantForm)
                  setShowCSVImport(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!selectedEventId}
              >
                {showNewParticipantForm ? 'キャンセル' : '参加者追加'}
              </button>
            </div>
          </div>

          {showCSVImport && selectedEventId && (
            <div className="mb-6">
              <CSVImport
                eventId={selectedEventId}
                onImportComplete={() => {
                  fetchParticipants(selectedEventId)
                  setShowCSVImport(false)
                }}
              />
            </div>
          )}

          {showNewParticipantForm && (
            <form onSubmit={handleCreateParticipant} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="名前"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  required
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  required
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="会社名（任意）"
                  value={newParticipant.company}
                  onChange={(e) => setNewParticipant({ ...newParticipant, company: e.target.value })}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                追加
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3">名前</th>
                  <th className="text-left p-3">メール</th>
                  <th className="text-left p-3">会社</th>
                  <th className="text-center p-3">ステータス</th>
                  <th className="text-center p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-gray-900 dark:text-white">{participant.name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{participant.email}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{participant.company || '-'}</td>
                    <td className="p-3 text-center">
                      {participant.checkedIn ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          ✓ チェックイン済み
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          未チェックイン
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => showQRCode(participant.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        QR表示
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {participants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                参加者がいません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
