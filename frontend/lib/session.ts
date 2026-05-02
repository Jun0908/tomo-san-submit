'use client';

import type { ApiCaseRecord, Session, WorldVerification } from '@/lib/types';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Request failed.';

    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error ?? message;
    } catch {
      // Keep the generic message when the response body is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function listSessions(): Promise<Session[]> {
  return request<Session[]>('/api/conversations');
}

export async function createSession(input?: {
  world?: WorldVerification;
}): Promise<Session> {
  return request<Session>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(input ?? {}),
  });
}

export async function getSession(id: string): Promise<Session> {
  return request<Session>(`/api/conversations/${id}`);
}

export async function sendSessionMessage(id: string, message: string): Promise<Session> {
  return request<Session>(`/api/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function generateSessionCase(id: string): Promise<Session> {
  return request<Session>(`/api/conversations/${id}/generate`, {
    method: 'POST',
  });
}

export async function getCase(id: string): Promise<ApiCaseRecord> {
  return request<ApiCaseRecord>(`/api/cases/${id}`);
}
