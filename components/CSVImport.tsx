'use client'

import { useState } from 'react'
import Papa from 'papaparse'

interface CSVImportProps {
  eventId: string
  onImportComplete: () => void
}

interface ImportResult {
  summary: {
    total: number
    success: number
    errors: number
    duplicates: number
  }
  details: {
    success: string[]
    errors: Array<{ row: number; email: string; error: string }>
    duplicates: string[]
  }
}

export default function CSVImport({ eventId, onImportComplete }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResult(null)
    } else {
      alert('CSVファイルを選択してください')
    }
  }

  const handleImport = async () => {
    if (!file) {
      alert('ファイルを選択してください')
      return
    }

    setLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/participants/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId,
              participants: results.data,
            }),
          })

          const data = await response.json()

          if (response.ok) {
            setResult(data)
            onImportComplete()
          } else {
            alert(`インポートエラー: ${data.error}`)
          }
        } catch (error) {
          console.error('Import error:', error)
          alert('インポート中にエラーが発生しました')
        } finally {
          setLoading(false)
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error)
        alert('CSVファイルの解析に失敗しました')
        setLoading(false)
      },
    })
  }

  const downloadSampleCSV = () => {
    const sample = `name,email,company
山田太郎,yamada@example.com,株式会社サンプル
佐藤花子,sato@example.com,テスト株式会社
鈴木一郎,suzuki@example.com,`

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample_participants.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        CSV一括インポート
      </h3>

      <div className="mb-4">
        <button
          onClick={downloadSampleCSV}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          サンプルCSVをダウンロード
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          必須項目: name, email / 任意項目: company
        </p>
      </div>

      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 dark:text-gray-300
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-lg file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100
                   dark:file:bg-blue-900 dark:file:text-blue-300"
        />
      </div>

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'インポート中...' : 'インポート実行'}
      </button>

      {result && (
        <div className="mt-6">
          <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
            インポート結果
          </h4>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {result.summary.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">総数</div>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {result.summary.success}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">成功</div>
            </div>
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {result.summary.duplicates}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">重複</div>
            </div>
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {result.summary.errors}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">エラー</div>
            </div>
          </div>

          {result.details.errors.length > 0 && (
            <div className="mb-4">
              <h5 className="font-bold text-red-700 dark:text-red-300 mb-2">
                エラー詳細:
              </h5>
              <div className="max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900 p-3 rounded">
                {result.details.errors.map((err, idx) => (
                  <div key={idx} className="text-sm text-red-700 dark:text-red-300 mb-1">
                    行{err.row}: {err.email} - {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.details.duplicates.length > 0 && (
            <div>
              <h5 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                重複（スキップ）:
              </h5>
              <div className="max-h-40 overflow-y-auto bg-yellow-50 dark:bg-yellow-900 p-3 rounded">
                {result.details.duplicates.map((email, idx) => (
                  <div key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
