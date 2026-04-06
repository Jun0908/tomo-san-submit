import type { IntakeDraftInput, Message, PublicCase, PublicTimelineEntry, Session } from '@/lib/types';

function nowIso(): string {
  return new Date().toISOString();
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function collectUserText(messages: Message[]): string {
  return messages
    .filter((message) => message.role === 'user')
    .map((message) => message.text)
    .join('\n');
}

function detectArea(text: string): string | undefined {
  const match = text.match(/([^\s、。,.\n]{2,20}(?:市|区|町|村|地区|学校|駅|通り))/u);
  return match?.[1];
}

function detectThemes(text: string): string[] {
  const mapping: Array<[string, string[]]> = [
    ['交通安全', ['通学路', '横断歩道', '信号', '道路', '交通', '危険']],
    ['子育て', ['子育て', '保育', '保護者', '子ども', '児童']],
    ['教育', ['学校', '教育', '先生', '学級', '通学']],
    ['防災', ['防災', '避難', '浸水', '災害', '地震']],
    ['福祉', ['介護', '福祉', '高齢', '障害', '支援']],
    ['地域課題', ['地域', '住民', '自治会', '町内会', '近所']],
  ];

  return mapping
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([theme]) => theme)
    .slice(0, 3);
}

function buildTitle(text: string, area?: string): string {
  const headline = clip(text.replace(/\s+/g, ' ').trim(), 28) || '新しい相談';
  return area ? `${area}に関する相談` : headline;
}

export function buildIntakeDraft(session: Session): IntakeDraftInput {
  const transcript = collectUserText(session.messages).trim();
  const location = detectArea(transcript) ?? '';
  const tags = detectThemes(transcript);

  return {
    title: buildTitle(transcript || session.title, location || undefined),
    summary: clip(transcript || session.title, 180),
    transcript,
    location,
    tags,
  };
}

function buildAssistantReply(session: Session, message: string): string {
  const normalized = message.trim();
  const fullText = collectUserText([
    ...session.messages,
    {
      id: 'preview',
      role: 'user',
      text: normalized,
      createdAt: nowIso(),
    },
  ]);
  const area = detectArea(fullText);
  const themes = detectThemes(fullText);

  if (!area) {
    return 'ご相談ありがとうございます。内容を整理するため、場所が分かる地名や施設名があれば教えてください。';
  }

  if (normalized.length < 40) {
    return `${area}の件、受け取りました。状況を具体化したいので、いつ頃から困っているか、どんな影響が出ているかをもう少し教えてください。`;
  }

  if (themes.length === 0) {
    return `${area}のご相談として整理を始めます。今の内容を案件化しつつ、必要なら追加確認をお願いできるよう準備します。`;
  }

  return `${area}のご相談として整理します。想定テーマは ${themes.join('・')} です。公開向けの案件メモにまとめられる段階まで来ています。`;
}

function buildTimeline(
  createdAt: string,
  updatedAt: string,
  statusPublic: string,
  latestPublicMessage: string,
): PublicTimelineEntry[] {
  return [
    {
      status: '受付済み',
      message: 'ご相談を受け付けました。内容の整理を始めています。',
      createdAt,
    },
    {
      status: statusPublic,
      message: latestPublicMessage,
      createdAt: updatedAt,
    },
  ];
}

export function buildPublicCase(session: Session): PublicCase {
  const draft = buildIntakeDraft(session);
  const transcript = draft.transcript;
  const area = draft.location || undefined;
  const themeTags = draft.tags;
  const requiresUserInput = !area || transcript.length < 80;
  const updatedAt = nowIso();
  const statusPublic = requiresUserInput ? '追加情報待ち' : '確認中';
  const latestPublicMessage = requiresUserInput
    ? '案件化を進めています。場所や状況の補足があると、より具体的に確認できます。'
    : '案件として整理し、公開情報や関連論点との照合を進めています。';
  const summaryLines = [
    '相談概要',
    clip(transcript || 'まだ相談内容がありません。', 180),
    '',
    `想定テーマ: ${themeTags.length > 0 ? themeTags.join(' / ') : '要確認'}`,
    `想定エリア: ${area ?? '要確認'}`,
    `次の状態: ${statusPublic}`,
  ];

  return {
    id: `case-${session.id}`,
    title: draft.title,
    summary: summaryLines.join('\n'),
    statusPublic,
    latestPublicMessage,
    requiresUserInput,
    createdAt: session.createdAt,
    updatedAt,
    area,
    themeTags,
    timeline: buildTimeline(session.createdAt, updatedAt, statusPublic, latestPublicMessage),
  };
}

export function createInitialSession(): Session {
  const timestamp = Date.now().toString();
  const now = nowIso();

  return {
    id: timestamp,
    title: `相談 ${new Date(now).toLocaleString('ja-JP')}`,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function appendMessage(session: Session, message: string): Session {
  const now = nowIso();
  const trimmed = message.trim();
  const userMessage: Message = {
    id: `${session.id}-user-${session.messages.length + 1}`,
    role: 'user',
    text: trimmed,
    createdAt: now,
  };
  const assistantMessage: Message = {
    id: `${session.id}-assistant-${session.messages.length + 2}`,
    role: 'assistant',
    text: buildAssistantReply(session, trimmed),
    createdAt: nowIso(),
  };

  return {
    ...session,
    updatedAt: assistantMessage.createdAt,
    messages: [...session.messages, userMessage, assistantMessage],
  };
}
