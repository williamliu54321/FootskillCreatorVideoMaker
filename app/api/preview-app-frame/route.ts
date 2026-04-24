import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { recordAppFrame } from '@/lib/recordAppFrame';

export const runtime = 'nodejs';
export const maxDuration = 120;

const TEST_VIDEO = '/tmp/test_ball_trail.mp4';

export async function GET() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `appframe-${randomUUID().slice(0, 6)}-`));
  const out = path.join(tmp, 'out.mp4');

  try {
    await recordAppFrame(TEST_VIDEO, out, 4.0);
    const buf = await fs.readFile(out);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(buf.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  } finally {
    fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}
