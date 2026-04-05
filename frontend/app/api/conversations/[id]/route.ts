import { NextResponse } from 'next/server';

import { getStoredSession } from '@/lib/server/store';

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  const session = await getStoredSession(params.id);

  if (!session) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  return NextResponse.json(session);
}
