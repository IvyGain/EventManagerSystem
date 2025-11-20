# イベントチェックインシステム

QRコードを使用したイベント参加者の簡単チェックインシステム。メールアドレスごとにQRコードを発行し、スキャンすることでチェックインステータスをリアルタイムで更新します。

## 主な機能

- ✅ **イベント管理**: 複数イベントの作成・管理
- 👥 **参加者登録**: 名前、メール、会社名で参加者を登録
- 🔲 **QRコード生成**: 各参加者に一意のQRコードを自動生成
- 📱 **QRスキャナー**: スマートフォンカメラでQRコードをスキャン
- ⚡ **リアルタイムチェックイン**: 即座にステータスを更新
- 📊 **ダッシュボード**: チェックイン状況をリアルタイム表示
- 🔒 **重複防止**: 同じ参加者の重複チェックインを防止

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (SQLite)
- **TailwindCSS**
- **QRCode** (生成)
- **html5-qrcode** (スキャナー)

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# Prismaクライアントの生成
npx prisma generate

# データベースのマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

アプリケーションが http://localhost:3000 で起動します。

## 使い方

### 1. イベント作成

1. http://localhost:3000/admin にアクセス
2. 「新規イベント」をクリック
3. イベント名、日時、場所を入力

### 2. 参加者登録

1. 管理画面でイベントを選択
2. 「参加者追加」をクリック
3. 名前、メールアドレス、会社名を入力

### 3. QRコード発行

1. 参加者リストで「QR表示」をクリック
2. QRコードが新しいウィンドウで表示されます
3. 印刷またはメール送信

### 4. チェックイン

1. http://localhost:3000/checkin にアクセス
2. 「スキャン開始」をクリック
3. 参加者のQRコードをスキャン
4. チェックイン完了！

## API エンドポイント

### イベント

- `GET /api/events` - イベント一覧取得
- `POST /api/events` - イベント作成

### 参加者

- `GET /api/participants?eventId=xxx` - 参加者一覧取得
- `POST /api/participants` - 参加者作成

### QRコード

- `GET /api/qr?participantId=xxx` - QRコード生成
- `POST /api/qr/bulk` - 一括QRコード生成

### チェックイン

- `POST /api/checkin` - チェックイン実行
- `GET /api/checkin/stats?eventId=xxx` - 統計情報取得

## データベース構造

```prisma
model Event {
  id           String        @id @default(uuid())
  name         String
  date         DateTime
  location     String
  participants Participant[]
}

model Participant {
  id          String   @id @default(uuid())
  eventId     String
  name        String
  email       String
  company     String?
  qrToken     String   @unique
  checkedIn   Boolean  @default(false)
  checkedInAt DateTime?
}

model CheckInLog {
  id            String   @id @default(uuid())
  participantId String
  checkedInAt   DateTime @default(now())
  deviceInfo    String?
}
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Prisma Studio (DBビューア)
npx prisma studio

# データベースリセット
npx prisma migrate reset
```

## デプロイ

### Vercel

1. GitHubリポジトリをプッシュ
2. Vercelで新規プロジェクト作成
3. リポジトリを選択
4. 環境変数を設定:
   - `DATABASE_URL`: PostgreSQL接続URL
5. デプロイ

### 環境変数

```env
# .env
DATABASE_URL="file:./dev.db"  # 開発環境
# DATABASE_URL="postgresql://..."  # 本番環境

NEXT_PUBLIC_APP_URL="http://localhost:3000"  # アプリURL
```

## セキュリティ

- QRトークンはSHA256でハッシュ化
- 重複チェックインを防止
- HTTPS推奨（本番環境）
- 管理画面は認証追加を推奨

## ライセンス

MIT

## 作成者

Claude Code + Human Collaboration

---

**注意**: このアプリケーションはMVPです。本番環境で使用する場合は、認証機能の追加、エラーハンドリングの強化、セキュリティ監査を推奨します。
