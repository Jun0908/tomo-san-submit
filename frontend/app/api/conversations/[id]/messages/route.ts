import { NextResponse } from 'next/server';

import { addStoredMessage } from '@/lib/server/store';

type Context = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Context) {
  const payload = (await request.json()) as { message?: string };
  const message = payload.message?.trim();

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  const session = await addStoredMessage(params.id, message);

  if (!session) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  return NextResponse.json(session);
}
