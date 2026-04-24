'use client';

import { useState, useRef, useEffect } from 'react';

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const MAX_CLIP = 4.0;

export default function Home() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [outVideoUrl, setOutVideoUrl] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file) {
      setFileUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setStatus('idle');
    setError('');
    setOutVideoUrl('');
    setDuration(0);
    setStart(0);
    setEnd(0);
  }

  function onMetadata() {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration;
    setDuration(d);
    setStart(0);
    setEnd(Math.min(MAX_CLIP, d));
  }

  function clampRange(newStart: number, newEnd: number) {
    let s = Math.max(0, Math.min(newStart, duration));
    let e = Math.max(0, Math.min(newEnd, duration));
    if (e - s > MAX_CLIP) {
      // caller indicated which edge moved by setting the other; we preserve s and cap e
      e = s + MAX_CLIP;
    }
    if (e < s) e = s;
    setStart(s);
    setEnd(e);
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    if (v) v.currentTime = t;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setError('');
    setOutVideoUrl('');
    setStatus('uploading');

    const fd = new FormData();
    fd.append('video', file);
    fd.append('start', start.toFixed(3));
    fd.append('end', end.toFixed(3));

    setStatus('processing');

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setOutVideoUrl(url);
      setStatus('done');

      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `footskill-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      setStatus('error');
    }
  }

  const busy = status === 'uploading' || status === 'processing';
  const clipLength = end - start;

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Footskill Creator Video Maker</h1>
      <p style={{ opacity: 0.7, marginBottom: 32 }}>
        Upload a soccer clip, trim to the moment, and we'll add the ball trail and stitch it with your skill analysis card.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="file"
          accept="video/*"
          required
          disabled={busy}
          onChange={onFilePick}
          style={{ padding: 12, background: 'rgba(0,136,255,0.1)', border: '1px solid rgba(0,136,255,0.3)', borderRadius: 8, color: '#fff' }}
        />

        {fileUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <video
              ref={videoRef}
              src={fileUrl}
              onLoadedMetadata={onMetadata}
              controls
              style={{ width: '100%', maxHeight: 400, background: '#000', borderRadius: 8 }}
            />

            {duration > 0 && (
              <TrimSlider
                duration={duration}
                start={start}
                end={end}
                onChange={(s, e) => clampRange(s, e)}
                onScrub={seekTo}
                disabled={busy}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, opacity: 0.8 }}>
              <span>Start: {start.toFixed(2)}s</span>
              <span style={{ color: clipLength > MAX_CLIP ? '#ff6060' : '#00d4ff' }}>
                Length: {clipLength.toFixed(2)}s {clipLength > MAX_CLIP && '(max 4s)'}
              </span>
              <span>End: {end.toFixed(2)}s</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !file || clipLength <= 0 || clipLength > MAX_CLIP}
          style={{
            padding: '14px 20px',
            background: (busy || !file) ? '#333' : 'linear-gradient(135deg, #0066cc, #00d4ff)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {status === 'uploading' && 'Uploading...'}
          {status === 'processing' && 'Processing (~10 min)...'}
          {status === 'idle' && 'Generate'}
          {status === 'done' && 'Generate Another'}
          {status === 'error' && 'Try Again'}
        </button>
      </form>

      {status === 'error' && (
        <p style={{ marginTop: 20, padding: 12, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.4)', borderRadius: 8 }}>
          {error}
        </p>
      )}

      {status === 'done' && outVideoUrl && (
        <div style={{ marginTop: 24 }}>
          <video src={outVideoUrl} controls autoPlay style={{ width: '100%', borderRadius: 8 }} />
          <a href={outVideoUrl} download="footskill.mp4" style={{ display: 'inline-block', marginTop: 12, color: '#00d4ff', textDecoration: 'underline' }}>
            Download MP4
          </a>
        </div>
      )}
    </main>
  );
}

function TrimSlider({
  duration, start, end, onChange, onScrub, disabled,
}: {
  duration: number;
  start: number;
  end: number;
  onChange: (s: number, e: number) => void;
  onScrub: (t: number) => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'start' | 'end' | null>(null);

  function pxToTime(clientX: number): number {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function onPointerDown(handle: 'start' | 'end') {
    return (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      draggingRef.current = handle;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const t = pxToTime(e.clientX);
    if (draggingRef.current === 'start') {
      const newStart = Math.min(t, end);
      const newEnd = Math.min(end, newStart + MAX_CLIP);
      onChange(newStart, newEnd);
      onScrub(newStart);
    } else {
      const newEnd = Math.max(t, start);
      const newStart = Math.max(start, newEnd - MAX_CLIP);
      onChange(newStart, newEnd);
      onScrub(newEnd);
    }
  }

  function onPointerUp() {
    draggingRef.current = null;
  }

  const startPct = (start / duration) * 100;
  const endPct = (end / duration) * 100;

  return (
    <div
      ref={trackRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'relative',
        height: 40,
        background: 'rgba(0,136,255,0.08)',
        border: '1px solid rgba(0,136,255,0.3)',
        borderRadius: 8,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Selected range */}
      <div
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: `${startPct}%`,
          width: `${Math.max(0, endPct - startPct)}%`,
          background: 'rgba(0,212,255,0.25)',
          borderLeft: '2px solid #00d4ff',
          borderRight: '2px solid #00d4ff',
        }}
      />
      {/* Start handle */}
      <Handle pct={startPct} onPointerDown={onPointerDown('start')} />
      {/* End handle */}
      <Handle pct={endPct} onPointerDown={onPointerDown('end')} />
    </div>
  );
}

function Handle({ pct, onPointerDown }: { pct: number; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        top: -6,
        left: `calc(${pct}% - 8px)`,
        width: 16,
        height: 52,
        background: '#00d4ff',
        borderRadius: 4,
        cursor: 'ew-resize',
        boxShadow: '0 0 10px rgba(0,212,255,0.6)',
      }}
    />
  );
}
