import { NextResponse } from 'next/server';

import {
  getStaffSessionValue,
  MOCK_STAFF_ID,
  MOCK_STAFF_PASSWORD,
  STAFF_SESSION_COOKIE,
  validateMockStaffCredentials,
} from '@/lib/server/staff-auth';

export async function POST(request: Request) {
  const payload = (await request.json()) as { id?: string; password?: string };
  const id = payload.id?.trim() ?? '';
  const password = payload.password?.trim() ?? '';

  if (!id || !password) {
    return NextResponse.json(
      { error: 'ID とパスワードを入力してください。' },
      { status: 400 },
    );
  }

  if (!validateMockStaffCredentials(id, password)) {
    return NextResponse.json(
      {
        error: 'ID またはパスワードが違います。',
        hint: {
          id: MOCK_STAFF_ID,
          password: MOCK_STAFF_PASSWORD,
        },
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: STAFF_SESSION_COOKIE,
    value: getStaffSessionValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}
