import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, AlertTriangle } from 'lucide-react';

const DiscussionScreen = ({ players, firstSpeaker, onComplete }) => {
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="screen-container discussion-screen">
      <h2 className="title">Discussion Round</h2>

      <div className="info-badge glass">
        <MessageSquare size={16} /> <span>First Speaker: <strong>{firstSpeaker}</strong></span>
      </div>

      <div className={`timer-display card glass ${timeLeft < 20 ? 'pulse-urgent' : ''}`}>
        <Clock size={32} />
        <h1>{formatTime(timeLeft)}</h1>
        <button onClick={() => setIsActive(!isActive)} className="timer-toggle">
          {isActive ? "Pause" : timeLeft === 0 ? "Time's Up!" : "Start Timer"}
        </button>
      </div>

      <div className="rules-card card glass">
        <h3><AlertTriangle size={18} /> Rules</h3>
        <ul>
          <li>Describe your word/sentence without saying it.</li>
          <li>Ask questions to find the imposter.</li>
          <li>Imposter must act like they know the secret.</li>
        </ul>
      </div>

      <button className="primary vote-nav-btn" onClick={onComplete} disabled={timeLeft > 60 && isActive}>
        Move to Voting
      </button>
    </div>
  );
};

export default DiscussionScreen;
