import { NextResponse } from 'next/server';

import { buildTomoReply, getTalkingPhotoOptions, runTalkingPhoto } from '@/lib/server/tomo-chat';

export async function POST(request: Request) {
  const payload = (await request.json()) as { message?: string };
  const message = payload.message?.trim() ?? '';

  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  if (message.length > 280) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
  }

  const replyText = buildTomoReply(message);
  const talkingPhotoOptions = getTalkingPhotoOptions(message);

  try {
    const result = await runTalkingPhoto(replyText, talkingPhotoOptions);
    return NextResponse.json({
      replyText,
      runId: result.runId,
      videoUrl: `/api/tomo/runs/${result.runId}/video`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Talking photo generation failed.',
        replyText,
      },
      { status: 500 },
    );
  }
}
