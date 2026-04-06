# Frontend / OpenClaw Integration Plan

Date: 2026-04-06

## Goal

Next.js frontend と Lightsail 上の `agents-OpenClaw` を、安全境界を崩さずにつなぐ。

今回の接続で先に作るのは次の 2 本です。

1. 公開ユーザーが見られる案件データの read 経路
2. 公開会話から案件ドラフトを作る ingest 経路

どちらもブラウザから OpenClaw を直接触らせず、`frontend -> Next.js API -> OpenClaw` の形に固定する。

## Assumption

- `agents-OpenClaw` は AWS Lightsail 上の Linux に配置される
- frontend も同じ Lightsail 上、または OpenClaw の公開出力を読めるサーバー環境で動かす
- 公開面から許可する OpenClaw 連携は `read` と `draft creation` まで
- Gmail / Calendar / Tasks / Telegram などの副作用処理は今回の公開 API から呼ばない

## Integration Shape

```text
Browser
  -> frontend/app/api/*
  -> frontend/lib/server/openclaw-bridge.ts
  -> agents-OpenClaw public JSON / dedicated ingest command
```

## Data Contract

OpenClaw 側の公開 JSON は snake_case、frontend 側 UI は camelCase なので、Next.js API 層で変換する。

### OpenClaw public case JSON

```json
{
  "id": "case_xxx",
  "title": "鹿折地区の通学路に関する相談",
  "summary": "横断歩道付近の見通しが悪く危険です。",
  "location": "鹿折地区",
  "tags": ["交通安全", "教育"],
  "created_at": "2026-04-06T10:00:00+09:00",
  "updated_at": "2026-04-06T10:15:00+09:00",
  "status_public": "確認中",
  "latest_public_message": "案件として整理し、公開情報や関連論点との照合を進めています。",
  "requires_user_input": false,
  "public_timeline": [
    {
      "status": "受付済み",
      "message": "ご相談を受け付けました。内容の整理を始めています。",
      "created_at": "2026-04-06T10:00:00+09:00"
    }
  ]
}
```

### Frontend API response

```ts
type PublicCase = {
  id: string;
  title: string;
  summary: string;
  statusPublic: string;
  latestPublicMessage: string;
  requiresUserInput: boolean;
  createdAt: string;
  updatedAt: string;
  area?: string;
  themeTags: string[];
  timeline: Array<{
    status: string;
    message: string;
    createdAt: string;
  }>;
};
```

### Mapping rule

- `location` -> `area`
- `tags` -> `themeTags`
- `status_public` -> `statusPublic`
- `latest_public_message` -> `latestPublicMessage`
- `requires_user_input` -> `requiresUserInput`
- `created_at` -> `createdAt`
- `updated_at` -> `updatedAt`
- `public_timeline[*].created_at` -> `timeline[*].createdAt`

## Environment Variables

frontend 側に次を追加する。

```env
OPENCLAW_DATA_ROOT=/opt/agents-OpenClaw
OPENCLAW_CASES_PUBLIC_DIR=/opt/agents-OpenClaw/data/cases_public
OPENCLAW_CASES_DIR=/opt/agents-OpenClaw/data/cases
OPENCLAW_PYTHON_BIN=/opt/agents-OpenClaw/.venv/bin/python
OPENCLAW_CASE_INGEST_SCRIPT=/opt/agents-OpenClaw/scripts/case_ingest.py
```

`OPENCLAW_CASES_PUBLIC_DIR` がある場合はそれを優先し、なければ `OPENCLAW_DATA_ROOT/data/cases_public` を使う。

## Frontend Implementation

### 1. OpenClaw bridge を追加する

新規ファイル:

- `frontend/lib/server/openclaw-bridge.ts`

責務:

- `latest.json` と個別 case JSON を読む
- `PublicCase` へ変換する
- `case_ingest.py --json` を安全に実行する
- エラーを frontend 向けメッセージへ寄せる

公開する関数:

```ts
export async function listOpenClawPublicCases(): Promise<PublicCase[]>
export async function getOpenClawPublicCase(caseId: string): Promise<PublicCase | null>
export async function ingestOpenClawCaseDraft(input: IntakeDraftInput): Promise<OpenClawIngestResult>
```

### 2. intake セッションに OpenClaw 連携用フィールドを足す

更新ファイル:

- `frontend/lib/types.ts`
- `frontend/lib/server/store.ts`

追加フィールド案:

```ts
type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  generated?: PublicCase;
  openClawCaseId?: string;
  openClawPublicJsonPath?: string;
};
```

目的:

- frontend の会話セッションと OpenClaw の案件 ID を 1 対 1 で結ぶ
- 後から `/api/cases/[id]` で再取得できるようにする

### 3. generate API をモック生成から OpenClaw ingest に切り替える

更新ファイル:

- `frontend/app/api/conversations/[id]/generate/route.ts`
- `frontend/lib/server/store.ts`
- `frontend/lib/server/mock-intake.ts`

実装方針:

- 会話メッセージをまとめて transcript を作る
- 最低限 `title`, `summary`, `transcript`, `location`, `tags` を bridge に渡す
- `case_ingest.py --json` の返却から `public_case` を受け取る
- session に `generated`, `openClawCaseId`, `openClawPublicJsonPath` を保存する

バリデーション:

- メッセージが空なら 400
- 文字数上限を決める
- title / summary は frontend 側で推定してもよいが、最終整形は OpenClaw 側に任せる

### 4. cases API を OpenClaw ソース優先に切り替える

更新ファイル:

- `frontend/app/api/cases/[id]/route.ts`
- `frontend/lib/server/store.ts`

読み順:

1. session から `openClawCaseId` を見る
2. あれば OpenClaw の公開 JSON を読み直す
3. なければ session に保存済みの `generated` を返す
4. どちらもなければ 404

これで cron による公開ステータス更新が走っても、案件ページで最新を見せやすくなる。

### 5. 一覧 API を OpenClaw public latest に寄せる

更新ファイル:

- `frontend/app/api/conversations/route.ts`
- `frontend/app/page.tsx`

短期方針:

- 既存の会話セッション一覧は残す
- `/staff` またはトップに「OpenClaw の公開案件一覧」カードを追加して `latest.json` を表示する

中期方針:

- `conversations` と `cases` の一覧を分離し、一覧画面を OpenClaw ソース中心にする

### 6. スタッフ画面から read-only 監視を始める

更新ファイル:

- `frontend/app/staff/page.tsx`

最初に置くもの:

- 公開案件一覧
- `statusPublic`
- `updatedAt`
- `requiresUserInput`
- OpenClaw case ID

今回は更新操作ボタンまで入れなくてよい。まず read-only で状態確認できるようにする。

## OpenClaw Implementation

### 1. ingest の返却 JSON を契約として固定する

更新ファイル:

- `agents-OpenClaw/scripts/case_ingest.py`

維持したい出力:

```json
{
  "case": {},
  "public_case": {},
  "related_cases": [],
  "related_public_info": [],
  "files": {
    "markdown": "...",
    "json": "...",
    "public_json": "..."
  }
}
```

追加候補:

- `ingested_at`
- `warnings`

### 2. 公開一覧と個別公開 JSON の出力を継続保証する

更新ファイル:

- `agents-OpenClaw/scripts/openclaw_core.py`
- `agents-OpenClaw/scripts/public_case_export.py`

保証したいこと:

- 案件 1 件ごとに `data/cases_public/<slug>.json`
- 一覧として `data/cases_public/latest.json`
- 既存案件を読み直しても公開フィールドが欠けにくい

### 3. frontend 連携用の location / tags を安定させる

更新ファイル:

- `agents-OpenClaw/scripts/openclaw_core.py`

調整内容:

- `location` が空でもキーは必ず返す
- `tags` は常に配列
- `public_timeline` は常に配列
- `updated_at` は常に埋まる

### 4. ingest コマンドの安全境界を明文化する

更新ファイル:

- `agents-OpenClaw/README.md`
- `agents-OpenClaw/TASKS.md`

明文化すること:

- `case_ingest.py` は公開入力から呼んでもよい専用入口
- Gmail / Calendar / Tasks / Telegram 系は公開 API から呼ばない
- frontend が起動するのは allowlist 済みコマンド 1 本だけ

## API Contract

### POST `/api/conversations/:id/generate`

役割:

- frontend session を OpenClaw 案件へ昇格する

成功レスポンス:

```json
{
  "id": "session-id",
  "generated": {
    "id": "case_xxx",
    "title": "...",
    "statusPublic": "確認中"
  },
  "openClawCaseId": "case_xxx"
}
```

### GET `/api/cases/:id`

役割:

- session 経由で紐付いた OpenClaw 公開案件を返す

レスポンス:

```json
{
  "sessionId": "frontend-session-id",
  "sessionTitle": "相談 2026/04/06 11:30:00",
  "case": {
    "id": "case_xxx",
    "title": "...",
    "summary": "...",
    "statusPublic": "確認中",
    "latestPublicMessage": "...",
    "requiresUserInput": false,
    "createdAt": "...",
    "updatedAt": "...",
    "area": "鹿折地区",
    "themeTags": ["交通安全"],
    "timeline": []
  }
}
```

### GET `/api/staff/cases`

新設候補:

- staff 画面用の read-only 一覧 API
- source は `data/cases_public/latest.json`

## Rollout Order

### Step 1

- `openclaw-bridge.ts` を追加
- `GET /api/cases/:id` を OpenClaw 対応
- `/staff` に公開案件一覧を表示

### Step 2

- `POST /api/conversations/:id/generate` を OpenClaw ingest に切り替え
- session と OpenClaw case ID を紐付け

### Step 3

- `GET /api/staff/cases` を追加
- 一覧を `latest.json` ベースに寄せる

## Verification Checklist

- `agents-OpenClaw/scripts/case_ingest.py --json` がローカルで実行できる
- `data/cases_public/latest.json` が出力される
- frontend の `/api/cases/:id` が snake_case を camelCase に変換して返す
- frontend の案件ページで `statusPublic`, `latestPublicMessage`, `timeline` が表示される
- OpenClaw 側の JSON に内部メモや個人情報が混ざっていない
- 公開 API から Gmail / Calendar / Telegram 系の処理が呼ばれない

## Immediate Next

最初の実装対象は次の順番が最短です。

1. `frontend/lib/server/openclaw-bridge.ts`
2. `frontend/app/api/cases/[id]/route.ts` の OpenClaw 対応
3. `frontend/app/staff/page.tsx` の公開案件一覧
4. `frontend/app/api/conversations/[id]/generate/route.ts` の ingest 連携
