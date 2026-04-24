import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

/**
 * Concatenate N clips into a single 1080x1920 60fps MP4.
 * Handles any input size/framerate/codec by re-encoding and normalizing.
 */
export async function stitchClips(inputs: string[], outputPath: string): Promise<void> {
  if (inputs.length < 2) {
    throw new Error('stitchClips requires at least 2 inputs');
  }

  // Build normalization filters per input
  const prepared = inputs
    .map((_, i) =>
      `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,` +
      `pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=60[v${i}]`
    )
    .join(';');

  const concatInputs = inputs.map((_, i) => `[v${i}]`).join('');
  const filterComplex = `${prepared};${concatInputs}concat=n=${inputs.length}:v=1:a=0[outv]`;

  const args: string[] = ['-y'];
  for (const input of inputs) {
    args.push('-i', input);
  }
  args.push(
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'fast',
    '-pix_fmt', 'yuv420p', '-r', '60',
    outputPath,
  );

  await execFileP('ffmpeg', args, { maxBuffer: 50 * 1024 * 1024 });
}
