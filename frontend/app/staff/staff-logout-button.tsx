'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogout = async () => {
    setIsSubmitting(true);

    try {
      await fetch('/api/staff/logout', { method: 'POST' });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button className="button" type="button" onClick={onLogout} disabled={isSubmitting}>
      {isSubmitting ? 'ログアウト中...' : 'ログアウト'}
    </button>
  );
}
