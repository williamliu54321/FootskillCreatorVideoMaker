'use client';

import { useEffect, useState } from 'react';

export default function AppFramePreview() {
  return (
    <div style={{
      background: '#000',
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <FittedFrame />
    </div>
  );
}

function FittedFrame() {
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    function recompute() {
      const padding = 40;
      const sx = (window.innerWidth - padding) / 1080;
      const sy = (window.innerHeight - padding) / 1920;
      setScale(Math.min(sx, sy));
    }
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);

  return (
    <div style={{
      width: 1080 * scale, height: 1920 * scale,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: 1080, height: 1920,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute', top: 0, left: 0,
      }}>
        <AppFrame />
      </div>
    </div>
  );
}

function AppFrame() {
  const [elapsed, setElapsed] = useState(0);

  // Fake recording timer ticks from 00:00 -> 00:04
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => (s + 0.1) % 4), 100);
    return () => clearInterval(id);
  }, []);

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const ss = Math.floor(elapsed % 60).toString().padStart(2, '0');

  return (
    <div style={{
      position: 'relative',
      width: 1080, height: 1920,
      background: 'linear-gradient(180deg, #000 0%, #0a1525 60%, #000 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      color: '#fff',
      overflow: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        @keyframes fsRecPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes fsBorderGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(0,136,255,0.25), inset 0 0 40px rgba(0,136,255,0.08); border-color: rgba(0,136,255,0.5); }
          50%      { box-shadow: 0 0 80px rgba(0,136,255,0.5),  inset 0 0 60px rgba(0,136,255,0.15); border-color: rgba(0,212,255,0.9); }
        }
        @keyframes fsScanSweep {
          0%   { top: 0; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fsDotSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      ` }} />

      {/* ========== STATUS BAR ========== */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px',
        fontSize: 40, fontWeight: 600, letterSpacing: 0.5,
        zIndex: 10,
      }}>
        <span>9:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* signal */}
          <svg width="48" height="28" viewBox="0 0 48 28">
            <rect x="0"  y="18" width="8" height="10" rx="1" fill="#fff"/>
            <rect x="12" y="13" width="8" height="15" rx="1" fill="#fff"/>
            <rect x="24" y="7"  width="8" height="21" rx="1" fill="#fff"/>
            <rect x="36" y="0"  width="8" height="28" rx="1" fill="#fff"/>
          </svg>
          {/* wifi */}
          <svg width="44" height="30" viewBox="0 0 44 30" fill="none">
            <path d="M22 26 L22 26" stroke="#fff" strokeWidth="5" strokeLinecap="round"/>
            <path d="M12 18 Q22 10 32 18" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M4 10 Q22 -6 40 10" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <circle cx="22" cy="25" r="3" fill="#fff"/>
          </svg>
          {/* battery */}
          <div style={{
            width: 66, height: 28, border: '2px solid #fff', borderRadius: 6,
            position: 'relative', padding: 2,
          }}>
            <div style={{ background: '#fff', width: '85%', height: '100%', borderRadius: 3 }} />
            <div style={{
              position: 'absolute', right: -6, top: 8, width: 4, height: 8,
              background: '#fff', borderRadius: 2,
            }} />
          </div>
        </div>
      </div>

      {/* ========== HEADER ROW ========== */}
      <div style={{
        position: 'absolute', top: 130, left: 0, right: 0, height: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 50px',
        zIndex: 10,
      }}>
        {/* REC pill top-left */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 28px',
          background: 'rgba(255,50,50,0.2)',
          border: '2px solid rgba(255,80,80,0.8)',
          borderRadius: 40,
          boxShadow: '0 0 24px rgba(255,50,50,0.4)',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#ff3030',
            animation: 'fsRecPulse 1s ease-in-out infinite',
            boxShadow: '0 0 12px #ff3030',
          }} />
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 28, fontWeight: 700, letterSpacing: 2,
            color: '#fff',
          }}>
            {mm}:{ss}
          </span>
        </div>

        {/* Brand center */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 26px',
          background: 'rgba(0,20,40,0.7)',
          border: '1.5px solid rgba(0,136,255,0.4)',
          borderRadius: 40,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            width: 18, height: 18,
            background: 'linear-gradient(135deg, #00d4ff, #0066cc)',
            transform: 'rotate(45deg)',
            boxShadow: '0 0 10px #00d4ff',
          }} />
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 22, fontWeight: 700, letterSpacing: 3,
            background: 'linear-gradient(180deg, #fff, #00d4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            FOOTSKILL AI
          </span>
        </div>

        {/* Help/settings on right */}
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(0,20,40,0.7)',
          border: '1.5px solid rgba(0,136,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: 'rgba(255,255,255,0.7)',
        }}>?</div>
      </div>

      {/* ========== FULL-BLEED VIDEO PLACEHOLDER ========== */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'repeating-linear-gradient(45deg, #071726, #071726 80px, #0a1d33 80px, #0a1d33 160px)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.35)', fontSize: 36, fontWeight: 700,
          letterSpacing: 6,
          pointerEvents: 'none',
        }}>
          [ BALL-TRAIL VIDEO<br/>FULL HD 1080×1920 ]
        </div>
      </div>

      {/* Top/bottom vignette for overlay legibility */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* Rounded frame overlay — drawn on top of the full-HD video */}
      <div style={{
        position: 'absolute',
        top: 260, left: 40, right: 40, bottom: 260,
        borderRadius: 30,
        border: '3px solid rgba(0,136,255,0.5)',
        animation: 'fsBorderGlow 2s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 14,
      }} />

      {/* Corner brackets inside the frame */}
      {[
        { top: 280, left: 60,   borders: { borderTop: true, borderLeft: true } },
        { top: 280, right: 60,  borders: { borderTop: true, borderRight: true } },
        { bottom: 300, left: 60,  borders: { borderBottom: true, borderLeft: true } },
        { bottom: 300, right: 60, borders: { borderBottom: true, borderRight: true } },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: 40, height: 40,
          top: c.top, bottom: c.bottom, left: c.left, right: c.right,
          borderTop:    c.borders.borderTop    ? '3px solid #00d4ff' : 'none',
          borderLeft:   c.borders.borderLeft   ? '3px solid #00d4ff' : 'none',
          borderRight:  c.borders.borderRight  ? '3px solid #00d4ff' : 'none',
          borderBottom: c.borders.borderBottom ? '3px solid #00d4ff' : 'none',
          boxShadow: '0 0 8px rgba(0,212,255,0.5)',
          zIndex: 18,
        }} />
      ))}

      {/* Scanning line clipped to the frame */}
      <div style={{
        position: 'absolute',
        top: 263, left: 43, right: 43, bottom: 263,
        borderRadius: 27,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 15,
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
          boxShadow: '0 0 16px #00d4ff',
          animation: 'fsScanSweep 2.5s ease-in-out infinite',
          top: 0,
        }} />
      </div>

      {/* ========== BOTTOM "ANALYZING" BAR ========== */}
      <div style={{
        position: 'absolute', left: 60, right: 60, bottom: 90,
        padding: '28px 40px',
        background: 'rgba(0,20,40,0.75)',
        border: '2px solid rgba(0,136,255,0.6)',
        borderRadius: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
        boxShadow: '0 0 30px rgba(0,136,255,0.3), inset 0 0 20px rgba(0,136,255,0.1)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Spinning inner dot */}
        <div style={{
          width: 30, height: 30,
          border: '3px solid rgba(0,212,255,0.2)',
          borderTopColor: '#00d4ff',
          borderRadius: '50%',
          animation: 'fsDotSpin 1s linear infinite',
          boxShadow: '0 0 10px rgba(0,212,255,0.5)',
        }} />
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 34, fontWeight: 700, letterSpacing: 4,
          background: 'linear-gradient(180deg, #fff, #00d4ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          ANALYZING
        </span>
      </div>

      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 8, borderRadius: 4,
        background: 'rgba(255,255,255,0.35)',
      }} />
    </div>
  );
}
