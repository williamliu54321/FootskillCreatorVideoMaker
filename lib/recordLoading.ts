import puppeteer from 'puppeteer-core';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CARD_DIR = path.join(process.cwd(), 'card-template');

export async function recordLoading(outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: null,
    args: [
      '--window-size=1080,1920',
      '--autoplay-policy=no-user-gesture-required',
      '--force-device-scale-factor=1',
      '--no-sandbox',
    ],
  } as any);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

    const fileUrl = 'file://' + path.join(CARD_DIR, 'loading.html');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Give fonts/styles a moment to settle
    await new Promise((r) => setTimeout(r, 200));

    // Reset the bar animation by re-triggering it right before recording so
    // the recorded 1s clip shows a clean 0% -> 100% fill.
    await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>('.bar-fill');
      if (!bar) return;
      bar.style.animation = 'none';
      // force reflow
      void bar.offsetWidth;
      bar.style.animation = '';
    });

    const recorder = new PuppeteerScreenRecorder(page as any, {
      fps: 60,
      videoFrame: { width: 1080, height: 1920 },
      videoCrf: 18,
      videoCodec: 'libx264',
      videoPreset: 'fast',
      videoBitrate: 8000,
      aspectRatio: '9:16',
    } as any);

    const rawPath = outputPath + '.raw.mp4';
    await recorder.start(rawPath);

    // Capture ~0.7s, trim to exactly 0.5s after
    await new Promise((r) => setTimeout(r, 700));

    await recorder.stop();

    await execFileP('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', rawPath,
      '-t', '0.5',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-r', '60',
      outputPath,
    ], { maxBuffer: 50 * 1024 * 1024 });
    await execFileP('rm', ['-f', rawPath]);
  } finally {
    await browser.close();
  }
}
