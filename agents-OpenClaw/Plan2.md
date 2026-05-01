# OpenClaw Political Secretary OS Plan 2

## Why This Plan Exists

前回の `Plan.md` は、
「市民の声を案件化し、朝ブリーフや予定前ブリーフを出す」
ところまでは整理できていた。

ただ、今回の指摘を踏まえると、それだけでは足りない。

忙しい政治家が本当に欲しいのは、
「会話を成果物にする AI」ではなく、
「未整理の情報を受け止め、仕分けし、記憶し、危険を見つけ、本人が決めるべきことだけを上げる秘書」
である。

この Plan 2 では、OpenClaw を
`政治家向けチャットAI` ではなく
`政治家の仕事を裏で前に進める秘書OS`
として再定義する。

## Goal

OpenClaw の目的は、政治家本人の代わりに判断することではない。
目的は、政治家本人が
`会うべき人`
`考えるべき論点`
`決めるべき案件`
だけに集中できる状態を作ること。

成功状態:

- すべての入力が「案件」として整理される
- 案件ごとに `誰が処理するか` `何を確認するか` `何が危険か` が先に見える
- 本人に届くのは `受信箱` ではなく `判断箱`
- 面会前には 3 分で読める事前ブリーフがある
- 面会後には未処理が残らず、次の一手がキュー化される

## What Makes This A Secretary

秘書OSとして成立するために必要な役割は次の 5 つ。

### 1. Gatekeeper

全部を本人に見せるのではなく、
`本人対応`
`秘書対応`
`行政確認`
`保留`
`リスクあり`
を先に分ける。

### 2. Memory

議事録ではなく、関係性を覚える。

- この人は前回何を話したか
- この団体は何度目の要望か
- この地域では何の不満が重なっているか
- この案件はどの議会論点につながるか

### 3. Operator

相談を受けて終わりではなく、
次の一手を自動で並べる。

- 担当課確認
- 現地確認
- 追加ヒアリング
- 日程調整
- 一次返信
- 議会質問候補化

### 4. Risk Sensor

前に進めるだけでなく、危ない橋を見つける。

- 約束に聞こえる表現
- 公平性の問題
- 事実未確認の発信
- 党派性や選挙リスク
- 行政権限を超える返答

### 5. Editor Of The Politician

効率化のために本人らしさを壊さない。

- その政治家の過去発言と矛盾しないか
- この件は本人の言葉で返すべきか
- どこまで言ってよいか
- どの温度感で返すのが自然か

## Product Surfaces

Plan 2 で主役にする画面・出力は次の 5 つ。

### 1. 案件インボックス

入力元を問わず、全部を案件として受ける。

対象:

- 市民相談
- 面会メモ
- 電話メモ
- LINE / メール要点
- 会合後メモ
- 担当課への確認依頼

各案件で最低限ほしいもの:

- 緊急度
- ルート分類
- 本人判断が必要か
- 返答期限
- 次の一手
- リスク
- 政策テーマ化の可能性

### 2. 本人判断ボード

政治家本人が決めるべきものだけを並べる。

理想の見え方:

- 本人判断が必要な案件数
- 今日中に見るべき案件
- リスクあり案件
- 面会前に見ておくべき案件
- 各案件に対する選択肢

例:

- `本人から返答する / 秘書から返答する`
- `担当課へ確認する / まず現地を見る`
- `個別対応に留める / 議会質問候補に上げる`
- `今すぐ動く / 次回会合まで保留`

### 3. 関係者メモリ

人・団体・地域単位で記憶を持つ。

持ちたい情報:

- 前回の接点
- 過去の相談履歴
- 未解決事項
- 温度感や信頼関係
- つながっている人物・団体
- 次に会うとき確認すべきこと

### 4. 事前ブリーフ

予定の前に、本人が 3 分で読める準備を出す。

含める内容:

- 相手と過去に何を話したか
- 今回の目的
- 関連案件
- 最近の関連公開情報
- 言ってよいこと / 慎重にすべきこと
- この場で決めるべきこと

### 5. 返信・確認・依頼の下書き

文章生成そのものではなく、
`誰に`
`どの温度感で`
`どこまで言ってよいか`
が整理された状態で下書きを出す。

対象:

- 市民への一次返信
- 担当課への確認文
- 支援者へのお礼
- 団体との日程調整
- 議会質問メモ

## What Changes From Plan.md

優先度を次のように入れ替える。

### 上げるもの

- 案件のトリアージ
- 本人判断ボード
- 関係者メモリ
- フォローアップ管理
- リスク検知
- 面会前後の運用

### 下げるもの

- 市民向け会話体験の磨き込み
- Telegram 上の自然文会話の高度化
- 活動記録ドラフトの優先度
- RSS ソースの横展開そのもの

### 位置づけを変えるもの

- `morning_brief.py`
  - 情報列挙から、本人判断優先の朝ブリーフへ変更
- `citizen_digest.py`
  - 件数集計から、政策シグナル抽出へ変更
- `public_info_sync.py`
  - 単独価値ではなく、案件判断の材料として使う

## MVP Outputs

Plan 2 の MVP では以下を完成させる。

### 1. 案件トリアージ済みインボックス

すべての入力が、受信直後に次の形になる。

- `principal_decision`
- `secretary_action`
- `admin_check`
- `watchlist`

加えて、

- 緊急度
- 期限
- リスクフラグ
- 推奨アクション
- 本人に上げる理由

を持つ。

### 2. 本人判断ボード

毎朝と必要時に Telegram へ 1 通で送る。

含める内容:

- 本人判断が必要な件数
- 今日中に見るべき件数
- リスクあり件数
- 面会前に確認が必要な案件
- 各案件の推奨選択肢

### 3. 3分事前ブリーフ

Google Calendar の予定前に自動送信する。

含める内容:

- 相手との過去接点
- 関連案件
- 地域・団体の最近の論点
- 関連公開情報
- 慎重にすべき表現
- 今日この場で確認したいこと

### 4. フォローアップ実行キュー

本人が決めた後に、案件が放置されないようにする。

キュー化したいもの:

- 担当課確認
- 一次返信
- 現地確認
- 資料収集
- 日程調整
- 議会質問候補化

### 5. 関係者メモリ検索

Telegram または内部操作から、
`人`
`団体`
`地域`
単位で過去の履歴を見られるようにする。

例:

- `/person 佐藤さん`
- `/group ○○自治会`
- `/region 鹿折地区`

## Product Flow

1. 市民相談・面会メモ・メール要点などが OpenClaw に入る
2. `case_ingest.py` が案件として正規化する
3. `case_triage.py` がルート分類、期限、リスク、推奨アクションを付ける
4. `stakeholder_memory.py` が人・団体・地域メモリを更新する
5. `public_info_linker.py` が関連公開情報をつなぐ
6. `judgment_board.py` が本人判断が必要な案件だけを抽出する
7. `morning_brief.py` が朝ブリーフを作る
8. `calendar_sync.py` が面会前 3 分ブリーフを作る
9. 本人の判断後、`followup_queue.py` が残タスクを進める

## Implementation Priorities

### Phase 1: Case Schema V2

最優先は、案件 JSON を
`相談メモ`
から
`トリアージ可能な業務オブジェクト`
へ育てること。

やること:

- すべての入力を案件として統一する
- `source`, `channel`, `received_at`, `deadline` を持たせる
- `route`, `requires_principal_decision`, `decision_options` を持たせる
- `risk_flags`, `risk_level`, `policy_signal` を持たせる
- `next_actions`, `owner`, `follow_up_status` を持たせる
- `people_ids`, `group_ids`, `region_ids` を持たせる

Done:

- どの入力が来ても同じ構造で保存される
- 相談を読まなくても処理ルートが分かる
- 本人判断が必要かどうかが機械的に抽出できる

### Phase 2: Triage Engine

秘書OSの中核。
案件を読んだ瞬間に「どう扱う案件か」を出す。

やること:

- ルート分類ルールを実装する
- リスク検知ルールを実装する
- 本人に上げる理由を短文で作る
- 推奨選択肢を 2-4 個に絞る
- `case_update.py` でステータスを追えるようにする

Done:

- 受信箱が判断箱に変わる
- 本人に見せる案件を絞れる
- 秘書側で進めてよい案件を切り出せる

### Phase 3: Judgment Board

本人判断が必要なものだけを毎日・随時見える化する。

やること:

- `judgment_board.py` を作る
- `today`, `risk`, `meeting_related`, `overdue` で並べ替える
- Telegram 向け短文と Markdown 向け詳細版を出す
- 案件ごとに `推奨選択肢` を表示する

Done:

- 朝 1 通見れば「今日は何を決めるか」が分かる
- 長文を読まずに次の判断へ進める

### Phase 4: Stakeholder Memory

信頼の継続を支える基盤を作る。

やること:

- 人・団体・地域の記憶ストアを作る
- 案件登録時に自動で更新する
- 過去案件、未解決事項、最近の接点をひもづける
- `/person`, `/group`, `/region` 検索を追加する

Done:

- 「前にも聞いた話か」がすぐ分かる
- 会う前に相手との関係を思い出せる
- 地域課題の蓄積が見える

### Phase 5: Meeting Brief V2

予定前ブリーフを、単なる関連資料集めから
`判断準備`
へ変える。

やること:

- カレンダー予定と関係者メモリをつなぐ
- 関連案件と最近の公開情報を絞り込む
- `言ってよいこと / 慎重にすべきこと` を出す
- `今回確認したいこと` を 3 点以内で出す

Done:

- 面会や会議の前にゼロから考えなくてよくなる
- 本人の発言リスクを事前に下げられる

### Phase 6: Follow-Up Queue

案件が「相談を聞いた」で止まらないようにする。

やること:

- 判断後の次アクションをキュー化する
- owner と due を持たせる
- 未完了を `waiting_external` `pending_reply` `scheduled` などで追う
- Telegram から `/done` `/hold` `/delegate` 相当を使えるようにする

Done:

- ToDo を増やすのでなく、ToDo を消していける
- 未処理の取りこぼしが減る

## Concrete Repo Work

### 既存ファイルを優先拡張する

- `scripts/openclaw_core.py`
  - 案件 Schema V2
  - ルート分類 helper
  - リスク判定 helper
  - 判断ボード組み立て helper
  - 人・団体・地域メモリ helper

- `scripts/case_ingest.py`
  - 市民相談だけでなく、面会メモ・電話メモ・メール要点も ingest できるようにする
  - `--source` `--channel` `--deadline` `--group` `--route-hint` などを追加する

- `scripts/morning_brief.py`
  - `今日の件数` ではなく `今日決めること` を先頭に出す
  - Judgment Board を読み込む構造へ変える

- `scripts/calendar_sync.py`
  - 予定と関係者メモリを結びつける
  - 面会前ブリーフにリスク欄を追加する

- `scripts/citizen_digest.py`
  - 件数サマリーに加えて `地域課題クラスタ` `政策化候補` を出す

- `scripts/telegram_bot.py`
  - `/board`
  - `/person`
  - `/group`
  - `/region`
  - `/followup`
  - `/decide <case_id>`
  を中心に再構成する

- `scripts/case_update.py`
  - `route`, `owner`, `due`, `follow_up_status`, `decision_result` 更新に対応する

### 新規追加するファイル候補

- `scripts/case_triage.py`
  - 案件のルート分類とリスク付与

- `scripts/judgment_board.py`
  - 本人判断ボード生成

- `scripts/stakeholder_memory.py`
  - 人・団体・地域メモリの更新と検索

- `scripts/followup_queue.py`
  - 判断後アクションの抽出と未完了追跡

- `config/risk_rules.json`
  - 約束・公平性・事実未確認などの簡易ルール定義

### 新規データ保存先候補

- `data/stakeholders/people/`
- `data/stakeholders/groups/`
- `data/stakeholders/regions/`
- `data/followups/`
- `reports/judgment-board/`

## Data Contract To Define

Plan 2 では、案件の最低構造を次のように定義する。

```json
{
  "id": "case_xxxxx",
  "title": "通学路の見通しが悪い",
  "summary": "横断歩道付近の植栽で見通しが悪く、児童の安全が心配という相談",
  "source": {
    "type": "citizen_consultation",
    "channel": "frontend",
    "received_at": "2026-04-26T09:00:00+09:00"
  },
  "entities": {
    "people": ["佐藤さん"],
    "groups": ["鹿折地区自治会"],
    "region": "鹿折地区"
  },
  "issue": {
    "tags": ["交通安全", "教育"],
    "policy_signal": "possible",
    "facts_confirmed": [],
    "facts_unconfirmed": ["事故件数は未確認"]
  },
  "triage": {
    "route": "principal_decision",
    "requires_principal_decision": true,
    "reason": "地域要望と議会論点の両面を持つため",
    "decision_options": [
      "担当課へ確認する",
      "現地確認を先に入れる",
      "議会質問候補として保留する"
    ],
    "deadline": "2026-04-27T18:00:00+09:00"
  },
  "risk": {
    "level": "medium",
    "flags": ["事実未確認", "約束リスク"]
  },
  "follow_up": {
    "owner": "secretary",
    "status": "pending",
    "next_actions": [
      "担当課確認文の下書きを作る",
      "過去の類似相談を確認する"
    ]
  },
  "links": {
    "related_case_ids": [],
    "related_public_info_ids": [],
    "person_ids": [],
    "group_ids": [],
    "region_ids": []
  }
}
```

本人判断ボードの最低出力:

```json
{
  "generated_at": "2026-04-26T07:00:00+09:00",
  "must_decide_today": [],
  "risk_alerts": [],
  "meeting_related": [],
  "overdue_followups": [],
  "summary": {
    "principal_decision_count": 7,
    "due_today_count": 2,
    "risk_count": 1
  }
}
```

関係者メモリの最低構造:

```json
{
  "id": "person_xxxxx",
  "name": "佐藤さん",
  "type": "person",
  "regions": ["鹿折地区"],
  "last_contact_at": "2026-04-26T09:00:00+09:00",
  "case_ids": ["case_xxxxx"],
  "open_loops": ["道路安全の確認待ち"],
  "notes": [
    "前回は避難所運営の相談あり"
  ]
}
```

## Definition Of Done

Plan 2 の MVP 完了条件は次の通り。

1. 市民相談、面会メモ、電話メモの少なくとも 3 種類が同じ案件スキーマで ingest できる
2. すべての案件に `route` `risk` `next_actions` が付く
3. 毎朝 Telegram に `本人判断ボード` が届く
4. 予定前に `3分事前ブリーフ` が届く
5. 人・団体・地域の過去履歴を検索できる
6. 本人判断後のフォローアップがキューで追える
7. 未処理案件が `何待ちなのか` 分かる

## Not In MVP

Plan 2 の初期段階では、次は後回しにする。

- 市民向け会話フロントの大幅改善
- 政治家名義での自動返信
- 完全自動の政治判断
- 大型 Web ダッシュボード
- RSS ソースの大規模拡張
- activity draft の高度化

## One-Line Summary

この Plan 2 で作るのは、
`相談・予定・人間関係・公開情報を案件化し、本人が決めるべきものだけを上げ、残りを進める政治家秘書OS`
である。
