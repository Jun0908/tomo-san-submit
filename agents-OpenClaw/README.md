# agents-OpenClaw

OpenClaw は、政治家本人の代わりに判断する AI ではなく、
`相談・予定・人間関係・公開情報を案件化し、本人が決めるべきものだけを上げ、残りを進める`
ための秘書OSです。

このリポジトリは、市民向けフロントそのものではなく、
その裏側で動く `秘書レイヤー` を扱います。

今の実装でできること:

- 相談や面会メモを `案件` として保存する
- 案件に `ルート` `リスク` `次の一手` `本人判断要否` を付ける
- `本人判断ボード` を生成する
- `フォローアップキュー` を生成する
- `人 / 団体 / 地域` ごとの関係者メモリを育てる
- 予定前ブリーフと朝ブリーフを生成する
- Telegram から案件検索や判断確認をする

## 先に結論

この README で一番大事なのは次の 3 つです。

1. いきなり `python scripts/run_all.py` から始めない
2. まずは `case_ingest -> judgment_board -> followup_queue -> morning_brief` をローカルで試す
3. Google / Gmail / Telegram 連携は後から足す

`run_all.py` は便利ですが、Google や Gmail の認証が未設定だと分かりにくいです。
最初はローカルだけで動くコマンドから触るのがおすすめです。

## これは何か

OpenClaw の役割は、ざっくり言うと次の流れです。

1. 相談、面会メモ、電話メモ、メール要点を `案件` にする
2. それぞれに `本人判断 / 秘書対応 / 行政確認 / 経過観察` を付ける
3. `危ない案件` と `今日決める案件` を切り出す
4. 面会前に 3 分で読める準備を作る
5. 判断後の残タスクを追い続ける

つまり、受信箱を増やすツールではなく、
`判断箱を作るツール` です。

## まずどう使うか

最初のおすすめルートはこれです。

1. Python 環境を作る
2. サンプル案件を 1 件入れる
3. `本人判断ボード` を見る
4. `フォローアップキュー` を見る
5. `関係者メモリ` を見る
6. `朝ブリーフ` を出す

この 6 ステップだけで、OpenClaw が何をするものかがだいたい分かります。

## ローカル最短セットアップ

### Windows PowerShell

```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

### 最低限の `.env`

ローカルで案件投入や判断ボードだけ試すなら、最低限これだけで十分です。

```env
OPENCLAW_DATA_ROOT=.
BRIEF_WINDOW_HOURS=24
```

まだ不要なもの:

- Google Calendar / Tasks 認証
- Gmail 認証
- Telegram Bot 設定

これらは後から追加で大丈夫です。

## 5分で試す

### 1. 案件を入れる

```bash
python scripts/case_ingest.py --title "通学路安全" --summary "鹿折地区の横断歩道付近の見通しが悪く、児童の安全が心配という相談" --location "鹿折地区" --groups "鹿折地区自治会" --urgency high --source-type citizen_consultation --channel frontend --open-question "事故件数は未確認"
```

この時点で `data/cases/` に JSON と Markdown ができます。

### 2. 本人判断ボードを見る

```bash
python scripts/judgment_board.py
```

見るポイント:

- `本人判断待ち` が何件あるか
- `今日中に見たい案件` があるか
- `リスク確認` があるか

### 3. フォローアップを見る

```bash
python scripts/followup_queue.py
```

見るポイント:

- 残タスクが何件あるか
- `needs_decision` が残っているか
- 締切超過があるか

### 4. 地域メモリを見る

```bash
python scripts/stakeholder_memory.py --kind region --query 鹿折
```

これで、その地域にどんな案件がたまっているかのメモリを見られます。

### 5. 朝ブリーフを出す

```bash
python scripts/morning_brief.py --no-telegram
```

Google や Telegram がなくても、Markdown と JSON は出ます。

## 日々の基本運用

普段の使い方は次のイメージです。

### A. 相談や面会が発生したら案件化する

市民相談:

```bash
python scripts/case_ingest.py --title "避難所運営" --summary "避難所の鍵の管理に不安があるという声" --location "南気仙沼地区" --source-type citizen_consultation --channel frontend
```

面会メモ:

```bash
python scripts/case_ingest.py --title "自治会要望ヒアリング" --summary "道路安全と避難所運営について継続要望あり" --location "鹿折地区" --groups "鹿折地区自治会" --source-type meeting_note --channel voice_memo
```

電話メモ:

```bash
python scripts/case_ingest.py --title "保育園送迎の相談" --summary "送迎導線が危険という電話相談" --location "松岩地区" --source-type phone_memo --channel phone
```

### B. 判断が必要な案件を見る

```bash
python scripts/judgment_board.py
```

### C. 本人が決めたら反映する

まず `case_id` を確認します。
`case_ingest.py` の出力、または `data/cases/*.json` を見れば分かります。

例:

```bash
python scripts/case_update.py --case-id case_xxxxx --decision-result "担当課へ確認する" --follow-up-status pending --owner secretary
```

完了:

```bash
python scripts/case_update.py --case-id case_xxxxx --status closed --follow-up-status completed --public-message "この案件の一次対応を完了として整理しました。"
```

### D. 残タスクを追う

```bash
python scripts/followup_queue.py
```

### E. 朝にまとめて確認する

```bash
python scripts/citizen_digest.py
python scripts/morning_brief.py --no-telegram
```

## 主要コマンド

### 案件まわり

- `python scripts/case_ingest.py ...`
  - 案件を新規登録する
- `python scripts/case_search.py --query "通学路 横断歩道"`
  - 類似案件を探す
- `python scripts/case_update.py --case-id case_xxx ...`
  - 状態、判断、担当、締切を更新する
- `python scripts/case_triage.py`
  - 保存済み案件を再トリアージする

### 判断・フォローアップ

- `python scripts/judgment_board.py`
  - 本人判断ボードを作る
- `python scripts/followup_queue.py`
  - フォローアップキューを作る
- `python scripts/citizen_digest.py`
  - 日次 / 週次ダイジェストを作る
- `python scripts/morning_brief.py --no-telegram`
  - 朝ブリーフを作る

### 人・団体・地域メモリ

- `python scripts/stakeholder_memory.py --kind person --query 佐藤`
- `python scripts/stakeholder_memory.py --kind group --query 自治会`
- `python scripts/stakeholder_memory.py --kind region --query 鹿折`

### 公開情報・予定

- `python scripts/public_info_sync.py`
  - RSS や公開情報を同期する
- `python scripts/public_info_linker.py`
  - 案件と公開情報の関連候補を出す
- `python scripts/calendar_sync.py`
  - 予定一覧と予定前ブリーフを作る

### その他

- `python scripts/activity_draft.py --query "子育て"`
  - 活動記録ドラフトを作る
- `python scripts/run_all.py`
  - 定期処理をまとめて実行する

## Telegram の使い方

`python scripts/telegram_bot.py --help` は常駐オプションしか出しません。
実際に使うコマンドは Telegram のチャット内で打ちます。

常駐起動:

```bash
python scripts/telegram_bot.py --loop
```

主なチャットコマンド:

- `/today`
  - 朝ブリーフ
- `/board`
  - 本人判断ボード
- `/followup`
  - フォローアップ確認
- `/search 通学路`
  - 類似案件検索
- `/case case_xxx`
  - 案件詳細
- `/person 佐藤`
  - 人物メモリ検索
- `/group 自治会`
  - 団体メモリ検索
- `/region 鹿折`
  - 地域メモリ検索
- `/decide case_xxx 担当課へ確認する`
  - 判断結果を保存
- `/done case_xxx`
  - 完了にする
- `/hold case_xxx`
  - 保留にする
- `/public 子育て`
  - 関連公開情報を見る
- `/rss 子育て`
  - 関連 RSS を見る
- `/draft 子育て`
  - 活動記録ドラフトを出す
- `/feedback 子育て案件を上に出して`
  - 優先度の好みを覚えさせる
- `/profile`
  - 学習済み profile を見る

## 設定ファイル

### `config/risk_rules.json`

案件のリスク検知に使います。

例:

- 約束リスク
- 公平性リスク
- 事実未確認
- 選挙・党派リスク
- 行政権限リスク

「この言い回しは危ない」を増やしたい時はここを触ります。

### `config/rss_sources.json`

公開情報の取得元を定義します。

RSS の取得先を増やしたい時はここを触ります。

## `run_all.py` はいつ使うか

`run_all.py` は、
Google Calendar / Gmail / 公開情報同期 / 朝ブリーフ
までまとめて回したい時の入口です。

```bash
python scripts/run_all.py
```

今の実行対象:

- `scripts/public_info_sync.py`
- `scripts/public_info_linker.py`
- `scripts/public_case_export.py`
- `scripts/calendar_sync.py`
- `scripts/email_manager.py`
- `scripts/expense_append.py`
- `scripts/task_reminder.py`
- `scripts/citizen_digest.py`
- `scripts/judgment_board.py`
- `scripts/morning_brief.py`

おすすめの使い分け:

- まだ試している段階
  - `case_ingest`, `judgment_board`, `followup_queue`, `morning_brief --no-telegram`
- 外部連携まで設定済み
  - `run_all.py`

## 外部連携に必要な環境変数

### 共通

- `OPENCLAW_DATA_ROOT`
- `BRIEF_WINDOW_HOURS`

### Google Calendar / Tasks

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

### Gmail

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

### Telegram

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

`.env` をリポジトリ直下に置くと、主要スクリプトが自動で読み込みます。

## 主な出力先

- 案件: `data/cases/*.json`, `data/cases/*.md`
- 公開向け案件: `data/cases_public/latest.json`
- 予定: `data/calendar/today.json`, `data/calendar/today.md`
- 公開情報: `data/public/kesennuma/latest.json`, `data/public/kesennuma/latest.md`
- 関係者メモリ:
  - `data/stakeholders/people/`
  - `data/stakeholders/groups/`
  - `data/stakeholders/regions/`
- フォローアップ: `data/followups/`
- 本人判断ボード: `reports/judgment-board/`
- 朝ブリーフ / ダイジェスト: `reports/daily-briefing/`
- 予定前ブリーフ: `reports/briefs/`, `reports/meeting-prep/`
- 活動記録ドラフト: `reports/activity-drafts/`
- Telegram profile: `data/telegram/tomo_profile.json`

## Obsidian と OpenClaw の使い分け

- `obsidian/`
  - 人が育てる知識ベース
- `data/`
  - スクリプトが生成する構造化データ
- `reports/`
  - 派生アウトプット
- `MEMORY.md`
  - OpenClaw に短期コンテキストを渡すためのメモ

## Lightsail 運用

AWS Lightsail へ載せる場合は [SETUP_LIGHTSAIL.md](./SETUP_LIGHTSAIL.md) を見てください。

ただし、ローカルで使い方が分かってから載せる方が安全です。
先に `5分で試す` の流れを一度やるのをおすすめします。

## 補足

- `.env` は GitHub に push しない
- Telegram 常駐を使う場合は `python scripts/telegram_bot.py --loop`
- Google や Gmail をまだつないでいないなら、先にローカル案件フローから試す
- OpenClaw は市民向けチャットUIではなく、裏側の秘書レイヤー
