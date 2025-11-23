'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EmailSettings {
  subject: string
  greeting: string
  mainMessage: string
  instructions: string[]
  footer: string
}

const defaultSettings: EmailSettings = {
  subject: '{{eventName}} - チェックイン用QRコード',
  greeting: 'ご参加いただきありがとうございます！',
  mainMessage: '当日は下記のQRコードを受付でご提示ください。',
  instructions: [
    'このQRコードは参加者様専用です',
    '当日受付でスキャンするまで大切に保管してください',
    '印刷またはスマートフォンの画面で表示してください'
  ],
  footer: '皆様のご来場を心よりお待ちしております！'
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    const savedSettings = localStorage.getItem('emailSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  useEffect(() => {
    // プレビュー生成
    generatePreview()
  }, [settings])

  const generatePreview = () => {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">サンプルイベント名</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">2024/12/01 10:00</p>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; color: #333;">${settings.greeting}</p>
          <p style="color: #666;">${settings.mainMessage}</p>

          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <div style="width: 150px; height: 150px; background: #eee; margin: 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #999;">
              [QRコード]
            </div>
            <p style="margin-top: 15px; font-weight: bold;">サンプル 太郎</p>
            <p style="color: #666; font-size: 14px;">sample@example.com</p>
          </div>

          <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1976d2;">
              <a href="#" style="color: #1976d2;">&#128279; オンラインでQRコードを表示</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #666;">
              このリンクを保存しておけば、いつでもQRコードにアクセスできます
            </p>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-weight: bold; color: #333;">注意事項:</p>
            <ul style="color: #666; padding-left: 20px;">
              ${settings.instructions.map(inst => `<li>${inst}</li>`).join('')}
            </ul>
          </div>

          <p style="margin-top: 20px; color: #666; font-style: italic;">${settings.footer}</p>
        </div>
      </div>
    `
    setPreviewHtml(html)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // ローカルストレージに保存
      localStorage.setItem('emailSettings', JSON.stringify(settings))

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('設定の保存に失敗しました:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...settings.instructions]
    newInstructions[index] = value
    setSettings({ ...settings, instructions: newInstructions })
  }

  const addInstruction = () => {
    setSettings({
      ...settings,
      instructions: [...settings.instructions, '']
    })
  }

  const removeInstruction = (index: number) => {
    const newInstructions = settings.instructions.filter((_, i) => i !== index)
    setSettings({ ...settings, instructions: newInstructions })
  }

  const resetToDefault = () => {
    if (confirm('設定を初期状態に戻しますか？')) {
      setSettings(defaultSettings)
      localStorage.removeItem('emailSettings')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
            &larr; 管理画面に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">メール設定</h1>
          <p className="text-gray-600 mt-2">QRコード送信メールのテンプレートをカスタマイズできます</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 設定フォーム */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">テンプレート設定</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  メール件名
                </label>
                <input
                  type="text"
                  value={settings.subject}
                  onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="例: {{eventName}} - チェックイン用QRコード"
                />
                <p className="text-sm text-gray-500 mt-1">
                  &#9432; 変数: {'{{eventName}}'} はイベント名に置き換わります
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  挨拶文
                </label>
                <input
                  type="text"
                  value={settings.greeting}
                  onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="例: ご参加いただきありがとうございます！"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  本文メッセージ
                </label>
                <textarea
                  value={settings.mainMessage}
                  onChange={(e) => setSettings({ ...settings, mainMessage: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 resize-none"
                  placeholder="例: 当日は下記のQRコードを受付でご提示ください。"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  注意事項（リスト形式）
                </label>
                {settings.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <span className="flex items-center justify-center w-8 h-12 text-gray-500 font-medium">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                      placeholder="注意事項を入力..."
                    />
                    <button
                      onClick={() => removeInstruction(index)}
                      className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-300 transition-colors"
                      title="削除"
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
                <button
                  onClick={addInstruction}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  &#43; 注意事項を追加
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  フッターメッセージ
                </label>
                <input
                  type="text"
                  value={settings.footer}
                  onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                  placeholder="例: 皆様のご来場を心よりお待ちしております！"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  {saving ? '保存中...' : '&#10003; 設定を保存'}
                </button>
                <button
                  onClick={resetToDefault}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  初期状態に戻す
                </button>
                {saved && (
                  <span className="text-green-600 flex items-center font-medium">
                    &#10003; 保存しました！
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">メールプレビュー</h2>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">件名:</span> {settings.subject.replace('{{eventName}}', 'サンプルイベント名')}
                </p>
              </div>
              <div
                className="p-4 bg-white overflow-auto max-h-[600px]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              &#9432; 実際のメールには参加者情報とQRコードが表示されます
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
