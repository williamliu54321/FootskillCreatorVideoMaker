import puppeteer from 'puppeteer-core';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileP = promisify(execFile);

const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CARD_DIR = path.join(process.cwd(), 'card-template');
const SCALE = 2.5;

export async function recordCard(outputPath: string): Promise<void> {
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

    await page.evaluateOnNewDocument((scale: number) => {
      const apply = () => {
        const style = document.createElement('style');
        style.textContent = `
          html, body { width: 1080px; margin: 0; }
          body { display: block !important; padding: 0 !important; align-items: unset !important; justify-content: unset !important; }
          .card { transform: scale(${scale}); transform-origin: top center; margin: ${Math.round(40 * scale)}px auto 0 auto !important; }
        `;
        document.head.appendChild(style);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
      else apply();
    }, SCALE);

    const fileUrl = 'file://' + path.join(CARD_DIR, 'index.html');
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Force-play the drill video and wait until it is decoding
    await page.evaluate(async () => {
      const v = document.querySelector<HTMLVideoElement>('.drill-video video');
      if (!v) return;
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
    });

    // Expand document height for the scaled card
    await page.evaluate((scale: number) => {
      const card = document.querySelector<HTMLElement>('.card')!;
      const rect = card.getBoundingClientRect();
      const topOffset = rect.top + window.scrollY;
      const visualHeight = card.offsetHeight * scale;
      document.body.style.height = (topOffset + visualHeight + 40) + 'px';
    }, SCALE);

    // Wait for entry animations to settle
    await new Promise((r) => setTimeout(r, 3500));

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

    // Top hold
    await new Promise((r) => setTimeout(r, 750));

    // Scroll
    await page.evaluate(async (scale: number) => {
      const card = document.querySelector<HTMLElement>('.card')!;
      const rect = card.getBoundingClientRect();
      const topOffset = rect.top + window.scrollY;
      const visualHeight = card.offsetHeight * scale;
      const totalHeight = Math.max(0, topOffset + visualHeight - window.innerHeight);
      const duration = 1000;
      const start = performance.now();
      await new Promise<void>((resolve) => {
        function frame(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          window.scrollTo(0, totalHeight * eased);
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    }, SCALE);

    // Bottom hold
    await new Promise((r) => setTimeout(r, 500));

    await recorder.stop();

    // Trim to exactly 2.25s
    await execFileP('ffmpeg', [
      '-y', '-loglevel', 'error', '-i', rawPath,
      '-t', '2.25',
      '-c:v', 'libx264', '-crf', '14', '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-r', '60',
      outputPath,
    ], { maxBuffer: 50 * 1024 * 1024 });

    await execFileP('rm', ['-f', rawPath]);
  } finally {
    await browser.close();
  }
}
