import { NextResponse } from 'next/server';

import type { WorldVerification } from '@/lib/types';

type WorldVerifyRequest = {
  merkle_root?: string;
  nullifier_hash?: string;
  proof?: string;
  credential_type?: string;
  action?: string;
  signal?: string;
  demo?: boolean;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as WorldVerifyRequest;
  const action = process.env.WORLD_ACTION ?? 'create_citizen_case';
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY === 'true';

  if (payload.demo && demoEnabled) {
    const result: WorldVerification = {
      verified: true,
      nullifierHash: payload.nullifier_hash ?? `demo-${Date.now()}`,
      credentialType: payload.credential_type ?? 'demo',
      action,
      verifiedAt: new Date().toISOString(),
      demo: true,
    };
    return NextResponse.json(result);
  }

  const appId = process.env.WORLD_APP_ID;
  const verifyUrl = process.env.WORLD_VERIFY_API_URL;

  if (!appId || !verifyUrl) {
    return NextResponse.json(
      { error: 'World verification is not configured.' },
      { status: 500 },
    );
  }

  const response = await fetch(`${verifyUrl}/${appId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, action }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'World verification failed.' },
      { status: 401 },
    );
  }

  const result: WorldVerification = {
    verified: true,
    nullifierHash: payload.nullifier_hash,
    credentialType: payload.credential_type,
    action,
    verifiedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
