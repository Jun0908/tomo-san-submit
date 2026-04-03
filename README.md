# 政治家秘書　Tomo-san

このリポジトリは2つの主要パスで機能します。

- `backend/`: SadTalkerベースの動画生成ロジックとスクリプト。
- `frontend/`: Next.jsベースの会話→成果物フロントエンド（会話 UI + モック成果物生成）。

メインの音声・動画生成は `backend` に依存します。
`frontend` はまずモックUIとして動き、将来 `backend` API に接続します。

`frontend/public/三浦jpg.jpg` を使って、1枚写真から話している動画を作るローカル環境です。

中身は次の組み合わせです。

- 話す顔: `SadTalker`
- テキストから音声: `edge-tts`

## 使い方

### 1) frontend (Next.js) を起動

```bash
cd /Users/jun/Desktop/tomo-san-main/frontend
npm install
npm run dev
```

- ブラウザで `http://localhost:3000` へアクセス
- トップ → 会話 → 成果物生成 のフロー

### 2) backend (SadTalker) を起動

Windowsなら:

```powershell
cd /Users/jun/Desktop/tomo-san-main/backend
run_talking_photo.bat --text "こんにちは。今日はテストです。"
```

既存の使い方は以前と同様です。バックエンドは `outputs/<日時>/talking-head.mp4` を出力します。

---

#### 既存のコマンド例

テキストからすぐ作る:

```powershell
.\run_talking_photo.bat --text "こんにちは。今日はテストです。"
```

既存の音声ファイルを使う:

```powershell
.\run_talking_photo.bat --audio .\sample.wav
```

英語で話させる:

```powershell
.\run_talking_photo.bat --text "Hello. This is a talking photo test." --voice en-US-AvaNeural
```

少し高画質にする:

```powershell
.\run_talking_photo.bat --text "こんにちは。" --size 512 --enhancer gfpgan
```

頭の動きを控えめにする:

```powershell
.\run_talking_photo.bat --text "こんにちは。" --still
```

## 出力先

生成結果は `outputs/<日時>/talking-head.mp4` に保存されます。

同じフォルダの `run.json` に、その回の入力情報も残ります。

## 便利なオプション

利用できる音声一覧を見る:

```powershell
.\run_talking_photo.bat --list-voices --voice-filter ja-JP
```

まばたきや顔向きを別動画から少し借りる:

```powershell
.\run_talking_photo.bat --audio .\sample.wav --ref-eyeblink .\ref.mp4 --ref-pose .\ref.mp4
```

## メモ

- 言語は固定されていません。`--audio` を使えば何語でもそのまま口パクできます。
- `--text` を使う場合は `--voice` を変えるだけで日本語でも英語でも試せます。
- 表情変化は「本格的な演技」までは出ませんが、口の動きと軽い顔の動きは付きます。
- もっと表情を付けたいときは `--ref-eyeblink` と `--ref-pose` に短い参考動画を渡すのがいちばん効きます。
