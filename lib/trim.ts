import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const MAX_DURATION = 4.0;

/**
 * Trim a video file to [start, end] using ffmpeg stream copy (no re-encode).
 * Enforces an 8s hard cap to match Modal's MAX_SECONDS.
 */
export async function trimVideo(inputPath: string, outputPath: string, start: number, end: number): Promise<void> {
  const s = Math.max(0, Number.isFinite(start) ? start : 0);
  const e = Number.isFinite(end) && end > s ? end : s + MAX_DURATION;
  const duration = Math.min(e - s, MAX_DURATION);

  // Re-encode on trim so the output is always clean H.264 regardless of
  // input codec/container. Avoids stream-copy artifacts like missing
  // keyframes that break downstream decoders (Modal/SAM 3).
  await execFileP('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', s.toFixed(3),
    '-i', inputPath,
    '-t', duration.toFixed(3),
    '-c:v', 'libx264', '-crf', '0', '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-movflags', '+faststart',
    outputPath,
  ], { maxBuffer: 50 * 1024 * 1024 });
}
