'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { generateSessionCase, getSession, sendSessionMessage } from '@/lib/session';
import type { Session } from '@/lib/types';

type Props = { params: { id: string } };

export default function ConversationPage({ params }: Props) {
  const id = params.id;
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void getSession(id)
      .then((current) => {
        if (active) {
          setSession(current);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '相談データを取得できませんでした。');
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const sendMessage = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const updated = await sendSessionMessage(id, message);
      setSession(updated);
      setMessage('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'メッセージを送信できませんでした。');
    } finally {
      setIsSending(false);
    }
  };

  const generate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      await generateSessionCase(id);
      router.push(`/cases/${id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '案件ページを生成できませんでした。');
      setIsGenerating(false);
    }
  };

  if (!session) {
    return (
      <div className="card">
        <h2>相談が見つかりません</h2>
        <p className="mutedText">開始前に一覧から相談を開き直してください。</p>
        {error ? <p className="errorText">{error}</p> : null}
        <p>
          <Link href="/">トップへ戻る</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Conversation</span>
            <h2>相談ヒアリング</h2>
          </div>
          <span className="mutedText">作成: {new Date(session.createdAt).toLocaleString('ja-JP')}</span>
        </div>

        <p className="mutedText">
          ここでは相談内容を整理し、公開できる案件メモの土台を作ります。内部ツールへの直接操作は行いません。
        </p>

        <div className="chatLogs">
          {session.messages.length === 0 ? (
            <p className="mutedText">まずは困りごとや要望の内容、場所、いつ頃から困っているかを書いてください。</p>
          ) : (
            session.messages.map((item) => (
              <div key={item.id} className={`message ${item.role}`}>
                <strong>{item.role === 'user' ? '相談者' : '整理アシスタント'}</strong>
                <span>{item.text}</span>
              </div>
            ))
          )}
        </div>

        <div className="inputRow">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="例: 鹿折地区の通学路で朝の交通量が多く、横断が危険です。"
            disabled={isSending}
          />
          <button className="button" onClick={sendMessage} disabled={isSending}>
            {isSending ? '送信中...' : '送信'}
          </button>
        </div>

        <div className="helperCard">
          <h3>入力のヒント</h3>
          <ul className="featureList">
            <li>どこで起きているか</li>
            <li>いつから、どのくらい困っているか</li>
            <li>誰にどんな影響が出ているか</li>
          </ul>
        </div>

        {error ? <p className="errorText">{error}</p> : null}

        <div className="footerActions">
          <button className="button" onClick={generate} disabled={isGenerating}>
            {isGenerating ? '案件を生成中...' : '公開向け案件ページを作る'}
          </button>
          {session.generated ? <Link href={`/cases/${id}`}>最新の案件ページを見る</Link> : null}
        </div>
      </section>
    </div>
  );
}
