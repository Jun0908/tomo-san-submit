import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import type { IntakeDraftInput, PublicCase, PublicTimelineEntry } from '@/lib/types';

type OpenClawPublicTimelineEntry = {
  status?: string;
  message?: string;
  created_at?: string;
};

type OpenClawPublicCaseRecord = {
  id?: string;
  title?: string;
  summary?: string;
  location?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  status_public?: string;
  latest_public_message?: string;
  requires_user_input?: boolean;
  public_timeline?: OpenClawPublicTimelineEntry[];
};

type OpenClawIngestPayload = {
  case?: {
    id?: string;
  };
  public_case?: OpenClawPublicCaseRecord;
  related_cases?: unknown[];
  related_public_info?: unknown[];
  files?: {
    markdown?: string;
    json?: string;
    public_json?: string;
  };
  ingested_at?: string;
  warnings?: string[];
};

export type OpenClawIngestResult = {
  publicCase: PublicCase;
  openClawCaseId: string;
  publicJsonPath?: string;
  rawPayload: OpenClawIngestPayload;
};

const DEFAULT_OPENCLAW_ROOT = path.resolve(process.cwd(), '..', 'agents-OpenClaw');

function getOpenClawRoot(): string {
  return process.env.OPENCLAW_DATA_ROOT || DEFAULT_OPENCLAW_ROOT;
}

function getOpenClawCasesPublicDir(): string {
  return process.env.OPENCLAW_CASES_PUBLIC_DIR || path.join(getOpenClawRoot(), 'data', 'cases_public');
}

function getOpenClawCaseIngestScript(): string {
  return process.env.OPENCLAW_CASE_INGEST_SCRIPT || path.join(getOpenClawRoot(), 'scripts', 'case_ingest.py');
}

function getOpenClawPythonBin(): string {
  if (process.env.OPENCLAW_PYTHON_BIN) {
    return process.env.OPENCLAW_PYTHON_BIN;
  }

  if (process.platform === 'win32') {
    const bundledPython = path.join(getOpenClawRoot(), '.venv', 'Scripts', 'python.exe');
    return bundledPython;
  }

  return path.join(getOpenClawRoot(), '.venv', 'bin', 'python');
}

async function fileExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function resolvePythonBin(): Promise<string> {
  const preferred = getOpenClawPythonBin();

  if (await fileExists(preferred)) {
    return preferred;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

function normalizeText(value: string | undefined, fallback = ''): string {
  return value?.trim() || fallback;
}

function normalizeTimeline(
  timeline: OpenClawPublicTimelineEntry[] | undefined,
  fallbackStatus: string,
  fallbackMessage: string,
  fallbackCreatedAt: string,
): PublicTimelineEntry[] {
  const items = Array.isArray(timeline) ? timeline : [];

  if (items.length === 0) {
    return [
      {
        status: fallbackStatus,
        message: fallbackMessage,
        createdAt: fallbackCreatedAt,
      },
    ];
  }

  return items.map((entry) => ({
    status: normalizeText(entry.status, fallbackStatus),
    message: normalizeText(entry.message, fallbackMessage),
    createdAt: normalizeText(entry.created_at, fallbackCreatedAt),
  }));
}

export function mapOpenClawPublicCase(record: OpenClawPublicCaseRecord): PublicCase {
  const createdAt = normalizeText(record.created_at, new Date().toISOString());
  const updatedAt = normalizeText(record.updated_at, createdAt);
  const statusPublic = normalizeText(record.status_public, '受付済み');
  const latestPublicMessage = normalizeText(
    record.latest_public_message,
    'ご相談を受け付けました。内容の整理を始めています。',
  );

  return {
    id: normalizeText(record.id),
    title: normalizeText(record.title, '無題の案件'),
    summary: normalizeText(record.summary),
    statusPublic,
    latestPublicMessage,
    requiresUserInput: Boolean(record.requires_user_input),
    createdAt,
    updatedAt,
    area: normalizeText(record.location) || undefined,
    themeTags: Array.isArray(record.tags) ? record.tags.filter(Boolean) : [],
    timeline: normalizeTimeline(record.public_timeline, statusPublic, latestPublicMessage, updatedAt),
  };
}

async function readJsonFile<T>(targetPath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(targetPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function resolvePublicJsonPath(publicJsonPath: string | undefined): string | null {
  if (!publicJsonPath?.trim()) {
    return null;
  }

  if (path.isAbsolute(publicJsonPath)) {
    return publicJsonPath;
  }

  return path.join(getOpenClawRoot(), publicJsonPath);
}

async function listPublicCaseFiles(): Promise<string[]> {
  const publicDir = getOpenClawCasesPublicDir();

  try {
    const entries = await fs.readdir(publicDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'latest.json')
      .map((entry) => path.join(publicDir, entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function listOpenClawPublicCases(): Promise<PublicCase[]> {
  const latestPath = path.join(getOpenClawCasesPublicDir(), 'latest.json');
  const records = await readJsonFile<OpenClawPublicCaseRecord[]>(latestPath);

  if (!records) {
    const filePaths = await listPublicCaseFiles();
    const items = await Promise.all(
      filePaths.map(async (filePath) => readJsonFile<OpenClawPublicCaseRecord>(filePath)),
    );

    return items
      .filter((item): item is OpenClawPublicCaseRecord => Boolean(item?.id))
      .map(mapOpenClawPublicCase)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  return records
    .map(mapOpenClawPublicCase)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getOpenClawPublicCase(
  caseId: string,
  publicJsonPath?: string,
): Promise<PublicCase | null> {
  const resolvedPath = resolvePublicJsonPath(publicJsonPath);

  if (resolvedPath) {
    const record = await readJsonFile<OpenClawPublicCaseRecord>(resolvedPath);

    if (record?.id === caseId) {
      return mapOpenClawPublicCase(record);
    }
  }

  const latestRecords = await readJsonFile<OpenClawPublicCaseRecord[]>(
    path.join(getOpenClawCasesPublicDir(), 'latest.json'),
  );
  const fromLatest = latestRecords?.find((item) => item.id === caseId);

  if (fromLatest) {
    return mapOpenClawPublicCase(fromLatest);
  }

  const filePaths = await listPublicCaseFiles();

  for (const filePath of filePaths) {
    const record = await readJsonFile<OpenClawPublicCaseRecord>(filePath);

    if (record?.id === caseId) {
      return mapOpenClawPublicCase(record);
    }
  }

  return null;
}

async function runOpenClawIngest(
  args: string[],
  transcript: string,
): Promise<{ stdout: string; stderr: string }> {
  const pythonBin = await resolvePythonBin();
  const openClawRoot = getOpenClawRoot();

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, args, {
      cwd: openClawRoot,
      env: {
        ...process.env,
        OPENCLAW_DATA_ROOT: process.env.OPENCLAW_DATA_ROOT || openClawRoot,
      },
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          normalizeText(stderr) ||
            normalizeText(stdout) ||
            `OpenClaw ingest exited with code ${String(code)}.`,
        ),
      );
    });

    child.stdin.write(transcript);
    child.stdin.end();
  });
}

export async function ingestOpenClawCaseDraft(
  input: IntakeDraftInput,
): Promise<OpenClawIngestResult> {
  const title = normalizeText(input.title);
  const summary = normalizeText(input.summary);
  const transcript = normalizeText(input.transcript);
  const location = normalizeText(input.location);
  const tags = Array.isArray(input.tags) ? input.tags.filter(Boolean) : [];

  if (!transcript) {
    throw new Error('相談内容がまだありません。');
  }

  const args = [getOpenClawCaseIngestScript(), '--json'];

  if (title) {
    args.push('--title', title);
  }

  if (summary) {
    args.push('--summary', summary);
  }

  if (location) {
    args.push('--location', location);
  }

  if (tags.length > 0) {
    args.push('--tags', tags.join(','));
  }

  const { stdout } = await runOpenClawIngest(args, transcript);
  let payload: OpenClawIngestPayload;

  try {
    payload = JSON.parse(stdout) as OpenClawIngestPayload;
  } catch {
    throw new Error('OpenClaw から案件 JSON を受け取れませんでした。');
  }

  if (!payload.public_case?.id) {
    throw new Error('OpenClaw の案件生成結果に公開案件 ID がありません。');
  }

  return {
    publicCase: mapOpenClawPublicCase(payload.public_case),
    openClawCaseId: payload.public_case.id,
    publicJsonPath: payload.files?.public_json,
    rawPayload: payload,
  };
}
