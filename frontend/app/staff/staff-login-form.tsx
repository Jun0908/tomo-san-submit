'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type StaffLoginFormProps = {
  defaultId: string;
  defaultPassword: string;
};

export default function StaffLoginForm({
  defaultId,
  defaultPassword,
}: StaffLoginFormProps) {
  const router = useRouter();
  const [id, setId] = useState(defaultId);
  const [password, setPassword] = useState(defaultPassword);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? 'ログインに失敗しました。');
        return;
      }

      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ログインに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="staffForm" onSubmit={onSubmit}>
      <label className="staffField">
        <span className="metaLabel">スタッフ ID</span>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          placeholder="staff-demo"
          autoComplete="username"
          disabled={isSubmitting}
        />
      </label>

      <label className="staffField">
        <span className="metaLabel">パスワード</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="tomo2026-demo"
          autoComplete="current-password"
          disabled={isSubmitting}
        />
      </label>

      <div className="footerActions">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'ログイン中...' : 'スタッフ画面へ入る'}
        </button>
      </div>

      {error ? <p className="errorText">{error}</p> : null}
    </form>
  );
}
