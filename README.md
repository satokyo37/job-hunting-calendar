# Job Hunting Calendar

就職活動でのスケジュール管理を支援する Expo (React Native) アプリです。応募企業ごとに進捗やタスク、メモを保存し、端末ローカルに永続化された一覧をすばやく参照できます。

## 主な機能

- 企業ごとの進捗ステータスとタスクの管理
- タスクの期限・完了状態の保存
- メモの記録と編集
- AsyncStorage を利用した端末ローカルでの永続化（オフライン対応）

## 技術スタック

- Expo SDK 54 (54.0.12) / React Native 0.81
- React 19 / Expo Router 6.0.10 によるファイルベースルーティング
- Zustand + AsyncStorage による状態・永続化管理
- Zod による入力バリデーション
- TypeScript 5.9 / ESLint (eslint-config-expo)

## 開発環境の準備

1. 必要ツール
   - Node.js 18 以上（LTS 推奨）
   - npm（または互換パッケージマネージャー）
2. 依存関係のインストール

   ```bash
   npm install
   ```

3. 開発サーバーの起動

   ```bash
   npx expo start
   ```

   ブラウザに表示される開発者ツールから、デバイス・エミュレーター・Expo Go アプリで実行できます。

## よく使うスクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run start` | Expo 開発サーバーを起動します。 |
| `npm run android` / `npm run ios` / `npm run web` | 各プラットフォーム向けに Expo を起動します。 |
| `npm run lint` | ESLint によるコードチェックを実行します。 |
| `npm run reset-project` | テンプレートのサンプルコードを `app-example/` に移動し、空の `app/` ディレクトリを再生成します。 |

## データ構造と保存先

- `schema/` : 企業・タスク入力を検証する Zod スキーマを定義しています。
- `store/useAppStore.ts` : Zustand ストア。`AsyncStorage` に `job-hunting-calendar` キーで永続化しています。
- 企業 (`Company`) ごとに ID・名称・進捗ステータス・タスク配列・備考を保持します。タスクには ULID で採番された ID、タイトル、期日、完了状態が含まれます。

## プロジェクト構成のヒント

- `app/(tabs)/` : Expo Router のタブレイアウトと各画面。
- `components/` : 再利用コンポーネント群（Themed コンポーネント、ParallaxScrollView など）。
- `hooks/` : `useColorScheme` などのカスタムフック。
- `types/` : 型定義の共有。

## 品質チェック

- 依存関係の整合性確認: `npx expo-doctor`
- Expo 管理パッケージの更新確認: `npx expo install --check`
- ネイティブビルド前は `npx expo run:android` / `npx expo run:ios` で動作確認することを推奨します。
