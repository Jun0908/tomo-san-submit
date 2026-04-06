export const STAFF_SESSION_COOKIE = 'staff_mock_session';
export const MOCK_STAFF_ID = 'staff';
export const MOCK_STAFF_PASSWORD = 'tomo2026';
const STAFF_SESSION_VALUE = 'authenticated';

export function isValidStaffSession(value: string | undefined): boolean {
  return value === STAFF_SESSION_VALUE;
}

export function validateMockStaffCredentials(id: string, password: string): boolean {
  return id === MOCK_STAFF_ID && password === MOCK_STAFF_PASSWORD;
}

export function getStaffSessionValue(): string {
  return STAFF_SESSION_VALUE;
}
