# OpenClaw セットアップ手順

このリポジトリの現行おすすめ構成は `AWS Lightsail + cron + Telegram` です。
そのため、まずは [SETUP_LIGHTSAIL.md](./SETUP_LIGHTSAIL.md) を使う前提で考えるのがいちばん迷いません。

このファイルは、

- 何をセットアップするのか
- Tomoさんが日常でどう使うのか
- どこまでを最初に動かせばよいのか

を短く把握するための入口です。

## 先に結論

OpenClaw は「市民向けチャットそのもの」ではなく、
市民向けフロントの裏側で動く `政治家秘書レイヤー` です。

役割分担はこうです。

- 市民: 既存フロントで相談する
- OpenClaw: 相談を案件化し、過去案件・予定・公開情報・RSS とつなぐ
- Telegram: Tomoさん向けの秘書連絡帳になる
- Tomoさん: Telegram の要点を見て判断する

## Tomoさんの使い方イメージ

Tomoさんが毎日ターミナルを触る想定ではありません。
基本は Telegram だけで使える形を目指します。

### 朝

- `おはようブリーフ` が Telegram に届く
- 今日の予定
- 重要メール
- 期限が近いタスク
- 新規案件
- 未解決案件
- 市民相談ダイジェスト

### 予定前

- `3分ブリーフ` が届く
- 今日会う相手に関連する相談
- 公開情報や RSS の関連情報
- 今回確認したいこと

### 必要なときだけ

Telegram で次のようなコマンドを使う。

- `/tutorial`
- `/today`
- `/search 通学路`
- `/case case_xxx`
- `/public 子育て`
- `/rss 福祉`
- `/draft 子育て`
- `/done case_xxx`
- `/hold case_xxx`
- `/feedback 子育て案件を上に出してほしい`
- `/profile`

つまり、Tomoさんが覚えることは多くありません。
理想は `朝に届くメモを見る + 必要なときだけ Telegram で一言送る` です。

しかも、今は `/tutorial` で対話型の案内を始められます。
コマンドを覚えなくても、

- `今日は何がある？`
- `通学路の相談ある？`
- `子育て案件を上に出して`
- `子育ての記事の下書きを作って`

のように自然に話せば、かなりの部分はそのまま使えます。

## Tomoさんは使いこなせるか

結論から言うと、`UI を Telegram 中心に寄せれば十分使いこなせる可能性が高い` です。

逆に難しくなるのは次のパターンです。

- ターミナル操作が必要
- 画面が多い
- 設定項目が多い
- 毎回「どう使うか」を思い出す必要がある

そのため、運用の考え方はこうするのがおすすめです。

- Tomoさんは Telegram だけ使う
- 技術側が Lightsail と `.env` と bot 常駐を管理する
- 市民向けフロントからは OpenClaw に自動連携する

## 最初に動かすべき最小セット

最初から全部を完璧に入れなくても大丈夫です。
まずは次の 4 つが動けば「秘書」として価値が出ます。

1. `python scripts/run_all.py`
2. `python scripts/citizen_digest.py`
3. `python scripts/morning_brief.py`
4. `python scripts/telegram_bot.py --loop`

これで、

- 情報収集
- 市民相談の要約
- 朝ブリーフ
- Telegram コマンド

まで回せます。

## セットアップの本体

実際のサーバーセットアップは [SETUP_LIGHTSAIL.md](./SETUP_LIGHTSAIL.md) を見てください。

見る順番:

1. Lightsail の準備
2. `.env` 設定
3. Google API 認証
4. Telegram Bot 作成
5. `run_all.py` の動作確認
6. `telegram_bot.py --loop` の動作確認

## RSS について

公開情報の取得元は `config/rss_sources.json` で増やせます。

最初は気仙沼市議会系だけで十分ですが、今後は次のような source を足せます。

- 市役所のお知らせ
- 地域団体の新着情報
- 子育てや福祉の告知
- 防災関連の更新情報

## 補足

- GitHub Actions ベースの古い運用も残せますが、現行の主ルートではありません
- 現在の主ルートは `Lightsail で常駐させる` 方式です
- Tomoさん本人に技術操作を背負わせない設計にした方がうまく回ります
