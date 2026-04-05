'use client';

import { useState } from 'react';

type TomoTurn = {
  id: string;
  userText: string;
  replyText: string;
  videoUrl?: string;
  error?: string;
};

export default function TomoPage() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<TomoTurn[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/tomo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const payload = (await response.json()) as {
        replyText?: string;
        videoUrl?: string;
        error?: string;
      };

      const nextTurn: TomoTurn = {
        id: `${Date.now()}`,
        userText: trimmed,
        replyText: payload.replyText ?? '返答を生成できませんでした。',
        videoUrl: payload.videoUrl,
        error: response.ok ? undefined : payload.error ?? '動画生成に失敗しました。',
      };

      setHistory((current) => [nextTurn, ...current]);
      setMessage('');

      if (!response.ok) {
        setError(payload.error ?? '動画生成に失敗しました。');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '送信に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <section className="card heroCard">
        <span className="eyebrow">Talking Photo</span>
        <h2>Tomoさんと話す</h2>
        <p className="lede">
          入力した相談やメッセージに対して、Tomoさんの返答を動画として生成します。
          このページは `backend/run_talking_photo.bat` につながっています。
        </p>
      </section>

      <section className="card">
        <h3>メッセージを送る</h3>
        <div className="inputRow">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="例: 通学路の安全対策について相談したいです。"
            disabled={isSubmitting}
          />
          <button className="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? '生成中...' : 'Tomoさんに送る'}
          </button>
        </div>
        <p className="mutedText">
          返答テキストを作ってから、SadTalker で talking photo 動画を生成します。処理には少し時間がかかります。
        </p>
        {error ? <p className="errorText">{error}</p> : null}
      </section>

      <section className="card">
        <h3>会話履歴</h3>
        {history.length === 0 ? (
          <p className="mutedText">まだ会話はありません。</p>
        ) : (
          <div className="tomoHistory">
            {history.map((turn) => (
              <article key={turn.id} className="tomoTurn">
                <div className="tomoBubble userBubble">
                  <strong>あなた</strong>
                  <p>{turn.userText}</p>
                </div>
                <div className="tomoBubble assistantBubble">
                  <strong>Tomoさん</strong>
                  <p>{turn.replyText}</p>
                  {turn.error ? <p className="errorText">{turn.error}</p> : null}
                  {turn.videoUrl ? (
                    <video
                      className="tomoVideo"
                      src={turn.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
