// ResultScreen.jsx
import React, { useState } from 'react';
import { Trophy, Skull, RotateCcw, Home, Info, AlertTriangle, BarChart2, X, Crown, Frown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResultScreen = ({ eliminatedPlayer, players, selectedData, isIntermediate, globalStats, voteLog = [], onNextRound, onRestart, onReset, onHome }) => {
  const [showStats, setShowStats] = useState(false);

  const isImposterEliminated = eliminatedPlayer.role === 'imposter';
  const crewWin = isImposterEliminated;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.1, ease: [0.16, 1, 0.3, 1] } }
  };
  const itemVariants = {
    hidden: { y: 14, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { ease: [0.16, 1, 0.3, 1] } }
  };

  const hasStats = globalStats && Object.keys(globalStats).length > 0 && !isIntermediate;
  const statEntries = hasStats
    ? Object.entries(globalStats).map(([name, s]) => ({
      name, ...s,
      wins: s.imposterWins + s.crewWins,
      losses: s.imposterLosses + s.crewLosses,
    }))
    : [];
  const mvp = statEntries.length ? [...statEntries].sort((a, b) => b.wins - a.wins)[0] : null;
  const lvp = statEntries.length ? [...statEntries].sort((a, b) => b.losses - a.losses)[0] : null;

  return (
    <div className="screen-container result-screen" style={{ position: 'relative' }}>

      {/* Home button */}
      <button className="home-btn" onClick={onHome} title="Main Menu">
        <X size={14} strokeWidth={2.5} />
      </button>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`result-card card glass ${(crewWin || isIntermediate) ? 'victory-glow' : 'defeat-glow'}`}
      >
        {/* Stats button */}
        {hasStats && (
          <button className="stats-icon-btn" onClick={() => setShowStats(true)}>
            <BarChart2 size={18} />
          </button>
        )}

        {/* Icon */}
        <motion.div variants={itemVariants} className="icon-wrapper">
          {(crewWin || isIntermediate)
            ? <Trophy size={68} className="success-glow" />
            : <Skull size={68} className="danger-glow" />
          }
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="result-title-large">
          {isIntermediate ? 'Imposter Caught!' : crewWin ? 'Crewmates Win!' : 'Imposter Wins!'}
        </motion.h1>

        {isIntermediate && (
          <motion.p variants={itemVariants} className="intermediate-warning">
            <AlertTriangle size={15} /> Another imposter remains…
          </motion.p>
        )}

        {/* Eliminated */}
        <motion.div variants={itemVariants} className="elimination-summary glass-dark">
          <p className="label">eliminated</p>
          <div className="eliminated-player-info">
            <h2 className="name">{eliminatedPlayer.name}</h2>
            <span className={`role-tag-large ${eliminatedPlayer.role}`}>
              {eliminatedPlayer.role === 'imposter' ? '😈 The Imposter' : '🙂 Crewmate'}
            </span>
          </div>
        </motion.div>

        {/* Secret */}
        {!isIntermediate && (
          <motion.div variants={itemVariants} className="secret-reveal-box">
            <div className="reveal-header">
              <Info size={11} /> The secret was
            </div>
            <h2 className="secret-value">{selectedData.value}</h2>
            <p className="secret-hint">Hint: {selectedData.hint}</p>
          </motion.div>
        )}

        {/* Full roles */}
        {!isIntermediate && (
          <motion.div variants={itemVariants} className="roles-recap">
            <h3>Full roles</h3>
            <div className="roles-grid">
              {players.map((p, i) => (
                <div key={i} className={`mini-role-card ${p.role} ${p.eliminated ? 'eliminated' : ''}`}>
                  <span className="name">{p.name}</span>
                  <span>{p.role === 'imposter' ? '😈' : '🙂'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        {/* Vote breakdown */}
        {!isIntermediate && voteLog.length > 0 && (
          <motion.div variants={itemVariants} className="roles-recap" style={{ marginBottom: 18 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🗳</span> Who voted for whom
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Group votes by target */}
              {(() => {
                const grouped = {};
                voteLog.forEach(({ voterName, targetName }) => {
                  if (!grouped[targetName]) grouped[targetName] = [];
                  grouped[targetName].push(voterName);
                });
                return Object.entries(grouped)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([target, voters]) => {
                    const isElim = target === eliminatedPlayer.name;
                    return (
                      <div key={target} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 13px',
                        borderRadius: 'var(--radius-sm)',
                        background: isElim ? 'var(--red-light)' : 'var(--bg-2)',
                        border: `1px solid ${isElim ? 'rgba(214,62,62,0.22)' : 'var(--border-2)'}`,
                        flexWrap: 'wrap',
                      }}>
                        {/* Target */}
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: isElim ? 'var(--red)' : 'var(--ink)',
                          minWidth: 70,
                          flexShrink: 0,
                        }}>
                          {target}
                        </span>
                        {/* Vote count badge */}
                        <span style={{
                          background: isElim ? 'var(--red)' : 'var(--bg-3)',
                          color: isElim ? '#fff' : 'var(--ink-3)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 8px',
                          borderRadius: 100,
                          flexShrink: 0,
                        }}>
                          {voters.length} vote{voters.length !== 1 ? 's' : ''}
                        </span>
                        {/* Arrow */}
                        <span style={{ color: 'var(--ink-4)', fontSize: '0.75rem', flexShrink: 0 }}>←</span>
                        {/* Voter names */}
                        <span style={{
                          fontSize: '0.78rem',
                          color: 'var(--ink-3)',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.5px',
                        }}>
                          {voters.join(', ')}
                        </span>
                      </div>
                    );
                  });
              })()}
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        {isIntermediate ? (
          <motion.div variants={itemVariants} style={{ width: '100%' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="primary big"
              onClick={onNextRound}
              style={{ width: '100%' }}
            >
              Continue — Round 2
            </motion.button>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="action-buttons-row">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              className="primary"
              onClick={onRestart}
              style={{ fontSize: '0.78rem', padding: '13px 8px' }}
            >
              <RotateCcw size={14} /> Same Squad
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              className="secondary"
              onClick={onReset}
              style={{ fontSize: '0.78rem', padding: '13px 8px' }}
            >
              <Home size={14} /> New Game
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Stats modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="stats-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              className="stats-modal card glass"
            >
              <button className="close-modal-btn" onClick={() => setShowStats(false)}>
                <X size={18} />
              </button>

              <h2 className="title" style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Session Stats</h2>

              <div className="stats-table-wrapper">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th align="left">Player</th>
                      <th>😈 W–L</th>
                      <th>🙂 W–L</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...statEntries].sort((a, b) => b.wins - a.wins).map((s, i) => (
                      <tr key={i}>
                        <td className="stat-name">{s.name}</td>
                        <td className="stat-imposter">{s.imposterWins}–{s.imposterLosses}</td>
                        <td className="stat-crew">{s.crewWins}–{s.crewLosses}</td>
                        <td className="stat-total"><strong>{s.wins}</strong>–{s.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="stats-highlights">
                {mvp && mvp.wins > 0 && (
                  <div className="highlight-card mvp">
                    <Crown size={20} className="highlight-icon" />
                    <div className="highlight-info">
                      <span className="label">MOST WINS</span>
                      <span className="value">{mvp.name} ({mvp.wins})</span>
                    </div>
                  </div>
                )}
                {lvp && lvp.losses > 0 && (
                  <div className="highlight-card lvp">
                    <Frown size={20} className="highlight-icon" />
                    <div className="highlight-info">
                      <span className="label">MOST LOSSES</span>
                      <span className="value">{lvp.name} ({lvp.losses})</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultScreen;