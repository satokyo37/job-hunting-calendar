# Job Hunting Calendar

就活スケジュールや応募管理をシンプルに行うカレンダー型アプリ。エントリーや面接などの予定を可視化し、期日を逃さないように一覧・通知・メモ管理を提供する。

本プロジェクトは Expo（React Native）と Expo Router を用いたモバイル／Web 向けアプリ。TypeScript と ESLint による型安全・静的解析を採用。

## 開発環境

- Node.js: 18 以上推奨（LTS）
- パッケージマネージャ: pnpm 推奨（npm も可）
- Expo: `npx expo` でローカル実行（グローバルインストール不要）
- 実行環境: Android は Android Studio（または Expo Go）、iOS は Xcode（または Expo Go、macOS 必要）

## セットアップ

依存関係のインストール。

```bash
# pnpm（推奨）
pnpm install
```

開発サーバの起動。

```bash
pnpm start     # または npm run start
```

## 開発コマンド

`package.json` に定義されている主なスクリプト。

```bash
pnpm start        # 開発サーバ起動
pnpm android      # Android 実機/エミュレータ起動
pnpm ios          # iOS シミュレータ起動（macOS / Xcode 必須）
pnpm web          # Web（ブラウザ）起動
pnpm lint         # ESLint チェック
pnpm run reset-project  # テンプレートへ初期化
```

補足事項。

- キャッシュ無視で起動する場合: `pnpm start -- --clear` または `npx expo start -c`
- 本番ビルド（ストア配布）は EAS の導入を前提とし、当リポジトリには設定を含めない

## ディレクトリ構成

```bash
app/                     # 画面（Expo Router）
  (tabs)/               # タブレイアウト
  (tabs)/companies/    # 企業タブ配下
    [id].tsx          # 企業詳細（動的ルート）
    [id]/edit.tsx     # 企業編集画面
  features/             # 各機能専用のフィーチャUI・モーダル（CompanyCreateModal など）
components/             # 共通UIコンポーネント（PageHeader 等）
styles/                 # 画面ごとのスタイル定義
store/                  # Zustand ストア
schema/                 # スキーマ（zod 等）
hooks/                  # カスタムフック
constants/              # 定数・テーマ
assets/                 # 画像・フォント等
scripts/                # 開発用スクリプト（reset-project など）
app.json                # Expo 設定
tsconfig.json           # TypeScript 設定
eslint.config.js        # ESLint 設定
```
