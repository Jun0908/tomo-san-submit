'use client';

export type Message = { role: 'user' | 'agent'; text: string };
export type Session = { id: string; title: string; createdAt: string; messages: Message[]; generated?: { id: string; title: string; summary: string; } };

const SESSION_KEY = 'tomo-sessions';

export const loadSessions = (): Session[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; }
};

export const saveSessions = (sessions: Session[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
};

export const createSession = (): Session => {
  const id = Date.now().toString();
  return { id, title: `会話 ${new Date().toLocaleString()}`, createdAt: new Date().toISOString(), messages: [] };
};
