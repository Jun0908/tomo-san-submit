import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { listOpenClawPublicCases } from '@/lib/server/openclaw-bridge';
import { isValidStaffSession, STAFF_SESSION_COOKIE } from '@/lib/server/staff-auth';

export async function GET() {
  const sessionValue = cookies().get(STAFF_SESSION_COOKIE)?.value;

  if (!isValidStaffSession(sessionValue)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const cases = await listOpenClawPublicCases();
  return NextResponse.json(cases);
}
