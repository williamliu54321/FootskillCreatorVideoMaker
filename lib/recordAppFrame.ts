import puppeteer from 'puppeteer-core';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CARD_DIR = path.join(process.cwd(), 'card-template');

/**
 * Wrap a ball-trail video in the FootSkill AI app frame and capture exactly
 * the video's duration (capped at maxDuration).
 */
export async function recordAppFrame(
  ballTrailVideoPath: string,
  outputPath: string,
  maxDuration = 4.0,
  templateName: 'app-frame.html' | 'app-frame-inside.html' = 'app-frame.html',
): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: null,
    args: [
      '--window-size=1080,1920',
      '--autoplay-policy=no-user-gesture-required',
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

    // Copy ball-trail into the template directory so the page can reference it
    // via a file:// URL (data: URLs are limited to ~2MB in Chromium, which
    // breaks on CRF 0 files).
    const videoFilename = `_bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`;
    const videoInTemplateDir = path.join(CARD_DIR, videoFilename);
    await fs.copyFile(ballTrailVideoPath, videoInTemplateDir);

    try {
      const templateUrl = 'file://' + path.join(CARD_DIR, templateName);
      await page.goto(templateUrl, { waitUntil: 'networkidle0' });

      // Point the video to the file we just dropped in the template dir
      await page.evaluate((src) => {
        const v = document.getElementById('content') as HTMLVideoElement;
        v.src = src;
        v.load();
      }, videoFilename);

    // Wait for video to be decoding
    const status = await page.evaluate(async () => {
      const v = document.getElementById('content') as HTMLVideoElement;
      v.muted = true;
      try { await v.play(); } catch {}
      await new Promise<void>((r) => {
        if (v.readyState >= 3 && v.currentTime > 0) return r();
        const onProgress = () => {
          if (v.readyState >= 3 && v.currentTime > 0) {
            v.removeEventListener('timeupdate', onProgress);
            r();
          }
        };
        v.addEventListener('timeupdate', onProgress);
        setTimeout(() => { v.removeEventListener('timeupdate', onProgress); r(); }, 8000);
      });
      return { duration: v.duration, readyState: v.readyState };
    });

    const clipDuration = Math.min(status.duration || maxDuration, maxDuration);

    // Rewind to 0 so recording starts at the first frame
    await page.evaluate(() => {
      const v = document.getElementById('content') as HTMLVideoElement;
      v.currentTime = 0;
      v.play();
    });
    // Tiny settle
    await new Promise((r) => setTimeout(r, 50));

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

    // Record for the clip's duration plus a small buffer
    await new Promise((r) => setTimeout(r, clipDuration * 1000 + 150));

    await recorder.stop();

    // Trim to exact duration, re-encode for consistency
    await execFileP('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', rawPath,
      '-t', clipDuration.toFixed(3),
      '-c:v', 'libx264', '-crf', '14', '-preset', 'fast',
      '-pix_fmt', 'yuv420p', '-r', '60',
      outputPath,
    ], { maxBuffer: 50 * 1024 * 1024 });
    await execFileP('rm', ['-f', rawPath]);
    } finally {
      await fs.unlink(videoInTemplateDir).catch(() => {});
    }
  } finally {
    await browser.close();
  }
}
