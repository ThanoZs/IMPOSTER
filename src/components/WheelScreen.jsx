// WheelScreen.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/* ── Audio ── */
let _actx = null;
function bang() {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _actx, sr = ctx.sampleRate;
    const cb = ctx.createBuffer(1, sr * 0.04, sr);
    const cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.008));
    const cs = ctx.createBufferSource(); cs.buffer = cb;
    const cg = ctx.createGain(); cg.gain.value = 0.5;
    cs.connect(cg); cg.connect(ctx.destination); cs.start();
    const bb = ctx.createBuffer(1, sr * 0.45, sr);
    const bd = bb.getChannelData(0);
    for (let i = 0; i < bd.length; i++) {
      const t = i / sr;
      bd[i] = (Math.random() * 2 - 1) * Math.exp(-t * 12) * (1 + 0.7 * Math.sin(Math.PI * 2 * 75 * t));
    }
    const bs = ctx.createBufferSource(); bs.buffer = bb;
    const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = 700;
    const bg = ctx.createGain(); bg.gain.value = 1.1;
    bs.connect(lo); lo.connect(bg); bg.connect(ctx.destination); bs.start(ctx.currentTime + 0.04);
  } catch (_) { }
}

/* ── Gun SVG drawn in local coords, rotated via CSS transform ── */
const GunSVG = () => (
  <svg viewBox="-170 -50 240 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id="g-barrel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b0b8c8" />
        <stop offset="50%" stopColor="#8090a8" />
        <stop offset="100%" stopColor="#5a6578" />
      </linearGradient>
      <linearGradient id="g-frame" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="#9098a8" />
        <stop offset="100%" stopColor="#606878" />
      </linearGradient>
      <linearGradient id="g-grip" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7a5030" />
        <stop offset="100%" stopColor="#3a2010" />
      </linearGradient>
      <radialGradient id="g-cyl" cx="40%" cy="35%">
        <stop offset="0%" stopColor="#9098b0" />
        <stop offset="100%" stopColor="#5a6070" />
      </radialGradient>
      <radialGradient id="g-brass" cx="35%" cy="30%">
        <stop offset="0%" stopColor="#d4a040" />
        <stop offset="100%" stopColor="#806018" />
      </radialGradient>
      <filter id="gun-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.22)" />
      </filter>
    </defs>

    <g filter="url(#gun-shadow)">
      {/* Grip */}
      <path d="M14 28 L26 28 C38 44 36 66 32 86 C28 98 14 104 4 98 C-6 92 -4 76 0 56 L6 34 Z"
        fill="url(#g-grip)" stroke="rgba(60,32,10,0.4)" strokeWidth="1" />
      {/* Grip checkering */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={i} x1={0 + i * 4} y1="36" x2={-2 + i * 4} y2="96"
          stroke="rgba(255,200,120,0.12)" strokeWidth="0.8" />
      ))}
      {/* Grip badge */}
      <circle cx="16" cy="70" r="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.7" />
      <text x="16" y="73.5" textAnchor="middle" fontSize="7" fontFamily="serif" fill="rgba(255,255,255,0.4)" fontWeight="bold">I</text>

      {/* Frame body */}
      <path d="M-16 -20 L22 -20 L28 -7 L28 28 L20 34 L-16 34 Z"
        fill="url(#g-frame)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      {/* Frame highlight */}
      <path d="M-14 -18 L20 -18 L26 -7" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" />

      {/* Trigger guard */}
      <path d="M-4 34 C-20 34 -22 50 -20 62 C-18 70 -6 68 4 66 L12 34 Z"
        fill="url(#g-frame)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
      {/* Trigger */}
      <path d="M-1 36 L-4 58 L4 58 L6 36 Z"
        fill="#3a4050" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />

      {/* Hammer */}
      <path d="M-16 -20 L-30 -30 L-35 -18 L-22 -9 Z"
        fill="#6a7080" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

      {/* Barrel (main) */}
      <rect x="-138" y="-24" width="122" height="16" rx="4"
        fill="url(#g-barrel)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      {/* Barrel rib */}
      <rect x="-136" y="-24" width="118" height="4" rx="2" fill="rgba(255,255,255,0.10)" />
      {/* Barrel underlug */}
      <rect x="-135" y="-8" width="116" height="7" rx="3"
        fill="#6a7080" stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />

      {/* Front sight */}
      <rect x="-140" y="-28" width="4" height="7" rx="1" fill="#fff" opacity="0.7" />
      {/* Rear sight notch */}
      <rect x="-22" y="-28" width="11" height="5" rx="1" fill="#3a4050" />
      <rect x="-19" y="-28" width="4" height="3" fill="rgba(255,255,255,0.5)" />

      {/* Muzzle cap */}
      <rect x="-150" y="-26" width="14" height="20" rx="3"
        fill="#5a6578" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      {/* Muzzle bore */}
      <circle cx="-143" cy="-16" r="5" fill="#1a1e28" />
      <circle cx="-143" cy="-16" r="5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <circle cx="-143" cy="-16" r="2.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

      {/* Cylinder */}
      <circle cx="6" cy="6" r="30" fill="url(#g-cyl)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
      {/* Cylinder flutes */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        return <path key={i}
          d={`M ${6 + 22 * Math.cos(a - 0.22)} ${6 + 22 * Math.sin(a - 0.22)} A 22 22 0 0 1 ${6 + 22 * Math.cos(a + 0.22)} ${6 + 22 * Math.sin(a + 0.22)}`}
          fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />;
      })}
      {/* Bullets in cylinder */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        const bx = 6 + 16 * Math.cos(a), by = 6 + 16 * Math.sin(a);
        return (
          <g key={i}>
            <circle cx={bx} cy={by} r="7" fill="url(#g-brass)" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
            <circle cx={bx} cy={by} r="3.5" fill="#2a1800" />
            <circle cx={bx} cy={by} r="2" fill="#3a2a00" />
          </g>
        );
      })}
      {/* Axle */}
      <circle cx="6" cy="6" r="5.5" fill="#3a4050" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <circle cx="6" cy="6" r="2" fill="rgba(255,255,255,0.6)" />
    </g>
  </svg>
);

/* ═══════════════════════════════════════════════════════════ */
const WheelScreen = ({ players, type, onFinish, onHome }) => {
  const N = players.length;
  const TAU = Math.PI * 2;

  /* gun rotation in degrees — CSS handles the animation */
  const [gunDeg, setGunDeg] = useState(-90); // -90° = barrel pointing up
  const [phase, setPhase] = useState('idle');
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [laserOn, setLaserOn] = useState(false);
  const [recoil, setRecoil] = useState(false);
  const [winnerName, setWinnerName] = useState('');
  const currentDeg = useRef(-90);

  /* player positions — arranged in circle */
  const RADIUS = 42; // % of container
  const playerPositions = players.map((p, i) => {
    const a = (i / N) * TAU - Math.PI / 2;
    return {
      name: p.name,
      x: 50 + RADIUS * Math.cos(a),
      y: 50 + RADIUS * Math.sin(a),
      angleDeg: (a * 180) / Math.PI,
    };
  });

  const handleSpin = useCallback(() => {
    if (phase !== 'idle') return;

    const wIdx = Math.floor(Math.random() * N);
    setWinnerIdx(wIdx);
    setPhase('spinning');

    /* 
     * Player i is at angle: (i/N)*360 - 90 degrees (from top, clockwise)
     * Barrel tip is at gunDeg + 180 (barrel points in -X local = +180 world)
     * We need: gunDeg + 180 = playerAngleDeg
     * => gunDeg = playerAngleDeg - 180
     */
    const playerAngleDeg = (wIdx / N) * 360 - 90;
    const targetGunDeg = playerAngleDeg - 180;

    /* normalize current to [0,360) */
    const currNorm = ((currentDeg.current % 360) + 360) % 360;
    const targNorm = ((targetGunDeg % 360) + 360) % 360;
    const diff = ((targNorm - currNorm) + 360) % 360;
    const extraSpins = (6 + Math.floor(Math.random() * 5)) * 360;
    const totalSpin = extraSpins + diff;
    const finalDeg = currentDeg.current + totalSpin;

    currentDeg.current = finalDeg;
    setGunDeg(finalDeg);

    /* timeline after CSS spin (4.2s) */
    setTimeout(() => {
      setPhase('aim');
      setLaserOn(true);
    }, 4300);

    setTimeout(() => {
      setPhase('shoot');
      setLaserOn(false);
      bang();
      setShowFlash(true);
      setRecoil(true);
      setTimeout(() => setShowFlash(false), 130);
      setTimeout(() => setRecoil(false), 300);
    }, 4950);

    setTimeout(() => {
      setPhase('done');
      setWinnerName(players[wIdx].name);
    }, 5200);

    setTimeout(() => {
      onFinish(players[wIdx].name);
    }, 7600);
  }, [phase, N, players, onFinish]);

  const isIdle = phase === 'idle';
  const isDone = phase === 'done';
  const isAiming = phase === 'aim';

  /* Spin transition: fast for idle→spin, instant reset */
  const spinTransition = phase === 'spinning'
    ? 'transform 4.2s cubic-bezier(0.06,0.80,0.14,1.00)'
    : 'none';

  return (
    <div className="screen-container wheel-screen" style={{ position: 'relative' }}>

      {/* Title */}
      <motion.h2
        key={type}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="title"
        style={{ fontSize: 'clamp(0.9rem,3.5vw,1.1rem)', fontWeight: 700, letterSpacing: 0, color: 'var(--ink-2)', margin: '2px 0 0' }}
      >
        {type === 'PICKER' ? 'Who picks a card first?' : 'Who speaks first?'}
      </motion.h2>

      {/* Arena — relative container, everything inside uses % positioning */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '88%', /* aspect ratio */
        maxHeight: '62vw',
        overflow: 'visible',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>

          {/* Background circle */}
          <div style={{
            position: 'absolute',
            inset: '8%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #f8f7f4 0%, #ece9e2 100%)',
            border: '1.5px dashed rgba(30,26,20,0.10)',
            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.04)',
          }} />

          {/* Tick marks at each player position */}
          {playerPositions.map((p, i) => {
            const a = (i / N) * TAU - Math.PI / 2;
            const r1 = 40.5, r2 = 43;
            const x1 = 50 + r1 * Math.cos(a), y1 = 50 + r1 * Math.sin(a);
            const x2 = 50 + r2 * Math.cos(a), y2 = 50 + r2 * Math.sin(a);
            return (
              <svg key={i} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100">
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(30,26,20,0.18)" strokeWidth="0.4" />
              </svg>
            );
          })}

          {/* Player labels */}
          {playerPositions.map((p, i) => {
            const isWinner = i === winnerIdx && isDone;
            const isTargeted = i === winnerIdx && (isAiming || phase === 'shoot');
            return (
              <motion.div
                key={i}
                animate={isWinner ? { scale: [1, 1.12, 1], transition: { repeat: 2, duration: 0.4 } } : {}}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  zIndex: 10,
                }}
              >
                {/* Person icon */}
                <div style={{
                  width: Math.max(28, 52 / N * 1.6),
                  height: Math.max(28, 52 / N * 1.6),
                  borderRadius: '50%',
                  background: isWinner ? 'var(--red-light)' : 'var(--surface)',
                  border: `1.5px solid ${isWinner ? 'rgba(214,62,62,0.5)' : isTargeted ? 'rgba(79,70,229,0.4)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.max(12, 24 / N * 1.4),
                  boxShadow: isWinner
                    ? '0 0 0 3px rgba(214,62,62,0.15)'
                    : isTargeted
                      ? '0 0 0 3px rgba(79,70,229,0.15)'
                      : 'var(--shadow-sm)',
                  transition: 'all 0.3s ease',
                }}>
                  {isWinner ? '💀' : '🙂'}
                </div>
                {/* Name tag */}
                <div style={{
                  background: isWinner ? 'var(--red)' : 'var(--surface)',
                  color: isWinner ? '#fff' : 'var(--ink-2)',
                  border: `1px solid ${isWinner ? 'transparent' : 'var(--border)'}`,
                  borderRadius: 6,
                  padding: '2px 7px',
                  fontSize: Math.max(9, 13 - N * 0.4),
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: -0.3,
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.3s ease',
                }}>
                  {p.name.slice(0, 8)}
                </div>
              </motion.div>
            );
          })}

          {/* Laser beam — SVG line from gun center to targeted player */}
          {(laserOn || phase === 'shoot') && winnerIdx !== null && (() => {
            const a = (winnerIdx / N) * TAU - Math.PI / 2;
            const tx = 50 + 40 * Math.cos(a);
            const ty = 50 + 40 * Math.sin(a);
            return (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 8 }} viewBox="0 0 100 100">
                <line x1="50" y1="50" x2={tx} y2={ty}
                  stroke="rgba(214,62,62,0.65)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
                <circle cx={tx} cy={ty} r="2" fill="var(--red)" opacity="0.7" />
              </svg>
            );
          })()}

          {/* Muzzle flash */}
          {showFlash && winnerIdx !== null && (() => {
            const a = (winnerIdx / N) * TAU - Math.PI / 2;
            /* flash appears at gun center offset toward barrel tip */
            const fx = 50 + 14 * Math.cos(a);
            const fy = 50 + 14 * Math.sin(a);
            return (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.13 }}
                style={{
                  position: 'absolute',
                  left: `${fx}%`, top: `${fy}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #fff8c0 0%, #f5a020 40%, rgba(214,62,62,0) 80%)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  filter: 'blur(2px)',
                }}
              />
            );
          })()}

          {/* GUN — center of arena, rotated via CSS transform */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: '55%', height: '55%',
            transform: 'translate(-50%, -50%)',
            zIndex: 15,
          }}>
            <motion.div
              animate={recoil ? { x: [-4, 4, -2, 0], y: [2, -2, 1, 0] } : {}}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%', height: '100%',
                transform: `rotate(${gunDeg}deg)`,
                transition: spinTransition,
                transformOrigin: 'center center',
              }}
            >
              <GunSVG />
            </motion.div>
          </div>

        </div>
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winnerName && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              textAlign: 'center',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '2px', color: 'var(--ink-4)', textTransform: 'uppercase' }}>
              target selected
            </p>
            <p className="winner-announcement">
              {winnerName}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin button */}
      <motion.button
        whileHover={isIdle ? { scale: 1.02 } : {}}
        whileTap={isIdle ? { scale: 0.97 } : {}}
        className="primary spin-btn"
        onClick={handleSpin}
        disabled={!isIdle}
        style={{ alignSelf: 'center' }}
      >
        {isIdle ? '🔫  Spin & Fire' : isDone ? '✓  Done' : 'Executing…'}
      </motion.button>

    </div>
  );
};

export default WheelScreen;