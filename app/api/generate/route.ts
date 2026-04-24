import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { runBallTrail } from '@/lib/modalClient';
import { recordCard } from '@/lib/recordCard';
import { recordAppFrame } from '@/lib/recordAppFrame';
import { stitchClips } from '@/lib/stitch';
import { trimVideo } from '@/lib/trim';

export const runtime = 'nodejs';
export const maxDuration = 900;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('video');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'No video uploaded' }, { status: 400 });
  }

  const jobId = randomUUID().slice(0, 8);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `footskill-${jobId}-`));
  const rawInputPath = path.join(tmp, 'input.mp4');
  const trimmedPath = path.join(tmp, 'trimmed.mp4');
  const ballTrailPath = path.join(tmp, 'ball_trail.mp4');
  const ballTrailFramedPath = path.join(tmp, 'ball_trail_framed.mp4');
  const cardPath = path.join(tmp, 'card.mp4');
  const finalPath = path.join(tmp, 'final.mp4');

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = (file as any).type || 'video/mp4';
    const filename = (file as any).name || 'input.mp4';

    const start = parseFloat((form.get('start') as string) || '0');
    const end = parseFloat((form.get('end') as string) || '8');

    await fs.writeFile(rawInputPath, buffer);
    console.log(`[${jobId}] uploaded ${buffer.length} bytes, trimming [${start.toFixed(2)}s, ${end.toFixed(2)}s]...`);
    await trimVideo(rawInputPath, trimmedPath, start, end);
    const trimmedBuf = await fs.readFile(trimmedPath);
    console.log(`[${jobId}] trimmed to ${trimmedBuf.length} bytes, calling Modal...`);

    const ballTrailBuf = await runBallTrail(trimmedBuf, 'video/mp4', 'trimmed.mp4');
    await fs.writeFile(ballTrailPath, ballTrailBuf);
    console.log(`[${jobId}] got ball-trail clip (${ballTrailBuf.length} bytes)`);

    console.log(`[${jobId}] overlaying app UI...`);
    await recordAppFrame(ballTrailPath, ballTrailFramedPath, 4.0);
    console.log(`[${jobId}] recording card...`);
    await recordCard(cardPath);

    console.log(`[${jobId}] stitching...`);
    await stitchClips([ballTrailFramedPath, cardPath], finalPath);

    const finalBuf = await fs.readFile(finalPath);
    console.log(`[${jobId}] done, ${finalBuf.length} bytes`);

    return new NextResponse(finalBuf, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="footskill-${jobId}.mp4"`,
        'Content-Length': String(finalBuf.length),
      },
    });
  } catch (err: any) {
    console.error(`[${jobId}] error:`, err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  } finally {
    fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}
