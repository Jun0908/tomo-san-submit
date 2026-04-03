# Frontend 実行方法（Next.js）

このフォルダは Next.js アプリケーションに変更しました。

## セットアップ

```bash
cd /Users/jun/Desktop/tomo-san-main/frontend
npm install
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスします。

## 動作フロー

- トップページから会話セッションを開始
- 会話ページでメッセージ送受信（モックAI応答）
- 「成果物を生成」で生成結果ページを表示
- 出力を TXT でダウンロード

## API連携
- `app/conversation/[id]/page.tsx` では現状 `localStorage` のモック挙動
- バックエンドAPIが整ったら `fetch('/api/...')` に差し替え可能
