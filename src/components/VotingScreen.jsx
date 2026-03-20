import React, { useState } from 'react';
import { Gavel, UserX, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VotingScreen = ({ players, onVoteComplete }) => {
  const [activeVoterIndex, setActiveVoterIndex] = useState(0);
  const [votes, setVotes] = useState({}); // { originalIndex: count }

  const activePlayers = players.map((p, i) => ({ ...p, originalIndex: i })).filter(p => !p.eliminated);
  const currentVoter = activePlayers[activeVoterIndex];

  const handleVote = (targetOriginalIndex) => {
    const newVotes = { ...votes, [targetOriginalIndex]: (votes[targetOriginalIndex] || 0) + 1 };
    setVotes(newVotes);

    if (activeVoterIndex < activePlayers.length - 1) {
      setActiveVoterIndex(activeVoterIndex + 1);
    } else {
      onVoteComplete(newVotes);
    }
  };

  return (
    <div className="screen-container voting-screen">
      <motion.h2 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="title"
      >
        Voting Time
      </motion.h2>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeVoterIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="voter-info-card card glass"
        >
          <div className="pass-msg">
            <Fingerprint size={24} className="icon-burn" />
            <span>Pass the device to:</span>
          </div>
          <h1 className="voter-name">{currentVoter.name}</h1>
          <p className="instruction">Cast your secret vote!</p>
        </motion.div>
      </AnimatePresence>

      <div className="voting-grid">
        {activePlayers.map((p) => {
          const isSelf = p.originalIndex === currentVoter.originalIndex;
          return (
            <motion.button 
              key={p.originalIndex} 
              whileHover={{ scale: isSelf ? 1 : 1.05 }}
              whileTap={{ scale: isSelf ? 1 : 0.95 }}
              className={`vote-card card glass ${isSelf ? 'self-disabled' : ''}`}
              onClick={() => handleVote(p.originalIndex)}
              disabled={isSelf}
            >
              <div className="avatar-circle">
                <UserX size={20} />
              </div>
              <span className="player-name">{p.name}</span>
              {isSelf && <span className="self-badge">YOU</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="vote-progress">
        <div className="progress-labels">
          <span>Voting Progress</span>
          <span>{activeVoterIndex + 1} / {activePlayers.length}</span>
        </div>
        <div className="progress-bar-track">
          <motion.div 
            className="progress-bar-fill" 
            initial={{ width: 0 }}
            animate={{ width: `${((activeVoterIndex + 1) / activePlayers.length) * 100}%` }}
          ></motion.div>
        </div>
      </div>
    </div>
  );
};

export default VotingScreen;
