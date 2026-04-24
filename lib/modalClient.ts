import fs from 'fs/promises';

const MODAL_BASE = process.env.MODAL_BASE || 'https://wliu404--ball-trail-v2-web.modal.run';

export async function runBallTrail(videoBuffer: Buffer, contentType: string, filename: string): Promise<Buffer> {
  const form = new FormData();
  const blob = new Blob([videoBuffer], { type: contentType || 'video/mp4' });
  form.append('video', blob, filename || 'input.mp4');

  const processRes = await fetch(`${MODAL_BASE}/process`, {
    method: 'POST',
    body: form,
  });

  if (!processRes.ok) {
    const text = await processRes.text().catch(() => '');
    throw new Error(`Modal /process failed (${processRes.status}): ${text}`);
  }

  const { job_id } = (await processRes.json()) as { job_id: string; filename?: string };
  if (!job_id) throw new Error('Modal /process returned no job_id');

  // Poll /download until the file is ready. Modal's /process can return before
  // the job has fully committed its output to the shared volume.
  const deadline = Date.now() + 12 * 60 * 1000; // 12 min max wait
  let lastStatus = 0;
  while (Date.now() < deadline) {
    const dlRes = await fetch(`${MODAL_BASE}/download/${job_id}`);
    if (dlRes.ok) {
      const arrayBuf = await dlRes.arrayBuffer();
      return Buffer.from(arrayBuf);
    }
    lastStatus = dlRes.status;
    if (dlRes.status !== 404) {
      // 4xx other than 404 / 5xx — give up
      const text = await dlRes.text().catch(() => '');
      throw new Error(`Modal /download/${job_id} failed (${dlRes.status}): ${text}`);
    }
    // 404: not ready yet, wait and retry
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`Modal /download/${job_id} did not appear within 12 min (last status ${lastStatus})`);
}

export async function writeBufferToTempFile(buf: Buffer, filepath: string): Promise<void> {
  await fs.writeFile(filepath, buf);
}
