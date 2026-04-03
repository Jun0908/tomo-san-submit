"use client";

import { useEffect, useState } from 'react';
import { loadSessions, Session } from '@/lib/session';

type Props = { params: { id: string } };

export default function CasePage({ params }: Props) {
  const id = params.id;
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = loadSessions().find((s) => s.id === id) || null;
    setSession(s);
  }, [id]);

  if (!session) {
    return (
      <div className="card">
        <h2>案件が見つかりません</h2>
        <p><a href="/">トップへ</a></p>
      </div>
    );
  }

  const generated = session.generated;

  if (!generated) {
    return (
      <div className="card">
        <h2>成果物が生成されていません</h2>
        <p><a href={`/conversation/${id}`}>会話ページ</a> から成果物生成を実行してください。</p>
      </div>
    );
  }

  const onDownload = () => {
    const blob = new Blob([generated.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generated.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <section className="card">
        <h2>生成された案件ページ</h2>
        <h3>{generated.title}</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{generated.summary}</pre>
        <button className="button" onClick={onDownload}>ダウンロード（TXT）</button>
      </section>
    </div>
  );
}
