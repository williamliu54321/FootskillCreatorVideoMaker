'use client';

export default function AnalyzeCompare() {
  return (
    <div style={{
      background: '#000', minHeight: '100vh', padding: 40,
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        @keyframes fsDotSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes fsSoftBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fsBarFill { 0% { width: 0%; } 100% { width: 100%; } }
      `}} />

      <h1 style={{ fontSize: 28, marginBottom: 24, letterSpacing: 2 }}>ANALYZING BAR — 5 VARIANTS</h1>
      <p style={{ opacity: 0.6, marginBottom: 40, fontSize: 14 }}>
        Simulated bottom area of the 1080×1920 frame over a dark background.
      </p>

      {/* Current */}
      <Variant name="Current (heavy)">
        <div style={{
          padding: '28px 40px',
          background: 'rgba(0,20,40,0.75)',
          border: '2px solid rgba(0,136,255,0.6)',
          borderRadius: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          boxShadow: '0 0 30px rgba(0,136,255,0.3), inset 0 0 20px rgba(0,136,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            width: 30, height: 30,
            border: '3px solid rgba(0,212,255,0.2)',
            borderTopColor: '#00d4ff',
            borderRadius: '50%',
            animation: 'fsDotSpin 1s linear infinite',
          }} />
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 34, fontWeight: 700, letterSpacing: 4,
            background: 'linear-gradient(180deg, #fff, #00d4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ANALYZING</span>
        </div>
      </Variant>

      {/* Option 1: Tiny floating text chip */}
      <Variant name="Option 1 — Tiny floating text (my pick)">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#00d4ff',
            boxShadow: '0 0 10px #00d4ff',
            animation: 'fsSoftBlink 1.5s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 14, fontWeight: 600, letterSpacing: 3,
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 0 8px rgba(0,212,255,0.4)',
          }}>ANALYZING</span>
        </div>
      </Variant>

      {/* Option 2: Telemetry ticker */}
      <Variant name="Option 2 — Telemetry ticker">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          fontFamily: 'Orbitron, monospace', fontSize: 12, letterSpacing: 2,
          color: 'rgba(0,212,255,0.8)',
        }}>
          <span>TRACKING</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>60fps</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>CONF 0.94</span>
        </div>
      </Variant>

      {/* Option 3: Small pill like REC */}
      <Variant name="Option 3 — Small cyan pill (corner-style)">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: 'rgba(0,136,255,0.15)',
          border: '1.5px solid rgba(0,212,255,0.6)',
          borderRadius: 40,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            width: 14, height: 14,
            border: '2px solid rgba(0,212,255,0.2)',
            borderTopColor: '#00d4ff',
            borderRadius: '50%',
            animation: 'fsDotSpin 1s linear infinite',
          }} />
          <span style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 14, fontWeight: 600, letterSpacing: 2,
            color: '#fff',
          }}>ANALYZING</span>
        </div>
      </Variant>

      {/* Option 4: Progress bar along bottom edge */}
      <Variant name="Option 4 — Just a progress bar (no text)">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '60%', height: 3, borderRadius: 2,
            background: 'rgba(0,136,255,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0066cc, #00d4ff)',
              boxShadow: '0 0 8px rgba(0,212,255,0.5)',
              animation: 'fsBarFill 2s linear infinite',
            }} />
          </div>
        </div>
      </Variant>

    </div>
  );
}

function Variant({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8, letterSpacing: 1 }}>{name}</div>
      <div style={{
        width: 1080 * 0.42, height: 200 * 0.8,
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(10,21,37,0.6) 0%, #000 100%)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 20,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
