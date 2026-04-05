'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { createSession, listSessions } from '@/lib/session';
import type { Session } from '@/lib/types';

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void listSessions()
      .then((items) => {
        if (active) {
          setSessions(items);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '会話一覧を取得できませんでした。');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const start = async () => {
    setIsCreating(true);
    setError('');

    try {
      const session = await createSession();
      window.location.href = `/conversation/${session.id}`;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '新しい相談を開始できませんでした。');
      setIsCreating(false);
    }
  };

  return (
    <div>
      <section className="card heroCard">
        <span className="eyebrow">Public Intake MVP</span>
        <h2>相談を受け付け、公開できる範囲の進行状況まで返す</h2>
        <p className="lede">
          既存の自動返信で終わらせず、相談内容を整理して案件化し、公開ユーザーには必要十分なステータスだけを返すためのフロントです。
        </p>
        <div className="heroActions">
          <button className="button" onClick={start} disabled={isCreating}>
            {isCreating ? '相談を準備中...' : '新しい相談を始める'}
          </button>
          <Link className="textLink" href="/tomo">
            Tomoさんと話す
          </Link>
          <Link className="textLink" href="/staff">
            スタッフ画面の入口を見る
          </Link>
        </div>
        {error ? <p className="errorText">{error}</p> : null}
      </section>

      <section className="card">
        <h3>この MVP で優先すること</h3>
        <ul className="featureList">
          <li>公開ユーザーには相談整理と公開ステータスだけを見せる</li>
          <li>内部情報や Google 連携はここから直接触らせない</li>
          <li>案件ページで「無視されていない」と分かる状態を作る</li>
        </ul>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <h3>最近の相談セッション</h3>
          <span className="mutedText">{sessions.length} 件</span>
        </div>
        {sessions.length === 0 ? (
          <p className="mutedText">まだ相談セッションはありません。</p>
        ) : (
          <ul className="sessionList">
            {sessions.map((session) => (
              <li key={session.id} className="sessionListItem">
                <div>
                  <p className="sessionTitle">{session.title}</p>
                  <p className="mutedText">
                    更新: {new Date(session.updatedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="sessionLinks">
                  <Link href={`/conversation/${session.id}`}>会話</Link>
                  <Link href={`/cases/${session.id}`}>案件ページ</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
