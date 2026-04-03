# Frontend 開発計画（4時間ブループリント 参考）

## 目的
- 1回の会話につき必ず1つの成果物（行政メモ等）を出力するシステムを完成させる
- フロントエンドとバックエンドを明確に分離し、UIは `frontend/`、生成ロジックは `backend/` に格納する

## 画面構成
1. トップページ
   - ダッシュボード（進行中/完了のセッション一覧）
   - 新規会話開始ボタン
   - 過去データベース連携（検索/絞り込み）

2. 会話ページ
   - チャットUI（ユーザー＆AIの会話）
   - 音声入力/テキスト入力
   - 多言語対応スイッチ（日本語/英語など）
   - 会話履歴のリアルタイム保存＋AI自動分類

3. 生成された案件ページ
   - 会話履歴と認識結果の一覧表示
   - 成果物（行政メモ等）プレビュー
   - ダウンロード（PDF/テキスト）
   - 外部システムAPI連携ボタン（例：Slack, Notion, Google Drive）

## フロントエンド要件
- 技術スタック
  - Nextjs （既存に合わせる）
  - 状態管理：Redux/Pinia/Zustand
  - CSS：TailwindCSS / BEM / CSS Modules
- コンポーネント
  - `TopPage`, `ConversationPage`, `CasePage`, `Header`, `Footer`, `Toast` 等
- ルーティング
  - `/` -> TopPage
  - `/conversation/:id` -> ConversationPage
  - `/case/:id` -> CasePage

## バックエンド連携
- REST API
  - `POST /api/conversations`：会話セッション作成
  - `GET /api/conversations/:id`：会話取得
  - `POST /api/conversations/:id/messages`：メッセージ送信
  - `POST /api/conversations/:id/generate`：成果物生成
  - `GET /api/cases/:id`：成果物取得
- 音声認識（if）
  - `POST /api/speech-to-text`（アップロード or WebRTC）

## 4時間ブループリントの主な機能（優先順）
1. 会話セッションの生成と保存（DB）
2. チャットUI + メッセージ送受信
3. 成果物（メモ）生成エンドポイント連携
4. 完成した案件の一覧表示・ダウンロード
5. 外部API連携 / セキュリティ監査対応

## 開発タスク（最初の 4h）
- [x] フォルダ構成および基本ページレイアウトを作成
- [x] モックデータで会話フローを実装
- [ ] バックエンドと疎通確認（Hello API）
- [ ] 成果物生成API連携（モックでもOK）
- [x] 画面遷移とURLパラメータを確認
- [x] ドキュメント化（この `frontend/Plan.md`）

## 管理
- 進捗は `frontend/README.md` に反映
- 重要：1回の会話で最低1つの成果物を出すことを常にチェック

---

> 参照図: トップページ → 会話ページ → 生成案件ページ -> 成果物出力
> - 過去DB連携
> - AI 自動分類
> - 多言語対応
> - セキュリティ監査
> - 外部API 連携
