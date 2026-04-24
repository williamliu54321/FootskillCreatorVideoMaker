import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { recordLoading } from '@/lib/recordLoading';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `loading-preview-${randomUUID().slice(0, 6)}-`));
  const out = path.join(tmp, 'loading.mp4');

  try {
    await recordLoading(out);
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
