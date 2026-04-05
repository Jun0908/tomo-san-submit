import { NextResponse } from 'next/server';

import { generateStoredCase } from '@/lib/server/store';

type Context = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: Context) {
  const session = await generateStoredCase(params.id);

  if (!session) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  return NextResponse.json(session);
}
