# OpenClaw Political Secretary MVP Plan

## Goal

OpenClaw は、ともさんの代わりに政治判断をする AI ではなく、
ともさんが判断しやすくなるように準備を終わらせておく「政治家秘書」として作る。

前提:

- 市民向けの会話フロントはすでに存在する
- OpenClaw は会話の裏側で動く秘書レイヤーに集中する
- 出力先の中心は Telegram と内部メモ
- RSS を使って公開情報や周辺情報を取り込み、案件や予定とつなぐ
- 最終判断は必ずともさん本人が行う

## What Makes This A Secretary

秘書として成立するために必要な仕事は次の 5 つ。

1. 市民の話を忘れずに案件化する
2. 過去の似た相談を思い出してつなぐ
3. Google Calendar の予定に合わせて先回りして準備する
4. 気仙沼市や市議会の公開情報を拾って材料をそろえる
5. 朝と予定前に、ともさんがすぐ読める形でまとめて渡す

## MVP Outputs

MVP では以下を完成させる。

### 1. おはようブリーフ

毎朝 Telegram に 1 通で送る。

含める内容:

- 今日の予定
- 重要メール
- 期限が近いタスク
- 新規案件
- 未解決案件
- 今日の予定に関係しそうな案件

### 2. 3分ブリーフ

Google Calendar の予定前に自動送信する。

含める内容:

- 予定の概要
- 関連する市民相談
- 関連する公開情報
- 今回確認したいこと
- 未解決の論点

### 3. 相談を案件化

市民向けフロントで受けた会話ログを OpenClaw に渡し、案件メモにする。

最低限の構造:

- 何が起きているか
- どこで起きているか
- 誰が困っているか
- 緊急度
- まだ足りない情報
- 次に聞くこと
- 関連しそうな過去案件
- 関連しそうな公開情報

### 4. 似た相談を探す

Telegram または内部操作から検索できるようにする。

例:

- `/search 通学路`
- `/search 子育て 鹿折`

返す内容:

- 類似案件
- 関連タグ
- 地域
- 公開ステータス

### 5. 公開情報とつなぐ

気仙沼市や市議会の公開情報と案件をつなぐ。

実装方針:

- RSS を定期取得して関連情報を集める
- 気仙沼市議会、市役所、地域団体、告知系の RSS を優先して扱う
- 案件のタグ、地域、キーワードと RSS 記事を照合する

返したい内容:

- 今たまっている相談と関係がありそうな資料
- 近いうちに確認すべき公開情報
- 予定に関係する公開情報
- RSS 由来の新着関連情報

### 6. 市民からの話をまとめたもの

これは MVP に必ず入れる。

目的:

- たくさんの市民の声を、読むだけで傾向が分かる形にする
- 1件ずつ読み直さなくても、今なにが多いか分かるようにする

出力イメージ:

- 今日増えた相談の件数
- 多いテーマ
- 多い地域
- 緊急度が高い相談
- 追加確認待ちの相談
- 面会や会議に持っていく価値が高い論点

想定フォーマット:

- `daily citizen digest`
- `weekly citizen digest`

### 7. Telegram で会話しながら秘書を最適化する

これは MVP 必須ではないが、できると秘書らしさがかなり上がる。

目的:

- ともさんが何を重視するかを運用の中で学ぶ
- 出すブリーフの長さ、順番、重点を徐々に最適化する
- よく扱う論点、地域、相手、優先基準を覚える

やりたいこと:

- Telegram 上で短いやりとりを通じてフィードバックを受ける
- `この形式で見やすいか`
- `この案件は優先度を上げるべきか`
- `この論点は今後も追いかけるべきか`
- `次回から子育て案件を上に出す` のような運用上の好みを学習する

最適化対象:

- 朝ブリーフの並び順
- 予定前ブリーフの重点項目
- 案件の優先順位づけ
- よく見る地域やテーマの重み
- 活動記録下書きのトーンや粒度

## Product Flow

1. 市民がフロントエンドで相談する
2. フロントエンドが会話ログと要約を OpenClaw に送る
3. OpenClaw が案件化する
4. OpenClaw が過去案件と公開情報を照合する
5. OpenClaw が RSS 由来の関連情報も集めて追加する
6. OpenClaw が Telegram で朝ブリーフと予定前ブリーフを送る
7. Telegram 上の短いやりとりから、ともさん向けの重みづけを学ぶ
8. ともさんは Telegram と内部メモを見て判断する

## Implementation Priorities

### Phase 1: Intake Contract

最優先は、市民向けフロントから OpenClaw へ案件を安定して渡す入口を固めること。

やること:

- フロントから渡す JSON の shape を定義する
- `case_ingest.py` を外部入力の正式入口として固定する
- 必要なら API ラッパを追加する
- 会話ログから案件メモと公開向け案件 JSON を生成する

Done:

- フロントから受けた相談が必ず案件化される
- 保存先と JSON shape が安定する
- 類似案件と公開情報が同時に返る

### Phase 2: Citizen Digest

「市民からの話をまとめたもの」を作るフェーズ。

やること:

- 新規案件を日次で集計する
- テーマ別、地域別、緊急度別に要約する
- 追加確認待ち案件を抽出する
- 面会や予定に結びつきやすい案件を上位表示する
- RSS の新着情報の中から、市民相談と関係が強いものを抽出する

Done:

- 毎朝、ともさんが新規相談の傾向を 1 回で把握できる
- 「今日は何が多かったか」が見える
- 「次に確認すべき案件」が見える
- 「今動きやすい論点」が RSS を通じて見える

### Phase 3: Morning Brief

既存の Gmail / Tasks / Calendar / Cases を束ねて Telegram に送る。

やること:

- 今日の予定を取得
- Gmail の重要メールを抽出
- 締切が近いタスクを抽出
- 新規案件と未解決案件を抽出
- Citizen Digest の結果を含める
- Telegram へ 1 通で送る

Done:

- 朝 1 通見れば、その日の準備の大枠が分かる
- 「まず何を見るべきか」が分かる

### Phase 4: Pre-Meeting Brief

予定前の秘書機能を完成させる。

やること:

- Calendar 予定に関連案件を結びつける
- 関連公開情報を付ける
- RSS 由来の新着関連記事を付ける
- 確認したいことを 3 個以内で出す
- Telegram に予定前ブリーフを送る

Done:

- 面会や会議の前にゼロから考えなくてよくなる
- ともさんが「今日この場で何を聞けばよいか」をすぐ理解できる
- 新着の関連情報が自動で補われる

### Phase 5: Telegram Command Layer

Telegram を「市民窓口」ではなく「ともさん用の秘書端末」にする。

やること:

- `/today` 今日の要点を返す
- `/search <query>` 類似案件を返す
- `/case <id>` 案件詳細を返す
- `/public <query>` 関連公開情報を返す
- `/rss <query>` 関連する新着 RSS 情報を返す
- `/done <id>` `/hold <id>` で案件状態を更新する

Done:

- Telegram から主要な秘書機能を操作できる
- ともさんがわざわざ別画面を開かなくてよい

### Phase 6: Activity Draft

MVP 後に入れたい価値の高い機能。

やること:

- 面会メモと案件メモから活動報告の叩き台を作る
- note や活動記録の素材になる下書きを作る

Done:

- 記録発信の初稿づくりが楽になる
- 議会活動と市民活動の記録が残しやすくなる

### Phase 7: Telegram Personalization

MVP 後に強く入れたい秘書最適化フェーズ。

やること:

- Telegram 上のフィードバックを保存する
- ともさんの優先テーマ、重点地域、表現の好みを profile 化する
- ブリーフの並び順と強調点を profile に応じて変える
- `この情報は役に立った / いらなかった` を学習に使う

Done:

- 秘書の出力が徐々にともさん向けに最適化される
- 同じ情報量でも「読みやすく、使いやすい」順序に近づく

## Concrete Repo Work

既存コードを活かし、以下を実装対象にする。

### 既存ファイルを拡張する

- `scripts/openclaw_core.py`
  - 案件の公開向けフィールド
  - 類似案件検索
  - 公開情報関連付け
  - 市民相談集計 helper
  - RSS 関連情報の正規化 helper
  - Telegram 学習用 profile helper

- `scripts/case_ingest.py`
  - フロントからの正式 ingest 入口
  - JSON 出力契約の固定

- `scripts/calendar_sync.py`
  - 予定前ブリーフ改善
  - 関連案件と公開情報の精度向上
  - RSS 関連情報の差し込み

- `scripts/task_reminder.py`
  - Telegram 連携の基盤再利用

- `scripts/public_info_sync.py`
  - RSS 取得対象の拡張
  - source ごとの正規化

- `scripts/run_all.py`
  - 朝ブリーフや digest 生成ジョブの追加
  - RSS / personalization 系ジョブの追加

### 新規追加するファイル候補

- `scripts/citizen_digest.py`
  - 日次・週次の市民相談サマリーを生成する

- `scripts/morning_brief.py`
  - Gmail / Tasks / Calendar / Cases / Digest をまとめて Telegram に送る

- `scripts/telegram_bot.py`
  - ともさん用コマンド受付

- `scripts/case_update.py`
  - 案件ステータス更新専用

- `scripts/activity_draft.py`
  - 活動報告の叩き台生成

- `scripts/rss_watch.py`
  - 複数 RSS source を収集し、案件や予定との関連度を計算する

- `scripts/tomo_profile.py`
  - Telegram 上のフィードバックから profile を育てる

- `config/rss_sources.json`
  - 監視する RSS source 一覧

## Data Contract To Define

市民向けフロントから OpenClaw に渡す入力は最低でも以下を持つ。

```json
{
  "source": "citizen_frontend",
  "conversation_id": "string",
  "received_at": "2026-04-25T09:00:00+09:00",
  "title": "string",
  "summary": "string",
  "transcript": "string",
  "location": "string",
  "people": ["string"],
  "tags": ["string"],
  "urgency": "low|medium|high"
}
```

OpenClaw が返す最低限の出力:

```json
{
  "case": {},
  "public_case": {},
  "related_cases": [],
  "related_public_info": [],
  "files": {}
}
```

Telegram の最適化用に内部で持ちたい情報:

```json
{
  "preferred_topics": ["子育て", "福祉"],
  "preferred_regions": ["鹿折", "南気仙沼"],
  "brief_style": "short",
  "priority_bias": {
    "child_safety": 2,
    "education": 1
  },
  "feedback_history": []
}
```

## Definition Of Done

MVP 完了の条件は次の通り。

1. 市民向けフロントから受けた会話が自動で案件化される
2. 毎朝 Telegram に `おはようブリーフ` が届く
3. 予定前に `3分ブリーフ` が届く
4. 類似相談を Telegram から検索できる
5. 公開情報との関連が見える
6. 市民からの話をまとめた日次サマリーが見られる
7. RSS 由来の関連情報が案件や予定にひもづく

MVP 後の発展条件:

1. Telegram 上のフィードバックから出力順や重点が変わる
2. ともさん向けの秘書 profile が蓄積される

## Not In MVP

MVP では次はやらない。

- 市民と長い自由会話を続ける高機能チャット化
- ともさん名義での自動返信
- 政治判断の自動決定
- 表の大型ダッシュボード開発

## One-Line Summary

この MVP で作るのは、
「市民の声を覚え、予定と公開情報につなぎ、朝と予定前に準備を渡す政治家秘書」
である。
