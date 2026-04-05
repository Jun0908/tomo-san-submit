# Frontend Tasks

## Progress Update

- [x] API ベースの会話作成 / 取得 / 送信 / 案件生成の土台を実装
- [x] `localStorage` 依存を外し、サーバー側の簡易ストアへ移行
- [x] 案件ページに公開ステータスと公開タイムラインを追加
- [x] `/staff` の入口ページを追加

このファイルは `frontend/` で作業するときの最短ガイドです。
細かい背景は `../plan/2026-04-05_public-intake-security-plan.md` を参照しつつ、日々の実装はまずここだけ見れば進められるようにしています。

## Working Rule

- 公開ユーザーに見せるのは「相談の整理」と「公開ステータス」まで
- Google / Telegram / Obsidian などの内部機能をフロントから直接触らせない
- まずは公開向け MVP を優先し、内部画面や高度な自動化は後回しでよい

## Priority 1

- [ ] 会話画面のモックを API 呼び出しに置き換える
- [ ] `localStorage` 依存を減らし、会話・案件データをサーバー経由で扱える形にする
- [ ] 公開ユーザー向けの案件ステータス表示を追加する

### Scope

- `app/conversation/[id]/page.tsx`
- `app/cases/[id]/page.tsx`
- `lib/session.ts`
- 必要なら `app/api/...`

### Done When

- 会話送信時にモック文言ではなく API 応答を表示できる
- 案件ページで `受付済み` `確認中` `回答・案内済み` のような公開ステータスが見える
- 画面に内部メモや内部担当者情報が表示されない

## Priority 2

- [ ] 公開相談フォームの入力項目を整える
- [ ] 投稿内容を「案件ドラフト」として確認できる UI を作る
- [ ] 不足情報があるときの追加質問 UI を作る

### Scope

- `app/page.tsx`
- `app/conversation/[id]/page.tsx`
- 共通フォームコンポーネントが必要なら `components/` を新設してよい

### Done When

- ユーザーが相談内容、地域、補足情報を入力できる
- 送信前または送信後に「この内容で登録されます」が見える
- 追加質問が来たときに再回答できる

## Priority 3

- [ ] 公開ユーザー向けの案件タイムライン UI を作る
- [ ] 「今どこまで進んだか」が一目で分かる見せ方にする
- [ ] ただし内部詳細を見せすぎない

### 公開してよい情報

- 受付日時
- 公開ステータス
- 公開向けの短い説明文
- 追加情報が必要かどうか

### 公開しない情報

- 内部担当者
- 内部メモ
- Google Calendar / Tasks の内容
- Telegram 通知の中身
- 政治判断の途中経過

### Done When

- 案件ページにタイムラインが表示される
- 各ステップに短い説明文が付く
- 相談者が「無視されていない」と分かる

## Priority 4

- [ ] スタッフ向け画面の入口だけ先に作る
- [ ] 公開画面と内部画面の導線を分ける
- [ ] 後で認証を入れやすいルーティングにする

### Scope

- `app/staff/...` を仮置きで新設してよい
- まだ本格認証まで入れなくてもよいが、公開画面と混ざらない形にする

### Done When

- 公開 UI とスタッフ UI の URL が分かれる
- スタッフ画面に置くべき情報の箱だけ先に用意できる

## Priority 5

- [ ] API 契約をフロント側で固定する
- [ ] OpenClaw 連携前でもモックデータで確認できるようにする
- [ ] 型定義をまとめる

### 必要なデータの最小形

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
  timeline: Array<{
    status: string;
    message: string;
    createdAt: string;
  }>;
};
```

### Done When

- `PublicCase` 系の型が置かれている
- フロントだけで画面確認できるダミーデータがある
- 後で OpenClaw 側の JSON とつなぎやすい

## Nice To Have

- [ ] 送信完了後に「受付番号」を表示する
- [ ] 同意文言や注意書きを整える
- [ ] モバイルで見やすい余白と文字サイズにする

## Do Not Do

- ブラウザに Google 系 Secrets を置かない
- 公開ユーザー入力をそのまま内部コマンドに変換しない
- Telegram や Google API をフロントから直接呼ばない
- 内部ステータスをそのまま公開しない
