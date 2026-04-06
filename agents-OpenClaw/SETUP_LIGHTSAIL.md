# OpenClaw on AWS Lightsail

AWS Lightsail の Linux 上で、このリポジトリを GitHub から入れて動かすための最短手順です。

## 1. サーバー準備

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip
```

## 2. GitHub から取得

```bash
cd /opt
sudo git clone <YOUR_GITHUB_REPO_URL> agents-OpenClaw
sudo chown -R $USER:$USER /opt/agents-OpenClaw
cd /opt/agents-OpenClaw
```

## 3. Python 環境作成

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 4. `.env` を作成

```bash
cp .env.example .env
```

最低限、以下を設定します。

- `OPENCLAW_DATA_ROOT=/opt/agents-OpenClaw`
- `BRIEF_WINDOW_HOURS=24`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

Telegram 通知を使う場合だけ以下も設定します。

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## 5. Google 側の事前準備

Google Cloud Console で以下を有効化します。

- Gmail API
- Google Calendar API
- Google Tasks API

その後、OAuth クライアントを作り、refresh token を取得して `.env` に入れます。

## 6. 一発実行

```bash
cd /opt/agents-OpenClaw
source .venv/bin/activate
python scripts/run_all.py
```

実行対象:

- 公開情報同期
- 公開情報リンク生成
- 公開向け案件一覧出力
- カレンダー同期
- Gmail 同期
- 経費追記
- タスクリマインド

どれか1つ失敗した時点で止めたい場合だけ:

```bash
python scripts/run_all.py --fail-fast
```

## 7. 手動確認

```bash
python scripts/public_info_sync.py
python scripts/case_ingest.py --title "通学路安全" --summary "横断歩道付近の見通しが悪い" --location "鹿折地区"
python scripts/case_search.py --query "通学路 横断歩道" --location "鹿折地区"
```

主な出力先:

- `data/public/kesennuma/latest.json`
- `data/cases/*.json`
- `data/calendar/today.md`
- `data/gmail/YYYY-MM-DD.md`
- `data/tasks/today.md`
- `reports/briefs/`

## 8. cron で定期実行

```bash
crontab -e
```

例:

```cron
15 * * * * cd /opt/agents-OpenClaw && . .venv/bin/activate && python scripts/run_all.py >> /var/log/openclaw-run-all.log 2>&1
```

## 9. 運用メモ

- `.env` は GitHub に push しない
- `data/` と `reports/` はこのリポジトリ配下に生成される
- Lightsail 運用では `python scripts/run_all.py` を cron に載せるのが最もシンプルです
