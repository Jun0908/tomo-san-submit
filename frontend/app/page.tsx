"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSession, loadSessions, saveSessions, Session } from '@/lib/session';

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => setSessions(loadSessions()), []);

  const start = () => {
    const newSession = createSession();
    const next = [newSession, ...sessions];
    setSessions(next);
    saveSessions(next);
    window.location.href = `/conversation/${newSession.id}`;
  };

  return (
    <div>
      <section className="card">
        <h2>トップページ</h2>
        <p>新しい会話を開始して成果物（行政メモ等）を生成します。</p>
        <button className="button" onClick={start}>新規会話開始</button>
      </section>
      <section className="card">
        <h3>過去セッション</h3>
        {sessions.length === 0 ? (
          <p>まだセッションがありません。</p>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} style={{ marginBottom: '0.5rem' }}>
                {s.id} - {s.title} - <Link href={`/conversation/${s.id}`}>続き</Link> | <Link href={`/cases/${s.id}`}>成果物</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
