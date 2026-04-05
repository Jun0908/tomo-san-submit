import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const FRONTEND_ROOT = process.cwd();
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..');
const BACKEND_BATCH = path.join(REPO_ROOT, 'backend', 'run_talking_photo.bat');
const BACKEND_PYTHON = path.join(REPO_ROOT, 'backend', '.venv-sadtalker', 'Scripts', 'python.exe');
const SADTALKER_CHECKPOINTS = path.join(REPO_ROOT, 'backend', 'vendor', 'SadTalker', 'checkpoints');
const OUTPUTS_ROOT = path.join(REPO_ROOT, 'outputs');

type TalkingVideoResult = {
  runId: string;
  videoPath: string;
};

type TomoLanguage = 'ja' | 'en';

type TalkingPhotoOptions = {
  rate?: string;
  voice?: string;
};

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}...`;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function validateTalkingPhotoRuntime(): Promise<void> {
  const missing: string[] = [];

  if (!(await pathExists(BACKEND_BATCH))) {
    missing.push('backend/run_talking_photo.bat');
  }

  if (!(await pathExists(BACKEND_PYTHON))) {
    missing.push('backend/.venv-sadtalker/Scripts/python.exe');
  }

  if (!(await pathExists(SADTALKER_CHECKPOINTS))) {
    missing.push('backend/vendor/SadTalker/checkpoints');
  }

  if (missing.length > 0) {
    throw new Error(
      `Talking Photo runtime is missing required files: ${missing.join(', ')}`,
    );
  }
}

export function detectTomoLanguage(message: string): TomoLanguage {
  const normalized = message.trim();
  if (!normalized) {
    return 'ja';
  }

  const japaneseChars = normalized.match(/[\u3040-\u30ff\u3400-\u9fff]/g)?.length ?? 0;
  const latinChars = normalized.match(/[A-Za-z]/g)?.length ?? 0;

  if (japaneseChars > 0) {
    return 'ja';
  }

  if (latinChars > 0) {
    return 'en';
  }

  return 'ja';
}

function getTopicSnippet(message: string, language: TomoLanguage): string {
  const maxLength = language === 'ja' ? 20 : 30;
  return clip(message.trim().replace(/\s+/g, ' '), maxLength);
}

export function buildTomoReply(message: string): string {
  const normalized = message.trim();
  const language = detectTomoLanguage(normalized);

  if (!normalized) {
    return language === 'ja'
      ? 'こんにちは。今日は何を相談しますか。'
      : 'Hello. What would you like to discuss today?';
  }

  const topic = getTopicSnippet(normalized, language);

  if (language === 'ja') {
    if (normalized.includes('通学') || normalized.includes('安全')) {
      return `${topic}ですね。要点を整理して次の一歩を考えましょう。`;
    }

    if (normalized.includes('困') || normalized.includes('生活')) {
      return `${topic}の件、まず一番困っている点を整理しましょう。`;
    }

    if (normalized.includes('政策') || normalized.includes('提案')) {
      return `${topic}を政策案として短く整理しましょう。`;
    }

    return `${topic}の件、要点を一緒に整理しましょう。`;
  }

  const lower = normalized.toLowerCase();
  if (lower.includes('safety') || lower.includes('school')) {
    return `I got it. Let us sort the safety points on ${topic}.`;
  }

  if (lower.includes('policy') || lower.includes('proposal')) {
    return `I got it. Let us turn ${topic} into a short policy outline.`;
  }

  return `I got it. Let us sort the key points on ${topic}.`;
}

export function getTalkingPhotoOptions(message: string): TalkingPhotoOptions {
  const language = detectTomoLanguage(message);

  if (language === 'ja') {
    return {
      voice: 'ja-JP-NanamiNeural',
      rate: '+35%',
    };
  }

  return {
    voice: 'en-US-JennyNeural',
    rate: '+35%',
  };
}

function parseVideoPath(stdout: string, stderr: string): string | null {
  const combined = `${stdout}\n${stderr}`;
  const doneMatch = combined.match(/Done:\s*(.+talking-head\.mp4)/i);
  if (doneMatch) {
    return doneMatch[1].trim();
  }

  const generatedMatch = combined.match(/The generated video is named:\s*(.+?\.mp4)/i);
  return generatedMatch ? generatedMatch[1].trim() : null;
}

export async function runTalkingPhoto(
  text: string,
  options: TalkingPhotoOptions = {},
): Promise<TalkingVideoResult> {
  await validateTalkingPhotoRuntime();
  await fs.mkdir(OUTPUTS_ROOT, { recursive: true });

  return new Promise((resolve, reject) => {
    const args = ['/c', BACKEND_BATCH, '--text', text, '--still'];
    if (options.voice) {
      args.push('--voice', options.voice);
    }
    if (options.rate) {
      args.push('--rate', options.rate);
    }

    const child = spawn('cmd.exe', args, {
      cwd: REPO_ROOT,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || 'Talking Photo generation failed.'));
        return;
      }

      const rawVideoPath = parseVideoPath(stdout, stderr);
      if (!rawVideoPath) {
        reject(new Error('Could not determine the generated video path.'));
        return;
      }

      const videoPath = path.isAbsolute(rawVideoPath)
        ? rawVideoPath
        : path.resolve(REPO_ROOT, rawVideoPath);
      const runId = path.basename(path.dirname(videoPath));

      try {
        await fs.access(videoPath);
        resolve({ runId, videoPath });
      } catch {
        reject(new Error(`Generated video was not found: ${videoPath}`));
      }
    });
  });
}

export async function getTalkingVideoPath(runId: string): Promise<string> {
  const videoPath = path.join(OUTPUTS_ROOT, runId, 'talking-head.mp4');
  await fs.access(videoPath);
  return videoPath;
}
