# agents-OpenClaw

OpenClaw を業務支援用に使うためのワークスペースです。  
Gmail、Google Calendar、Google Tasks、公開情報、案件メモ、Obsidian ノートをまとめて扱います。

## できること

- Gmail の要点を `data/gmail/` に保存
- Google Calendar の予定を `data/calendar/` に保存
- 予定に関連する案件や公開情報をもとに `reports/` へ準備ブリーフを生成
- Google Tasks の期限チェックと Telegram 通知
- Gmail から経費系メールを拾って `data/expenses/` に追記
- 相談内容から案件メモを `data/cases/` に保存
- 気仙沼市議会の公開情報を `data/public/kesennuma/` に保存
- Obsidian ノートと `MEMORY.md` を OpenClaw の参照コンテキストとして利用

## Lightsail Quick Start

AWS Lightsail の Linux で動かす場合は、まずこの手順だけ見れば動かせます。

### 1. サーバー準備

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip
```

### 2. GitHub から取得

```bash
cd /opt
sudo git clone <YOUR_GITHUB_REPO_URL> agents-OpenClaw
sudo chown -R $USER:$USER /opt/agents-OpenClaw
cd /opt/agents-OpenClaw
```

### 3. Python 環境作成

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. `.env` を作成

```bash
cp .env.example .env
```

最低限、以下を `.env` に設定します。

- `OPENCLAW_DATA_ROOT=/opt/agents-OpenClaw`
- `BRIEF_WINDOW_HOURS=24`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REFRESH_TOKEN=...`
- `GMAIL_CLIENT_ID=...`
- `GMAIL_CLIENT_SECRET=...`
- `GMAIL_REFRESH_TOKEN=...`

Telegram 通知を使う場合だけ以下も設定します。

- `TELEGRAM_BOT_TOKEN=...`
- `TELEGRAM_CHAT_ID=...`

### 5. 一発実行

定期実行系はこれ一つでまとめて動きます。

```bash
cd /opt/agents-OpenClaw
source .venv/bin/activate
python scripts/run_all.py
```

実行対象:

- `scripts/public_info_sync.py`
- `scripts/public_info_linker.py`
- `scripts/public_case_export.py`
- `scripts/calendar_sync.py`
- `scripts/email_manager.py`
- `scripts/expense_append.py`
- `scripts/task_reminder.py`

どれか1つ失敗した時点で止めたい場合だけ `--fail-fast` を付けます。

```bash
python scripts/run_all.py --fail-fast
```

### 6. cron で定期実行

```bash
crontab -e
```

例:

```cron
15 * * * * cd /opt/agents-OpenClaw && . .venv/bin/activate && python scripts/run_all.py >> /var/log/openclaw-run-all.log 2>&1
```

### 7. 手動確認

```bash
python scripts/public_info_sync.py
python scripts/case_ingest.py --title "通学路安全" --summary "横断歩道付近の見通しが悪い" --location "鹿折地区"
python scripts/case_search.py --query "通学路 横断歩道" --location "鹿折地区"
```

詳しい Linux 手順は [SETUP_LIGHTSAIL.md](./SETUP_LIGHTSAIL.md) も参照してください。

## ディレクトリ構成

```text
agents-OpenClaw/
├─ MEMORY.md
├─ README.md
├─ SETUP.md
├─ SETUP_LIGHTSAIL.md
├─ requirements.txt
├─ .env.example
├─ scripts/
├─ data/
├─ obsidian/
└─ reports/
```

主な出力先:

- Gmail: `data/gmail/YYYY-MM-DD.md`
- Calendar: `data/calendar/today.md`, `data/calendar/today.json`
- Tasks: `data/tasks/today.md`
- Expenses: `data/expenses/YYYY-MM.md`
- Cases: `data/cases/*.md`, `data/cases/*.json`
- Public info: `data/public/kesennuma/latest.md`, `data/public/kesennuma/latest.json`
- Briefs: `reports/briefs/`, `reports/meeting-prep/`

## 個別コマンド

```bash
python scripts/email_manager.py
python scripts/calendar_sync.py
python scripts/task_reminder.py
python scripts/expense_append.py
python scripts/public_info_sync.py
python scripts/public_info_linker.py
python scripts/public_case_export.py
python scripts/case_ingest.py --title "通学路安全" --summary "横断歩道付近の見通しが悪い" --location "鹿折地区"
python scripts/case_search.py --query "通学路 横断歩道" --location "鹿折地区"
```

## 環境変数

Google Calendar / Tasks:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

Gmail:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

Telegram:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

その他:

- `OPENCLAW_DATA_ROOT`
- `BRIEF_WINDOW_HOURS`

`.env` をリポジトリ直下に置くと、主要スクリプトが自動で読み込みます。

## Obsidian と OpenClaw の使い分け

- `obsidian/` は人が育てる知識ベース
- `data/` はスクリプトが生成する構造化データ
- `reports/` は面会前確認などの派生アウトプット
- `MEMORY.md` は OpenClaw に短期コンテキストを渡すためのメモ

## 補足

- `.env` は GitHub に push しない
- Linux では `python scripts/run_all.py` を定期実行の入口にするのがおすすめ
- GitHub Actions 用の既存 workflow は残していますが、Lightsail 運用なら cron の方がシンプルです
