# OpenClaw on AWS Lightsail

AWS Lightsail の Linux 上で、OpenClaw を `政治家秘書` として動かすための最短手順です。

この構成で動かすものは 2 つです。

- 定期実行: `python scripts/run_all.py`
- Telegram 常駐 bot: `python scripts/telegram_bot.py --loop`

`run_all.py` は情報収集とブリーフ生成を担当し、
`telegram_bot.py` は Tomoさんが Telegram で `/today` や `/search` を使うための入口です。

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

Telegram を使う場合は以下も設定します。

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## 5. Google 側の事前準備

Google Cloud Console で以下を有効化します。

- Gmail API
- Google Calendar API
- Google Tasks API

その後、OAuth クライアントを作り、refresh token を取得して `.env` に入れます。

## 6. Telegram Bot を作る

1. Telegram アプリを開く
2. `@BotFather` を検索
3. `/newbot` で Bot を作成
4. 発行された token を `.env` の `TELEGRAM_BOT_TOKEN` に入れる
5. 作成した bot に自分で 1 通メッセージを送る
6. `https://api.telegram.org/bot<token>/getUpdates` を開き、`chat.id` を確認する
7. その値を `.env` の `TELEGRAM_CHAT_ID` に入れる

## 7. RSS source を確認する

RSS の取得先は `config/rss_sources.json` で管理します。

最初はこのままで動きます。
後で増やしたい場合は、同じ形式で source を追加してください。

## 8. 初回動作確認

```bash
cd /opt/agents-OpenClaw
source .venv/bin/activate
python scripts/run_all.py --fail-fast
```

これで次がまとめて動きます。

- `scripts/public_info_sync.py`
- `scripts/public_info_linker.py`
- `scripts/public_case_export.py`
- `scripts/calendar_sync.py`
- `scripts/email_manager.py`
- `scripts/expense_append.py`
- `scripts/task_reminder.py`
- `scripts/citizen_digest.py`
- `scripts/morning_brief.py`

## 9. Telegram bot の確認

別ターミナルで起動します。

```bash
cd /opt/agents-OpenClaw
source .venv/bin/activate
python scripts/telegram_bot.py --loop
```

その後 Telegram で次を試します。

- `/tutorial`
- `/help`
- `/today`
- `/profile`

案件が入っている場合は次も使えます。

- `/search 通学路`
- `/public 子育て`
- `/rss 福祉`
- `/draft 子育て`

自然文でもある程度使えます。

- `今日は何がある？`
- `通学路の相談ある？`
- `子育て案件を上に出して`
- `子育ての記事の下書きを作って`

## 10. cron で定期実行

```bash
crontab -e
```

例:

```cron
15 * * * * cd /opt/agents-OpenClaw && . .venv/bin/activate && python scripts/run_all.py >> /var/log/openclaw-run-all.log 2>&1
```

## 11. Telegram bot の常駐

最低限の簡易運用なら `tmux` や `screen` で十分です。
本番では `systemd` 化するのがおすすめです。

簡易起動例:

```bash
cd /opt/agents-OpenClaw
source .venv/bin/activate
python scripts/telegram_bot.py --loop
```

このプロセスが止まると、Telegram コマンドは受けられません。

## 12. 主な出力先

- `data/public/kesennuma/latest.json`
- `data/cases/*.json`
- `data/cases_public/latest.json`
- `data/calendar/today.md`
- `data/calendar/today.json`
- `data/gmail/YYYY-MM-DD.md`
- `data/tasks/today.md`
- `reports/briefs/`
- `reports/daily-briefing/`
- `reports/activity-drafts/`
- `data/telegram/tomo_profile.json`

## 13. Tomoさんの使い方

Tomoさん本人は、基本的にサーバーに入る必要はありません。

使い方は次のイメージです。

### 朝

- Telegram に届く `おはようブリーフ` を見る

### 面会や会議の前

- Telegram に届く `3分ブリーフ` を見る

### 必要なとき

- `/today` で今日の要点を見る
- `/search 通学路` で類似相談を見る
- `/case case_xxx` で案件を見る
- `/done case_xxx` で一次対応済みにする
- `/feedback 子育て案件を上に出してほしい` で秘書の出し方を育てる
- `/draft 子育て` で Note / Instagram の叩き台を作る

つまり、Tomoさんの操作は `Telegram 中心` です。
技術的な保守は別の人が担当する前提の方が運用しやすいです。

## 14. つまずきやすい点

- `.env` の認証情報不足
- Telegram bot は作っただけでは使えず、自分から 1 回メッセージを送る必要がある
- `telegram_bot.py --loop` を常駐させないと Telegram コマンドは反応しない
- 市民向けフロントから案件が流れてこないと `citizen_digest.py` は空になる

## 15. 補足

- `.env` は GitHub に push しない
- `data/` と `reports/` はこのリポジトリ配下に生成される
- Lightsail 運用では `run_all.py + telegram_bot.py` の 2 本を動かすのが基本です
