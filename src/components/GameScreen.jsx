// GameScreen.jsx
import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

const DiscussionScreen = ({ players, firstSpeaker, onComplete, onHome }) => {
  const [timeLeft, setTimeLeft] = useState(90);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
  }, [isActive, timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const isUrgent = timeLeft < 20;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - timeLeft / 90);

  return (
    <div className="screen-container discussion-screen" style={{ position: 'relative' }}>

      <button className="home-btn" onClick={onHome} title="Main Menu">
        <X size={14} strokeWidth={2.5} />
      </button>

      <motion.h2
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="title"
        style={{ fontSize: 'clamp(1.4rem,5vw,1.8rem)', letterSpacing: '-0.5px' }}
      >
        Discussion
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="info-badge glass"
      >
        <MessageSquare size={13} />
        <span>First speaker: <strong>{firstSpeaker}</strong></span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`timer-display ${isUrgent ? 'pulse-urgent' : ''}`}
      >
        {/* Circular ring */}
        <div style={{ position: 'relative', width: 90, height: 90 }}>
          <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r="40" fill="none" stroke="var(--bg-3)" strokeWidth="3" />
            <circle
              cx="45" cy="45" r="40"
              fill="none"
              stroke={isUrgent ? 'var(--red)' : 'var(--indigo)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference * 40 / 44}
              strokeDashoffset={(circumference * 40 / 44) * (1 - timeLeft / 90)}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color={isUrgent ? 'var(--red)' : 'var(--ink-4)'} />
          </div>
        </div>

        <h1 style={{ color: isUrgent ? 'var(--red)' : 'var(--ink)' }}>{formatTime(timeLeft)}</h1>

        <button className="timer-toggle" onClick={() => setIsActive(!isActive)}>
          {isActive ? '⏸  Pause' : timeLeft === 0 ? "Time's Up" : '▶  Start'}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rules-card"
      >
        <h3><AlertTriangle size={13} /> Rules</h3>
        <ul>
          <li>Describe your word or sentence without saying it directly.</li>
          <li>Question others — expose inconsistencies in their stories.</li>
          <li>The Imposter must convincingly fake knowing the secret.</li>
        </ul>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="primary big vote-nav-btn"
        onClick={onComplete}
        disabled={timeLeft > 60 && isActive}
      >
        Proceed to Vote <ChevronRight size={17} />
      </motion.button>

    </div>
  );
};

export default DiscussionScreen;