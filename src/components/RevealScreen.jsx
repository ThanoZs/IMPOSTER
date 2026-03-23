// RevealScreen.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRight, Shield, Skull, X, Lock } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

const HOLD_DURATION = 800; // ms to hold before fully revealed

const RevealScreen = ({ players, selectedData, startIndex = 0, onComplete, onHome }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [holding, setHolding] = useState(false);   // actively pressing
  const [revealed, setRevealed] = useState(false);   // fully unlocked during this hold
  const [hasSeenOnce, setHasSeenOnce] = useState(false);   // unlocks Next button
  const [ringPct, setRingPct] = useState(0);       // 0-100 fill
  const holdTimer = useRef(null);
  const holdStart = useRef(null);
  const animFrameRef = useRef(null);

  const currentPlayer = players[currentIndex];
  const orderedIndices = Array.from({ length: players.length }, (_, i) => (startIndex + i) % players.length);
  const currentPos = orderedIndices.indexOf(currentIndex);
  const isLast = currentPos === orderedIndices.length - 1;

  /* cancel any running animation */
  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);

  /* cleanup on unmount */
  useEffect(() => () => stopAnimation(), [stopAnimation]);

  /* reset when player changes */
  useEffect(() => {
    stopAnimation();
    setHolding(false);
    setRevealed(false);
    setHasSeenOnce(false);
    setRingPct(0);
  }, [currentIndex, stopAnimation]);

  /* ── Press start ── */
  const onPressStart = useCallback((e) => {
    e.preventDefault();
    if (revealed) return; // already open — just keep showing

    stopAnimation();
    setHolding(true);
    holdStart.current = performance.now();

    const tick = (now) => {
      const elapsed = now - holdStart.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setRingPct(pct);
      if (pct < 100) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setRevealed(true);
        setHasSeenOnce(true);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [revealed, stopAnimation]);

  /* ── Press end / cancel ── */
  const onPressEnd = useCallback(() => {
    stopAnimation();
    setHolding(false);
    if (!revealed) {
      /* animate ring back to 0 */
      const startPct = ringPct;
      const startTime = performance.now();
      const fade = (now) => {
        const t = Math.min((now - startTime) / 250, 1);
        setRingPct(startPct * (1 - t));
        if (t < 1) animFrameRef.current = requestAnimationFrame(fade);
        else setRingPct(0);
      };
      animFrameRef.current = requestAnimationFrame(fade);
    } else {
      /* held long enough — hide when released */
      setRevealed(false);
      setRingPct(100);
      const startTime = performance.now();
      const fade = (now) => {
        const t = Math.min((now - startTime) / 300, 1);
        setRingPct(100 * (1 - t));
        if (t < 1) animFrameRef.current = requestAnimationFrame(fade);
        else setRingPct(0);
      };
      animFrameRef.current = requestAnimationFrame(fade);
    }
  }, [revealed, ringPct, stopAnimation]);

  const handleNext = () => {
    stopAnimation();
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex(orderedIndices[currentPos + 1]);
    }
  };

  /* ring SVG values */
  const R = 70;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - ringPct / 100);

  const isImposter = currentPlayer.role === 'imposter';

  return (
    <div className="screen-container reveal-screen" style={{ position: 'relative', userSelect: 'none' }}>

      {/* Home button */}
      <button className="home-btn" onClick={onHome} title="Main Menu">
        <X size={14} strokeWidth={2.5} />
      </button>

      <motion.h2
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="title"
        style={{ fontSize: 'clamp(1.3rem,5vw,1.6rem)', letterSpacing: '-0.5px' }}
      >
        Secret Briefing
      </motion.h2>

      {/* Pass device */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="device-pass-msg"
        >
          <p>pass device to</p>
          <h1 className="player-name-large">{currentPlayer.name}</h1>
          {currentPos === 0 && startIndex !== 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--indigo)', letterSpacing: '1.5px', marginTop: 4 }}>
              · first pick ·
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hold card */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>

        {/* Ring + card wrapper */}
        <div style={{ position: 'relative', width: '100%' }}>

          {/* Progress ring — sits behind card, visible as border ring */}
          <svg
            style={{
              position: 'absolute',
              inset: -6,
              width: 'calc(100% + 12px)',
              height: 'calc(100% + 12px)',
              pointerEvents: 'none',
              zIndex: 2,
              borderRadius: 22,
              overflow: 'visible',
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <rect
              x="1" y="1" width="98" height="98" rx="10"
              fill="none"
              stroke='rgba(79,70,229,0.10)'
              strokeWidth="1.5"
            />
            <rect
              x="1" y="1" width="98" height="98" rx="10"
              fill="none"
              stroke='var(--indigo)'
              strokeWidth="2"
              strokeDasharray={`${CIRC * 0.01} ${CIRC * 100}`}
              strokeDashoffset="0"
              style={{
                strokeDasharray: `${(ringPct / 100) * (2 * (96 + 96))} ${2 * (96 + 96)}`,
                strokeLinecap: 'round',
                transition: holding ? 'none' : 'stroke-dasharray 0.05s',
                filter: ringPct > 0 ? 'drop-shadow(0 0 3px rgba(79,70,229,0.4))' : 'none',
              }}
            />
          </svg>

          {/* The card itself */}
          <motion.div
            className="reveal-card card"
            style={{
              minHeight: 260,
              cursor: hasSeenOnce && !holding && !revealed ? 'default' : 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'none',
              border: `1.5px solid ${revealed
                  ? (isImposter ? 'rgba(214,62,62,0.35)' : 'rgba(22,163,74,0.35)')
                  : holding
                    ? 'rgba(79,70,229,0.28)'
                    : 'var(--border)'
                }`,
              background: revealed
                ? (isImposter ? 'rgba(253,241,241,0.9)' : 'rgba(240,253,244,0.9)')
                : holding
                  ? 'rgba(240,239,255,0.6)'
                  : 'var(--surface)',
              transition: 'border-color 0.2s ease, background 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onPointerDown={onPressStart}
            onPointerUp={onPressEnd}
            onPointerLeave={onPressEnd}
            onPointerCancel={onPressEnd}
            onContextMenu={e => e.preventDefault()}
          >
            {/* Ripple fill overlay while holding */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(79,70,229,0.07) 0%, transparent 70%)',
                opacity: holding ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: 'none',
                borderRadius: 'inherit',
              }}
            />

            <AnimatePresence mode="wait">
              {!revealed ? (
                /* ── LOCKED state ── */
                <motion.div
                  key="locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 14, padding: '36px 24px',
                    pointerEvents: 'none',
                  }}
                >
                  {/* Lock icon with ring */}
                  <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <svg width="80" height="80" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-3)" strokeWidth="3" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke='var(--indigo)'
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - ringPct / 100)}
                        style={{ transition: holding ? 'none' : 'stroke-dashoffset 0.1s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <motion.div
                        animate={holding ? { scale: [1, 0.9, 1], rotate: [0, -5, 5, 0] } : {}}
                        transition={{ duration: 0.4, repeat: Infinity }}
                      >
                        <Lock
                          size={26}
                          color={holding ? 'var(--indigo)' : 'var(--ink-4)'}
                          style={{ transition: 'color 0.2s ease' }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: holding ? 'var(--indigo)' : 'var(--ink-3)',
                      letterSpacing: '0.02em',
                      transition: 'color 0.2s ease',
                      marginBottom: 4,
                    }}>
                      {holding
                        ? (ringPct < 100 ? 'Keep holding…' : 'Unlocking!')
                        : hasSeenOnce
                          ? 'Hold to peek again'
                          : 'Hold to reveal'}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      color: 'var(--ink-4)',
                      letterSpacing: '1.5px',
                    }}>
                      {holding ? `${Math.round(ringPct)}%` : 'press & hold'}
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* ── REVEALED state ── */
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 12, padding: '28px 20px',
                    pointerEvents: 'none',
                    width: '100%',
                  }}
                >
                  {isImposter ? (
                    <>
                      <motion.div
                        initial={{ scale: 0.5, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                      >
                        <Skull size={42} color="var(--red)" />
                      </motion.div>
                      <h2 className="danger-text" style={{ fontSize: '1.15rem' }}>You are the Imposter</h2>
                      <p style={{ color: 'var(--ink-4)', fontSize: '0.82rem', marginTop: -6, textAlign: 'center' }}>
                        Blend in. Deceive. Win.
                      </p>
                      <div className="mystery-box" style={{ fontSize: '1.7rem', padding: '12px 28px' }}>???</div>
                      <div className="hint-card" style={{ width: '100%' }}>
                        <p className="hint-label">intel fragment</p>
                        <p className="hint-text">{selectedData.hint}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0.5, rotate: 15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                      >
                        <Shield size={42} color="var(--green)" />
                      </motion.div>
                      <h2 className="success-text" style={{ fontSize: '1.1rem' }}>You are a Crewmate</h2>
                      <p style={{ color: 'var(--ink-4)', fontSize: '0.82rem', marginTop: -6, textAlign: 'center' }}>
                        Find the imposter. Protect the crew.
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--ink-4)', textTransform: 'uppercase' }}>
                        The secret is:
                      </p>
                      <div className="word-box" style={{ fontSize: '1.4rem', padding: '12px 28px' }}>
                        {selectedData.value}
                      </div>
                    </>
                  )}

                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--ink-4)', letterSpacing: '1.5px', marginTop: 4 }}>
                    release to hide
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Next button — only appears after player has held once */}
        <AnimatePresence>
          {hasSeenOnce && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="primary next-btn"
              style={{ width: '100%', marginTop: 2 }}
              onClick={handleNext}
            >
              {isLast
                ? <>Begin Mission <ChevronRight size={15} /></>
                : <>Next Agent <ChevronRight size={15} /></>
              }
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="progress-dots">
        {orderedIndices.map((playerIdx, pos) => (
          <motion.div
            key={playerIdx}
            className={`dot ${playerIdx === currentIndex ? 'active' : pos < currentPos ? 'completed' : ''}`}
            layout
          />
        ))}
      </div>

    </div>
  );
};

export default RevealScreen;