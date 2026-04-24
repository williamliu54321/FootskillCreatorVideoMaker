'use client';

import { useEffect, useState } from 'react';

export default function LoadingPreview() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #000 0%, #0a1525 50%, #000 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <LoadingOverlay stage="Generating your video" subtext="Analyzing the ball..." />
    </div>
  );
}

function LoadingOverlay({ stage, subtext }: { stage: string; subtext: string }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fsPulseBg {
          0%, 100% { box-shadow: 0 0 60px rgba(0,136,255,0.3), 0 0 120px rgba(0,212,255,0.15); }
          50%      { box-shadow: 0 0 100px rgba(0,136,255,0.55), 0 0 200px rgba(0,212,255,0.3); }
        }
        @keyframes fsOrbit {
          from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
        }
        @keyframes fsOrbit2 {
          from { transform: rotate(120deg) translateX(110px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(110px) rotate(-480deg); }
        }
        @keyframes fsOrbit3 {
          from { transform: rotate(240deg) translateX(110px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(110px) rotate(-600deg); }
        }
        @keyframes fsTitleGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,136,255,0.3); }
          50%      { text-shadow: 0 0 30px rgba(0,212,255,0.9), 0 0 60px rgba(0,136,255,0.5); }
        }
        @keyframes fsScanLine {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes fsFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fsDiamondFloat {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50%      { transform: rotate(45deg) translateY(-6px); }
        }
        @keyframes fsBarPulse {
          0%   { width: 0%; background-position: 0% 50%; }
          50%  { width: 100%; background-position: 100% 50%; }
          100% { width: 0%; background-position: 200% 50%; }
        }
      ` }} />

      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
        padding: 40, borderRadius: 20,
        background: 'rgba(0,20,40,0.55)',
        border: '1px solid rgba(0,136,255,0.3)',
        backdropFilter: 'blur(8px)',
        animation: 'fsPulseBg 3s ease-in-out infinite, fsFadeUp 0.5s ease-out',
        minWidth: 380,
      }}>
        {/* Scan line overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
            animation: 'fsScanLine 3s ease-in-out infinite',
          }} />
        </div>

        {/* Orbiting ring with orbs */}
        <div style={{
          position: 'relative', width: 240, height: 240,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Outer spinning ring */}
          <svg width="240" height="240" style={{
            position: 'absolute', animation: 'fsSpin 4s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.6))',
          }}>
            <circle cx="120" cy="120" r="110" fill="none"
              stroke="url(#ringGrad)" strokeWidth="2"
              strokeDasharray="60 20 40 30 80 40" strokeLinecap="round" />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066cc" />
                <stop offset="50%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#0088ff" />
              </linearGradient>
            </defs>
          </svg>
          {/* Inner counter-spinning ring */}
          <svg width="200" height="200" style={{
            position: 'absolute', animation: 'fsSpin 6s linear infinite reverse',
            opacity: 0.6,
          }}>
            <circle cx="100" cy="100" r="90" fill="none"
              stroke="#0088ff" strokeWidth="1"
              strokeDasharray="4 8" />
          </svg>

          {/* Orbiting dots */}
          <div style={{ position: 'absolute', width: 0, height: 0 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 14, height: 14, borderRadius: '50%',
                background: '#00d4ff',
                boxShadow: '0 0 15px #00d4ff, 0 0 30px #0088ff',
                animation: `${i === 0 ? 'fsOrbit' : i === 1 ? 'fsOrbit2' : 'fsOrbit3'} 2.5s linear infinite`,
                transformOrigin: 'center',
                left: -7, top: -7,
              }} />
            ))}
          </div>

          {/* Center diamond logo */}
          <div style={{
            position: 'relative', width: 60, height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'absolute',
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #00d4ff, #0066cc)',
              boxShadow: '0 0 20px #00d4ff, 0 0 40px #0088ff',
              animation: 'fsDiamondFloat 2s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 24, letterSpacing: 4, fontWeight: 900,
            background: 'linear-gradient(180deg, #fff 0%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fsTitleGlow 2s ease-in-out infinite',
          }}>
            FOOTSKILL AI
          </div>
          <div style={{
            marginTop: 8, fontSize: 14, letterSpacing: 2,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Orbitron, monospace',
          }}>
            {stage}{'.'.repeat(dots)}
          </div>
        </div>

        {/* Animated progress bar */}
        <div style={{
          width: 260, height: 3, borderRadius: 2,
          background: 'rgba(0,136,255,0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #0066cc, #00d4ff, #0088ff)',
            backgroundSize: '200% 100%',
            borderRadius: 2,
            animation: 'fsBarPulse 2s ease-in-out infinite',
          }} />
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Orbitron, monospace', letterSpacing: 1,
        }}>
          {subtext}
        </div>
      </div>

      {/* Orbitron font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" />
    </>
  );
}
