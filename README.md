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
  company/[id].tsx      # 企業詳細（動的ルート）
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

## コーディング規約

- 言語は TypeScript を使用
- Lint は ESLint（`eslint-config-expo`）を使用し、`pnpm lint` で確認
- 共通のコンポーネント/フックは `components/` と `hooks/` に格納し、各機能専用のモーダルは `app/features/` 配下に配置
- ルーティングは Expo Router の規約に従い `app/` 以下で定義

## トラブルシューティング

- 起動不可/挙動不安定
  - `npx expo start -c` で Metro キャッシュをクリア
  - `rm -rf node_modules && pnpm install`（Windows はエクスプローラーで削除）
  - Android Studio / Xcode のエミュレータを再起動
- ポート競合
  - 既存の開発サーバを終了し、`pnpm start` を再実行
- iOS でビルド不可
  - Xcode のバージョンと iOS シミュレータの組み合わせを確認

## UI 改善のメモ

- 2025-11-18: ホーム画面とタスク/企業タブのヘッダー高さを統一し、タスクタブのヘッダーアイコン背景色も企業タブと同一トーンに合わせました。予定・タスクが無いときのホーム空状態に「カレンダーを見る」導線を追加し、タスク一覧導線と同じボタンスタイルを縦並び・ゆったりした余白＆ボタン幅で配置して即時遷移しやすくしました。カレンダータブの予定チップはタイトルのみ表示に簡素化し、日付セルの枠が縦に伸びない設計にしています。編集系モーダルは専用コンポーネントへ分離し、画面ごとのスタイルファイルに集約したことで保守性も向上しました。
- 2025-11-13: 企業追加と企業詳細の編集モードで「内容」入力欄を複数行レイアウトに変更し、長文メモを入力しやすくしました。
- 2025-11-13: スケジュールピッカーの「カレンダー/時間」と「選択:」プレビューの間隔を調整し、モーダル内で視線移動しやすくしました。
- 2025-11-13: 上記に加えてステージ内の余白を最小化し、カレンダー/時間と「選択:」テキストをほぼ隣接させました。
- 2025-11-13: スケジュールピッカーのモーダル幅とカレンダー幅を固定化し、余白分は上下に確保して引き延ばさないようにしました。
