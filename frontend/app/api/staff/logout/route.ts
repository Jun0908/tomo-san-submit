import { NextResponse } from 'next/server';

import { STAFF_SESSION_COOKIE } from '@/lib/server/staff-auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: STAFF_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 0,
  });
  return response;
}
