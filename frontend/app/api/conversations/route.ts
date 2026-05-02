import { NextResponse } from 'next/server';

import { createStoredSession, listStoredSessions } from '@/lib/server/store';
import type { WorldVerification } from '@/lib/types';

export async function GET() {
  const sessions = await listStoredSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    world?: WorldVerification;
  };

  const session = await createStoredSession({ world: body.world });
  return NextResponse.json(session, { status: 201 });
}
