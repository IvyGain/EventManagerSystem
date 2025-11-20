import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            イベントチェックインシステム
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            QRコードで簡単チェックイン。リアルタイムで参加状況を管理できます。
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link
              href="/checkin"
              className="block p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                チェックイン
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                QRコードをスキャンして参加者チェックイン
              </p>
            </Link>

            <Link
              href="/admin"
              className="block p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                管理画面
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                参加者管理とQRコード発行
              </p>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              主な機能
            </h3>
            <ul className="space-y-3 text-left max-w-2xl mx-auto">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  参加者登録・管理
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  QRコード自動生成
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  リアルタイムチェックイン
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <span className="text-gray-700 dark:text-gray-300">
                  参加状況ダッシュボード
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
