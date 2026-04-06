export type MessageRole = 'user' | 'assistant';

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
};

export type PublicTimelineEntry = {
  status: string;
  message: string;
  createdAt: string;
};

export type PublicCase = {
  id: string;
  title: string;
  summary: string;
  statusPublic: string;
  latestPublicMessage: string;
  requiresUserInput: boolean;
  createdAt: string;
  updatedAt: string;
  area?: string;
  themeTags: string[];
  timeline: PublicTimelineEntry[];
};

export type IntakeDraftInput = {
  title: string;
  summary: string;
  transcript: string;
  location: string;
  tags: string[];
};

export type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  generated?: PublicCase;
  openClawCaseId?: string;
  openClawPublicJsonPath?: string;
};

export type ApiCaseRecord = {
  sessionId: string;
  sessionTitle: string;
  case: PublicCase;
};
