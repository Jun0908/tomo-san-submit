import { NextResponse } from 'next/server';

import { generateStoredCase } from '@/lib/server/store';

type Context = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: Context) {
  try {
    const session = await generateStoredCase(params.id);

    if (!session) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Case generation failed.';
    const status = message === '相談内容がまだありません。' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
