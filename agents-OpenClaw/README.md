# agents-OpenClaw

OpenClaw を政治家秘書ユースケース向けに使うための、軽量な業務支援ワークスペースです。
Obsidian ノート、同期済みデータ、案件管理スクリプトをひとつのフォルダにまとめて、日々の相談・予定・公開情報を横断的に参照できるようにしています。

## できること

- Gmail を日次ダイジェストとして `data/gmail/` に保存
- Google Calendar の予定を `data/calendar/` に保存
- 予定に関連する案件・公開情報をもとに準備ブリーフを `reports/` に生成
- Google Tasks の期限を確認し、Telegram に通知
- Gmail から領収書・請求書系メールを拾って `data/expenses/` に追記
- 相談内容から案件メモを `data/cases/` に生成
- 既存案件の類似検索
- 気仙沼市議会 RSS から公開情報を取得し、案件との関連候補を作成
- Obsidian ノートと `MEMORY.md` を AI の参照用コンテキストとして運用

## ディレクトリ概要

```text
agents-OpenClaw/
├─ MEMORY.md
├─ SETUP.md
├─ scripts/
├─ data/
│  ├─ calendar/
│  ├─ cases/
│  ├─ expenses/
│  ├─ gmail/
│  ├─ public/kesennuma/
│  └─ tasks/
├─ obsidian/
│  ├─ 00_MOC/
│  ├─ 03_Projects/
│  ├─ 10-私の周りの人/
│  ├─ 20_地域/
│  ├─ 30_テーマ/
│  └─ 40_公開情報/
└─ reports/
   ├─ briefs/
   ├─ daily-briefing/
   └─ meeting-prep/
```

## 主要ファイル

- `MEMORY.md`
  手動で更新する短期記憶。進行中案件、関係者、運用ルールをまとめます。
- `SETUP.md`
  GitHub、Google OAuth、Telegram の設定手順です。
- `obsidian/00_MOC/OpenClaw_政治家秘書MOC.md`
  Obsidian 上の入口ページです。

## 動かし方

このフォルダを作業ルートとして使います。特に `email_manager.py`、`task_reminder.py`、`expense_append.py` は相対パスで出力するため、`agents-OpenClaw` 直下で実行してください。

```bash
cd agents-OpenClaw
```

Python 3.10 以上を想定しています。最低限、以下のライブラリが必要です。

```bash
pip install google-api-python-client google-auth google-auth-oauthlib python-dateutil requests
```

認証情報の作成は [SETUP.md](./SETUP.md) を参照してください。

## 必要な環境変数

Google Calendar / Tasks:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

Gmail:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

Telegram 通知:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

任意:

- `OPENCLAW_DATA_ROOT`
  出力先ルートを変更したいときに使用
- `BRIEF_WINDOW_HOURS`
  何時間先までの予定に対して準備ブリーフを作るか。既定値は `24`

## 主なコマンド

Gmail ダイジェスト:

```bash
python scripts/email_manager.py
```

カレンダー同期:

```bash
python scripts/calendar_sync.py
```

ローカル JSON を使ったカレンダー確認:

```bash
python scripts/calendar_sync.py --events-file sample-events.json
```

タスク確認と Telegram 通知:

```bash
python scripts/task_reminder.py
```

経費メールの追記:

```bash
python scripts/expense_append.py
```

相談内容から案件を登録:

```bash
python scripts/case_ingest.py --title "鹿折地区の通学路安全" --summary "保護者からの安全対策相談" --location "鹿折地区" --people "佐藤花子,山田太郎" --tags "交通安全,子育て,教育" --open-question "危険箇所の正確な位置" --next-action "学校側の把握状況を確認する"
```

類似案件を検索:

```bash
python scripts/case_search.py --query "通学路の横断歩道が危険" --location "鹿折地区"
```

公開情報を同期:

```bash
python scripts/public_info_sync.py
```

案件と公開情報の関連候補を作成:

```bash
python scripts/public_info_linker.py
```

## どこに出力されるか

- Gmail: `data/gmail/YYYY-MM-DD.md`
- カレンダー: `data/calendar/today.md`, `data/calendar/today.json`
- タスク: `data/tasks/today.md`
- 経費: `data/expenses/YYYY-MM.md`
- 案件: `data/cases/*.md`, `data/cases/*.json`
- 公開情報: `data/public/kesennuma/latest.md`, `latest.json`
- 準備ブリーフ: `reports/briefs/`, `reports/meeting-prep/`

## Obsidian との使い分け

- `obsidian/` は人が読む・育てる知識ベースです
- `data/` はスクリプトが生成する構造化データです
- `reports/` は会議前確認などの派生アウトプットです
- `MEMORY.md` は AI に短期コンテキストを渡すためのメモです

まずは [OpenClaw_政治家秘書MOC.md](./obsidian/00_MOC/OpenClaw_政治家秘書MOC.md) を起点に読むと全体像を追いやすいです。

## 補足

- `SETUP.md` は GitHub Actions での定期実行を前提に書かれています
- 現在のこのフォルダには GitHub Actions の workflow 定義は含まれていません
- そのため、まずは手動実行で確認し、必要なら別途 `.github/workflows/` を追加する運用が自然です
