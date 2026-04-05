import { NextResponse } from 'next/server';

import { getStoredCaseRecord } from '@/lib/server/store';

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  const record = await getStoredCaseRecord(params.id);

  if (!record) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 });
  }

  return NextResponse.json(record);
}
