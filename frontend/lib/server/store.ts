import { promises as fs } from 'fs';
import path from 'path';

import { appendMessage, buildIntakeDraft, createInitialSession } from '@/lib/server/mock-intake';
import { getOpenClawPublicCase, ingestOpenClawCaseDraft } from '@/lib/server/openclaw-bridge';
import type { ApiCaseRecord, Session } from '@/lib/types';

type StoreShape = {
  sessions: Session[];
};

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'public-intake.json');

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialState: StoreShape = { sessions: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialState, null, 2), 'utf8');
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw) as Partial<StoreShape>;
  return {
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
  };
}

async function writeStore(store: StoreShape): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function listStoredSessions(): Promise<Session[]> {
  const store = await readStore();
  return [...store.sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function createStoredSession(): Promise<Session> {
  const store = await readStore();
  const session = createInitialSession();
  store.sessions.unshift(session);
  await writeStore(store);
  return session;
}

export async function getStoredSession(id: string): Promise<Session | null> {
  const store = await readStore();
  return store.sessions.find((session) => session.id === id) ?? null;
}

export async function addStoredMessage(id: string, message: string): Promise<Session | null> {
  const store = await readStore();
  const index = store.sessions.findIndex((session) => session.id === id);

  if (index === -1) {
    return null;
  }

  const updated = appendMessage(store.sessions[index], message);
  store.sessions[index] = updated;
  await writeStore(store);
  return updated;
}

export async function generateStoredCase(id: string): Promise<Session | null> {
  const store = await readStore();
  const index = store.sessions.findIndex((session) => session.id === id);

  if (index === -1) {
    return null;
  }

  const draft = buildIntakeDraft(store.sessions[index]);

  if (!draft.transcript) {
    throw new Error('相談内容がまだありません。');
  }

  const ingestResult = await ingestOpenClawCaseDraft(draft);
  const updated: Session = {
    ...store.sessions[index],
    updatedAt: ingestResult.publicCase.updatedAt,
    generated: ingestResult.publicCase,
    openClawCaseId: ingestResult.openClawCaseId,
    openClawPublicJsonPath: ingestResult.publicJsonPath,
  };
  store.sessions[index] = updated;
  await writeStore(store);
  return updated;
}

export async function getStoredCaseRecord(id: string): Promise<ApiCaseRecord | null> {
  const store = await readStore();
  const index = store.sessions.findIndex((session) => session.id === id);

  if (index === -1) {
    return null;
  }

  const session = store.sessions[index];

  if (session.openClawCaseId) {
    const latest = await getOpenClawPublicCase(session.openClawCaseId, session.openClawPublicJsonPath);

    if (latest) {
      store.sessions[index] = {
        ...session,
        updatedAt: latest.updatedAt,
        generated: latest,
      };
      await writeStore(store);

      return {
        sessionId: session.id,
        sessionTitle: session.title,
        case: latest,
      };
    }
  }

  if (!session.generated) {
    return null;
  }

  return {
    sessionId: session.id,
    sessionTitle: session.title,
    case: session.generated,
  };
}
