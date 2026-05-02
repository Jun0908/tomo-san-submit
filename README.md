# 政治家秘書 AI — Tomo-san

**市民の声を覚え、予定と公開情報につなぎ、朝と予定前に準備を渡す政治家秘書。**

> 🇺🇸 English version → [README.en.md](README.en.md)

---

## なぜ作ったか

気仙沼市の市議会議員・ともさんは、日々の市民相談・会議準備・情報収集を1人でこなしている。
専任秘書はいない。相談は増える。議会の公開情報は追いきれない。

このシステムは「秘書」として動く AI である。
ともさんが判断しやすくなるよう、情報を整理して先回りして渡す。
ともさん自身が政治判断を下すことは変わらない。

---

## Tomo-san

<img src="public/fbfbc9a3-afcf-43f3-8a2f-f1a8608cbbcc.png" width="200" alt="Tomo-san" />

## システム構成

```
市民
 │  ブラウザで相談
 ▼
[ フロントエンド / Next.js ]
 ・会話 UI で相談を受け付ける
 ・Tomo-san の返答を talking head 動画として返す（SadTalker + edge-tts）
 ・案件ページで「無視されていない」ことを市民に見せる
 │  会話ログを案件として送る
 ▼
[ AI 秘書バックエンド / OpenClaw ]
 ・相談を自動で案件化する
 ・過去の似た案件を照合する
 ・気仙沼市議会の公開情報・RSS と案件をつなぐ
 ・Google Calendar / Gmail / Tasks と統合する
 ・朝ブリーフと予定前ブリーフを生成する
 │  Telegram に送信
 ▼
[ ともさんの端末 / Telegram Bot ]
 ・毎朝「今日の予定・重要メール・案件サマリー」が届く
 ・会議の 30 分前に「関連案件・公開情報・確認事項 3 点」が届く
 ・/search /case /today コマンドで案件を即検索できる
```

---

## 主な機能

### 市民側

- **会話で相談**: ブラウザから自然言語で相談できる
- **Tomo-san 動画返答**: 1 枚の写真から SadTalker で生成した talking head 動画が返る
- **案件ステータス表示**: 相談が案件化され「受理・対応中」が市民に見える

### ともさん側（Telegram）

- **おはようブリーフ**: 毎朝 1 通。今日の予定・重要メール・期限タスク・新規案件を要約して送る
- **3 分ブリーフ**: 予定前に自動送信。関連する市民相談・公開情報・確認事項 3 点を添えて送る
- **日次市民ダイジェスト**: 今日の相談件数・多いテーマ・緊急度の高い案件を1通にまとめる
- **Telegram コマンド**: `/search 通学路`、`/case <id>`、`/today` で即検索・参照できる
- **公開情報との連携**: 気仙沼市議会・市役所の RSS から関連情報を自動で拾って案件に紐づける
- **SNS・活動報告下書き**: 案件メモと公開情報をもとに Note 記事・Instagram キャプション・カルーセル構成・ハッシュタグをセットで生成する。ボランティアへの引き継ぎメモも同時に出力する

### 学習・最適化

- **Tomo プロファイル**: Telegram 上のフィードバックから、ブリーフの順序・重点・地域の重みを徐々に最適化する

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js (App Router), TypeScript |
| Talking Head 動画 | SadTalker, edge-tts |
| AI 秘書コア | Python, Claude API (OpenClaw) |
| データ連携 | Google Gmail / Calendar / Tasks API |
| 通知・操作 | Telegram Bot API |
| 情報収集 | RSS (気仙沼市議会・市役所) |
| ナレッジベース | Obsidian Markdown |
| 人間確認 | World / Human Badge |
| オンチェーン記録 | NEAR Protocol |

---

## World と NEAR の使われ方

### World — 相談開始時の人間確認

市民が「相談を始める」ボタンを押すと、**World Human Badge** による人間確認が走る。
Bot や自動スクリプトからの偽相談を弾き、1人1案件の信頼性を担保する。

```
市民がボタンをクリック
  → World Human Badge で本人確認（nullifier hash を取得）
  → 確認済みフラグをセッションに保存
  → 会話ページへ遷移
```

| 項目 | 内容 |
|---|---|
| 確認タイミング | 相談セッション作成前（`frontend/app/page.tsx`）|
| APIルート | `frontend/app/api/world/verify/route.ts` |
| クライアント処理 | `frontend/lib/world.ts` |
| 保存先 | セッションの `world.verified` / `world.nullifierHash` |
| UI表示 | 会話ページ・案件ページに「✅ 人間確認済み」バッジ |
| デモモード | `NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY=true` で本物の Badge なしで動作 |

---

### NEAR — 案件化時のレシート記録

市民の相談が OpenClaw によって案件化されると、**案件の公開メタデータのハッシュを NEAR チェーンに記録**する。
生の相談テキストはオンチェーンに載せない。「この案件が確かに受理された」という証跡のみを残す。

```
「公開向け案件ページを作る」をクリック
  → OpenClaw が案件を生成
  → 公開メタデータを SHA-256 ハッシュ化
  → NEAR にレシートを送信（txHash を取得）
  → セッションに near.caseReceiptTxHash を保存
  → 案件ページに「⛓ NEAR receipt」バッジ表示
```

| 項目 | 内容 |
|---|---|
| 記録タイミング | OpenClaw 案件生成の直後（`frontend/lib/server/store.ts`）|
| 送信ロジック | `frontend/lib/server/near.ts` |
| オンチェーンの内容 | sessionId, publicCaseId, title, summaryHash, worldVerified, タイムスタンプ |
| オンチェーンに**載せない**もの | 相談の生テキスト・市民の個人情報 |
| UI表示 | 会話ページ・案件ページに「⛓ NEAR: xxxx...」バッジ |
| デモモード | `ENABLE_DEMO_NEAR_RECEIPT=true` で決定論的なモック txHash を返す |

---

### 環境変数

`frontend/.env.local.example` を参照。デモ動作には以下の 2 行だけでよい：

```bash
NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY=true
ENABLE_DEMO_NEAR_RECEIPT=true
```

本番化する場合は `WORLD_APP_ID` と `NEAR_ACCOUNT_ID` / `NEAR_PRIVATE_KEY` / `NEAR_CONTRACT_ID` を設定する。

---

## リポジトリ構成

```
tomo-san/
├── frontend/          # 市民向け Next.js UI
├── backend/           # SadTalker + edge-tts 動画生成
└── agents-OpenClaw/   # AI 秘書バックエンド
    ├── scripts/       # 21 本の Python スクリプト群
    ├── obsidian/      # 人が読むナレッジベース
    └── data/          # Gmail / Calendar / 案件 / 公開情報
```

---

## 動かし方

### フロントエンド（市民 UI）

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Talking Head 動画生成（Windows）

```powershell
cd backend
.\run_talking_photo.bat --text "ご相談ありがとうございます。"
# → outputs/<日時>/talking-head.mp4
```

### AI 秘書スクリプト

```bash
cd agents-OpenClaw
pip install -r requirements.txt
python scripts/morning_brief.py    # 朝ブリーフを Telegram に送る
python scripts/citizen_digest.py   # 日次サマリーを生成する
python scripts/telegram_bot.py     # Telegram コマンド層を起動する
```

詳細なセットアップ（Google 認証・Telegram 設定）は [agents-OpenClaw/SETUP.md](agents-OpenClaw/SETUP.md) を参照してください。

---

## One-line summary

> 市民の声を覚え、予定と公開情報につなぎ、朝と予定前に準備を渡す政治家秘書。
