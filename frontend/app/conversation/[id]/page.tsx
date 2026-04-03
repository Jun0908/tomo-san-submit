"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { loadSessions, saveSessions, Session } from '@/lib/session';

type Props = { params: { id: string } };

export default function ConversationPage({ params }: Props) {
  const id = params.id;
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessions = loadSessions();
    const found = sessions.find((s) => s.id === id);
    if (!found) return;
    setSession(found);
  }, [id]);

  const sessions = useMemo(() => loadSessions(), [session]);

  const updateSession = (next: Session) => {
    const nextList = sessions.map((s) => (s.id === next.id ? next : s));
    saveSessions(nextList);
    setSession(next);
  };

  if (!session) {
    return (
      <div className="card">
        <h2>会話が見つかりません</h2>
        <p><a href="/">トップへ</a></p>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!message.trim()) return;
    const nextSession: Session = {
      ...session,
      messages: [...session.messages, { role: 'user', text: message.trim() }, { role: 'agent', text: 'AIが応答中…' }],
    };
    setMessage('');
    updateSession(nextSession);

    await new Promise((r) => setTimeout(r, 700));
    const ai = `（モック応答）「${message.trim()}」について検討しました。成果物に反映します。`;
    const written: Session = {
      ...nextSession,
      messages: [...nextSession.messages.slice(0, -1), { role: 'agent', text: ai }],
    };
    updateSession(written);
  };

  const generate = () => {
    const summary = session.messages
      .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.text}`)
      .join('\n');

    const generated = {
      id: `case-${session.id}`,
      title: `${session.title} の成果物`,
      summary: `会話から生成された成果物（モック）\n\n${summary}`,
    };
    const nextSession: Session = { ...session, generated };
    updateSession(nextSession);
    router.push(`/cases/${session.id}`);
  };

  return (
    <div>
      <section className="card">
        <h2>会話ページ</h2>
        <p>セッション: {session.title}</p>
        <div className="chatLogs">
          {session.messages.length === 0 ? <p>メッセージはまだありません。</p> : session.messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>{m.role === 'user' ? 'ユーザー' : 'AI'}: {m.text}</div>
          ))}
        </div>
        <div className="inputRow">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="メッセージを入力" />
          <button className="button" onClick={sendMessage}>送信</button>
        </div>
        <button className="button" style={{ marginTop: '1rem' }} onClick={generate}>成果物を生成</button>
      </section>
    </div>
  );
}
