import { promises as fs } from 'fs';

import { getTalkingVideoPath } from '@/lib/server/tomo-chat';

type Context = {
  params: { runId: string };
};

function parseRangeHeader(
  rangeHeader: string,
  fileSize: number,
): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) return null;

  return { start, end };
}

export async function GET(request: Request, { params }: Context) {
  try {
    const videoPath = await getTalkingVideoPath(params.runId);
    const stat = await fs.stat(videoPath);
    const fileSize = stat.size;
    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      const range = parseRangeHeader(rangeHeader, fileSize);

      if (!range) {
        return new Response('Invalid range', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const { start, end } = range;
      const chunkSize = end - start + 1;

      const fileHandle = await fs.open(videoPath, 'r');
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();

      return new Response(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'no-store',
        },
      });
    }

    const file = await fs.readFile(videoPath);
    return new Response(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(fileSize),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Video not found.', { status: 404 });
  }
}
