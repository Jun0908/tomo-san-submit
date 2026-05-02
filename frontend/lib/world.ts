'use client';

import type { WorldVerification } from '@/lib/types';

export async function verifyHumanWithWorld(): Promise<WorldVerification> {
  // TODO: Replace demo payload with Human Badge / World ID SDK result.
  const demoPayload = {
    demo: true,
    nullifier_hash: `demo-human-${Date.now()}`,
    credential_type: 'demo',
  };

  const response = await fetch('/api/world/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoPayload),
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = '人間確認に失敗しました。';
    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error ?? message;
    } catch {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<WorldVerification>;
}
