// VotingScreen.jsx
import React, { useState } from 'react';
import { UserX, Fingerprint, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VotingScreen = ({ players, onVoteComplete, onHome }) => {
  const [activeVoterIndex, setActiveVoterIndex] = useState(0);
  const [votes, setVotes] = useState({});
  const [lastVotedIdx, setLastVotedIdx] = useState(null);
  const [voteLog, setVoteLog] = useState([]); // [{voterName, targetName}]

  const activePlayers = players
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter(p => !p.eliminated);
  const currentVoter = activePlayers[activeVoterIndex];
  const progress = ((activeVoterIndex + 1) / activePlayers.length) * 100;

  const handleVote = (targetOriginalIndex) => {
    setLastVotedIdx(targetOriginalIndex);
    const newLog = [...voteLog, {
      voterName: currentVoter.name,
      targetName: activePlayers.find(p => p.originalIndex === targetOriginalIndex)?.name || '',
    }];
    setVoteLog(newLog);
    setTimeout(() => {
      const newVotes = { ...votes, [targetOriginalIndex]: (votes[targetOriginalIndex] || 0) + 1 };
      setVotes(newVotes);
      setLastVotedIdx(null);
      if (activeVoterIndex < activePlayers.length - 1) {
        setActiveVoterIndex(activeVoterIndex + 1);
      } else {
        onVoteComplete(newVotes, newLog);
      }
    }, 300);
  };

  return (
    <div className="screen-container voting-screen" style={{ position: 'relative' }}>

      <button className="home-btn" onClick={onHome} title="Main Menu">
        <X size={14} strokeWidth={2.5} />
      </button>

      <motion.h2
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="title"
        style={{ fontSize: 'clamp(1.6rem,6vw,2rem)', letterSpacing: '-0.5px' }}
      >
        Vote
      </motion.h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeVoterIndex}
          initial={{ x: 40, opacity: 0, scale: 0.97 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -40, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="voter-info-card card glass"
        >
          <div className="pass-msg">
            <Fingerprint size={14} className="icon-burn" />
            <span>pass device to</span>
          </div>
          <h1 className="voter-name">{currentVoter.name}</h1>
          <p className="instruction">cast your secret vote</p>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="voting-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        {activePlayers
          .filter(p => p.originalIndex !== currentVoter.originalIndex)
          .map((p, i) => {
            const isVoted = lastVotedIdx === p.originalIndex;
            return (
              <motion.button
                key={p.originalIndex}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, scale: isVoted ? [1, 0.86, 1.06, 1] : 1 }}
                transition={{ delay: i * 0.055, scale: { duration: 0.32 } }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.92 }}
                className="vote-card card"
                onClick={() => handleVote(p.originalIndex)}
                style={{
                  boxShadow: isVoted
                    ? '0 0 0 2px var(--red), 0 8px 28px rgba(214,62,62,0.22)'
                    : '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1.5px var(--border)',
                  border: 'none',
                  background: 'var(--surface)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <div className="vote-card-glow" />
                <div className="avatar-circle">
                  <UserX size={16} />
                </div>
                <span className="player-name">{p.name}</span>
              </motion.button>
            );
          })}
      </motion.div>

      <motion.div
        className="vote-progress"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="progress-labels">
          <span>Voting progress</span>
          <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>
            {activeVoterIndex + 1} <span style={{ color: 'var(--ink-4)' }}>/ {activePlayers.length}</span>
          </span>
        </div>
        <div className="progress-bar-track">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>

    </div>
  );
};

export default VotingScreen;