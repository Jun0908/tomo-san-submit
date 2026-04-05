'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getCase } from '@/lib/session';
import type { ApiCaseRecord } from '@/lib/types';

type Props = { params: { id: string } };

export default function CasePage({ params }: Props) {
  const id = params.id;
  const [record, setRecord] = useState<ApiCaseRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void getCase(id)
      .then((current) => {
        if (active) {
          setRecord(current);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : '案件データを取得できませんでした。');
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (!record) {
    return (
      <div className="card">
        <h2>案件が見つかりません</h2>
        <p className="mutedText">先に相談ページから案件を生成してください。</p>
        {error ? <p className="errorText">{error}</p> : null}
        <p>
          <Link href={`/conversation/${id}`}>会話ページへ戻る</Link>
        </p>
      </div>
    );
  }

  const generated = record.case;

  const onDownload = () => {
    const blob = new Blob([generated.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${generated.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Public Case</span>
            <h2>{generated.title}</h2>
          </div>
          <span className={`statusBadge status-${generated.statusPublic}`}>
            {generated.statusPublic}
          </span>
        </div>

        <p className="mutedText">元の相談: {record.sessionTitle}</p>
        <p className="publicMessage">{generated.latestPublicMessage}</p>

        <div className="metaGrid">
          <div className="metaCard">
            <span className="metaLabel">想定エリア</span>
            <strong>{generated.area ?? '要確認'}</strong>
          </div>
          <div className="metaCard">
            <span className="metaLabel">追加情報</span>
            <strong>{generated.requiresUserInput ? '必要' : '今は不要'}</strong>
          </div>
          <div className="metaCard">
            <span className="metaLabel">公開テーマ</span>
            <strong>{generated.themeTags.length > 0 ? generated.themeTags.join(' / ') : '整理中'}</strong>
          </div>
        </div>

        <div className="twoColumn">
          <div className="helperCard">
            <h3>公開向け要約</h3>
            <pre className="summaryBlock">{generated.summary}</pre>
          </div>

          <div className="helperCard">
            <h3>進行状況</h3>
            <ol className="timelineList">
              {generated.timeline.map((item) => (
                <li key={`${item.status}-${item.createdAt}`} className="timelineItem">
                  <div className="timelineDot" />
                  <div>
                    <div className="timelineHeader">
                      <strong>{item.status}</strong>
                      <span className="mutedText">
                        {new Date(item.createdAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <p className="mutedText">{item.message}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="footerActions">
          <button className="button" onClick={onDownload}>要約をダウンロード</button>
          <Link href={`/conversation/${id}`}>会話ページへ戻る</Link>
        </div>
      </section>
    </div>
  );
}
