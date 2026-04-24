import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CARD_DIR = path.join(process.cwd(), 'card-template');

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => reject(new Error(`ffmpeg spawn error: ${err.message}`)));
    proc.on('close', (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exit code=${code} signal=${signal}\nSTDERR:\n${stderr.slice(-8000)}`));
    });
  });
}

/**
 * Wrap a ball-trail video in the FootSkill AI app overlay using a transparent
 * PNG composited via ffmpeg. This preserves the input video's native 60fps —
 * no screen-recording re-encode, no frame duplication.
 */
export async function recordAppFrame(
  ballTrailVideoPath: string,
  outputPath: string,
  maxDuration = 4.0,
): Promise<void> {
  // 1. Render overlay HTML to a transparent PNG via Puppeteer
  const overlayPngPath = outputPath + '.overlay.png';

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: null,
    args: [
      '--window-size=1080,1920',
      '--force-device-scale-factor=1',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-zygote',
      '--single-process',
    ],
  } as any);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    // Use a transparent background so the screenshot has alpha
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

    const templateUrl = 'file://' + path.join(CARD_DIR, 'app-frame.html');
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });
    // Give fonts a moment to load
    await new Promise((r) => setTimeout(r, 400));

    await page.screenshot({
      path: overlayPngPath,
      omitBackground: true,   // preserves transparency
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1920 },
    });
  } finally {
    await browser.close();
  }

  // 2. Composite overlay PNG on top of ball-trail video with ffmpeg in one pass.
  // Preserves original 60fps timing (no frame duplication).
  await runFfmpeg([
    '-y', '-loglevel', 'error',
    '-i', ballTrailVideoPath,
    '-i', overlayPngPath,
    '-filter_complex',
    '[0:v][1:v]overlay=0:0:format=auto,' +
      'scale=1080:1920:force_original_aspect_ratio=decrease,' +
      'pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,' +
      `setsar=1,fps=60,trim=duration=${maxDuration.toFixed(3)},setpts=PTS-STARTPTS[outv]`,
    '-map', '[outv]',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow',
    '-profile:v', 'high', '-level', '4.2',
    '-pix_fmt', 'yuv420p', '-r', '60',
    '-movflags', '+faststart',
    outputPath,
  ]);

  await fs.unlink(overlayPngPath).catch(() => {});
}
