// ResultScreen.jsx
import React, { useState } from 'react';
import { Trophy, Skull, RotateCcw, Home, Info, AlertTriangle, BarChart2, X, Crown, Frown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResultScreen = ({ eliminatedPlayer, players, selectedData, isIntermediate, globalStats, onNextRound, onRestart, onReset }) => {
  const [showStats, setShowStats] = useState(false);

  const isImposterEliminated = eliminatedPlayer.role === 'imposter';
  const winners = isImposterEliminated ? 'CREWMATES' : 'IMPOSTER';

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.93 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { staggerChildren: 0.12, ease: [0.16, 1, 0.3, 1] }
    }
  };
  const itemVariants = {
    hidden: { y: 18, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { ease: [0.16, 1, 0.3, 1] } }
  };

  const crewWin = winners === 'CREWMATES' || isIntermediate;
  const hasStats = globalStats && Object.keys(globalStats).length > 0 && !isIntermediate;

  const statEntries = hasStats ? Object.entries(globalStats).map(([name, s]) => {
    const wins = s.imposterWins + s.crewWins;
    const losses = s.imposterLosses + s.crewLosses;
    return { name, ...s, wins, losses };
  }) : [];

  const mvp = hasStats && statEntries.length > 0 ? [...statEntries].sort((a, b) => b.wins - a.wins)[0] : null;
  const lvp = hasStats && statEntries.length > 0 ? [...statEntries].sort((a, b) => b.losses - a.losses)[0] : null;

  return (
    <div className="screen-container result-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`result-card card glass ${crewWin ? 'victory-glow' : 'defeat-glow'}`}
      >
        {/* Stats Button */}
        {hasStats && (
          <button className="stats-icon-btn" onClick={() => setShowStats(true)}>
            <BarChart2 size={22} />
          </button>
        )}
        {/* Icon */}
        <motion.div variants={itemVariants} className="icon-wrapper">
          {crewWin ? (
            <Trophy size={80} className="success-glow" />
          ) : (
            <Skull size={80} className="danger-glow" />
          )}
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="result-title-large">
          {isIntermediate
            ? 'IMPOSTER CAUGHT'
            : winners === 'CREWMATES'
              ? 'CREWMATES WIN'
              : 'IMPOSTER WINS'}
        </motion.h1>

        {/* Intermediate warning */}
        {isIntermediate && (
          <motion.p variants={itemVariants} className="intermediate-warning">
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6 }} />
            Another imposter remains...
          </motion.p>
        )}

        {/* Eliminated summary */}
        <motion.div variants={itemVariants} className="elimination-summary glass-dark">
          <p className="label">// ELIMINATED //</p>
          <div className="eliminated-player-info">
            <h2 className="name">{eliminatedPlayer.name}</h2>
            <span className={`role-tag-large ${eliminatedPlayer.role}`}>
              {eliminatedPlayer.role === 'imposter' ? '😈 THE IMPOSTER' : '👨‍🚀 CREWMATE'}
            </span>
          </div>
        </motion.div>

        {/* Secret reveal */}
        {!isIntermediate && (
          <motion.div variants={itemVariants} className="secret-reveal-box">
            <div className="reveal-header">
              <Info size={12} /> classified intel
            </div>
            <h2 className="secret-value">{selectedData.value}</h2>
            <p className="secret-hint">hint: {selectedData.hint}</p>
          </motion.div>
        )}

        {/* Full roles */}
        {!isIntermediate && (
          <motion.div variants={itemVariants} className="roles-recap">
            <h3>// FULL DOSSIER</h3>
            <div className="roles-grid">
              {players.map((p, i) => (
                <div
                  key={i}
                  className={`mini-role-card ${p.role} ${p.eliminated ? 'eliminated' : ''}`}
                >
                  <span className="name">{p.name}</span>
                  <span>{p.role === 'imposter' ? '😈' : '👨‍🚀'}</span>
                </div>
              ))}
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
              CONTINUE — ROUND 2
            </motion.button>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="action-buttons-row">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="primary"
              onClick={onRestart}
              style={{ fontSize: '0.75rem', padding: '14px 8px' }}
            >
              <RotateCcw size={15} style={{ flexShrink: 0 }} /> NEXT GAME <br/>(SAME SQUAD)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="secondary"
              onClick={onReset}
              style={{ fontSize: '0.75rem', padding: '14px 8px' }}
            >
              <Home size={15} style={{ flexShrink: 0 }} /> NEW GAME <br/>(MAIN MENU)
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="stats-modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="stats-modal card glass"
            >
              <button className="close-modal-btn" onClick={() => setShowStats(false)}>
                <X size={20} />
              </button>
              
              <h2 className="title" style={{ fontSize: '1.4rem', marginBottom: '20px' }}>SESSION STATS</h2>
              
              <div className="stats-table-wrapper">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th align="left">AGENT</th>
                      <th title="Imposter Wins/Losses">😈 W-L</th>
                      <th title="Crewmate Wins/Losses">👨‍🚀 W-L</th>
                      <th>TOTAL W/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statEntries.sort((a,b) => b.wins - a.wins).map((s, i) => (
                      <tr key={i}>
                        <td className="stat-name">{s.name}</td>
                        <td className="stat-imposter">{s.imposterWins} - {s.imposterLosses}</td>
                        <td className="stat-crew">{s.crewWins} - {s.crewLosses}</td>
                        <td className="stat-total"><strong>{s.wins}</strong> - {s.losses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="stats-highlights">
                {mvp && mvp.wins > 0 && (
                  <div className="highlight-card mvp">
                    <Crown size={22} className="highlight-icon" />
                    <div className="highlight-info">
                      <span className="label">MOST WINS (MVP)</span>
                      <span className="value">{mvp.name} ({mvp.wins})</span>
                    </div>
                  </div>
                )}
                {lvp && lvp.losses > 0 && (
                  <div className="highlight-card lvp">
                    <Frown size={22} className="highlight-icon" />
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