import { promises as fs } from 'fs';

import { getTalkingVideoPath } from '@/lib/server/tomo-chat';

type Context = {
  params: { runId: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const videoPath = await getTalkingVideoPath(params.runId);
    const file = await fs.readFile(videoPath);
    return new Response(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Video not found.', { status: 404 });
  }
}
