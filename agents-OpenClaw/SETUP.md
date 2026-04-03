# セットアップ手順書

このファイルを上から順番にやればOKです。
素人でも迷わないように、1ステップずつ書いています。

---

## STEP 1: GitHub にリポジトリを作る

1. https://github.com を開く
2. 右上の「+」→「New repository」をクリック
3. 以下を入力:
   - Repository name: `your-vault`（好きな名前でOK）
   - **Private** を選ぶ（重要！メールなど個人情報が入るので）
   - 「Create repository」をクリック
4. 作成後に表示される URL をメモしておく
   例: `https://github.com/あなたのユーザー名/your-vault`

---

## STEP 2: このフォルダを GitHub に push する

ターミナル（Mac: Terminal.app）を開いて、以下を順番に実行:

```bash
# このフォルダに移動（パスは自分の環境に合わせる）
cd /path/to/your-vault

# Git を初期化
git init

# GitHub と接続（URL は自分のものに変える）
git remote add origin https://github.com/あなたのユーザー名/your-vault.git

# 全ファイルを追加
git add .

# 最初のコミット
git commit -m "Initial vault setup"

# main ブランチにして push
git branch -M main
git push -u origin main
```

→ GitHub を開いてファイルが表示されれば成功！

---

## STEP 3: Google の認証情報を取得する

GitHub Actions が Gmail / Calendar / Tasks にアクセスするための「鍵」を作ります。

### 3-1. Google Cloud Console でプロジェクトを作る

1. https://console.cloud.google.com を開く
2. 上部の「プロジェクトを選択」→「新しいプロジェクト」
3. プロジェクト名: `my-vault-sync`（なんでもOK）

### 3-2. API を有効にする

「APIとサービス」→「ライブラリ」で以下を検索して「有効にする」:
- Gmail API
- Google Calendar API
- Google Tasks API

### 3-3. OAuth 認証情報を作る

1. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
2. アプリケーションの種類: 「デスクトップアプリ」
3. 作成後、**クライアントID** と **クライアントシークレット** をメモ

### 3-4. リフレッシュトークンを取得する（少し手間がかかります）

以下のスクリプトをローカルで1回だけ実行してリフレッシュトークンを取得:

```bash
pip install google-auth-oauthlib

python3 << 'EOF'
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/tasks.readonly",
]

flow = InstalledAppFlow.from_client_secrets_file(
    "client_secret.json",  # ← Google Cloud からダウンロードしたファイル
    scopes=SCOPES,
)
creds = flow.run_local_server(port=0)
print("REFRESH_TOKEN:", creds.refresh_token)
EOF
```

→ ブラウザが開くので Google アカウントでログインして許可する
→ 出力された `REFRESH_TOKEN` をメモ

---

## STEP 4: GitHub Secrets を登録する

取得した認証情報を GitHub に安全に保存します。

1. GitHub の自分のリポジトリを開く
2. 「Settings」→「Secrets and variables」→「Actions」
3. 「New repository secret」で以下を1つずつ登録:

| Secret 名 | 値 |
|-----------|-----|
| `GOOGLE_CLIENT_ID` | 3-3 で取得したクライアントID |
| `GOOGLE_CLIENT_SECRET` | 3-3 で取得したクライアントシークレット |
| `GOOGLE_REFRESH_TOKEN` | 3-4 で取得したリフレッシュトークン |
| `GMAIL_CLIENT_ID` | 同上（Gmail 用）|
| `GMAIL_CLIENT_SECRET` | 同上（Gmail 用）|
| `GMAIL_REFRESH_TOKEN` | 同上（Gmail 用）|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot の Token（次のステップ）|
| `TELEGRAM_CHAT_ID` | 自分の Telegram Chat ID（次のステップ）|

---

## STEP 5: Telegram Bot を作る（タスクリマインダー通知用）

1. Telegram アプリを開く
2. `@BotFather` を検索してメッセージを送る
3. `/newbot` と入力 → 名前をつける
4. 表示された **Bot Token** をメモ（例: `123456:ABCdef...`）
5. 作った Bot に自分でメッセージを送る
6. `https://api.telegram.org/bot<トークン>/getUpdates` をブラウザで開く
7. `"chat":{"id":12345678}` の数字が **Chat ID**

---

## STEP 6: GitHub Actions を手動で動かしてみる

1. GitHub のリポジトリ → 「Actions」タブを開く
2. 左側に「Gmail Sync」「Calendar Sync」などが表示される
3. 「Gmail Sync」をクリック → 「Run workflow」→「Run workflow」
4. 緑のチェックマークが出れば成功！
5. `data/gmail/` フォルダに今日の日付の .md ファイルが作られる

---

## STEP 7: Obsidian で Vault を開く

1. Obsidian をインストール: https://obsidian.md
2. 「Open folder as vault」→ このフォルダ内の `obsidian/` フォルダを選ぶ
3. `03_Projects/`、`10-私の周りの人/` などにノートを書き始める

---

## 完成形のイメージ

GitHub Actions が毎時動いて:
- Gmail → `data/gmail/2026-04-01.md` に保存
- Calendar → `data/calendar/today.md` に保存（2時間以内のMTGは準備レポートも生成）
- Tasks → `data/tasks/today.md` に保存（期限切れは Telegram に通知）
- 経費 → `data/expenses/2026-04.md` に追記

この repo をローカルに持っておけば、AI（OpenClaw / Claude）が全部読めます。

---

## 困ったときは

- GitHub Actions が赤くなる → Actions タブで「失敗したワークフロー」をクリックしてエラーを確認
- Secrets が正しく入っているか確認する
- 不明なエラーはエラーメッセージをそのままここに貼ってください
