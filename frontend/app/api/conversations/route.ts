import { NextResponse } from 'next/server';

import { createStoredSession, listStoredSessions } from '@/lib/server/store';

export async function GET() {
  const sessions = await listStoredSessions();
  return NextResponse.json(sessions);
}

export async function POST() {
  const session = await createStoredSession();
  return NextResponse.json(session, { status: 201 });
}
