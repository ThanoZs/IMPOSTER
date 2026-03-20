import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

const RevealScreen = ({ players, selectedData, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentPlayer = players[currentIndex];

  const handleNext = () => {
    setIsRevealed(false);
    if (currentIndex < players.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="screen-container reveal-screen">
      <h2 className="title">Secret Reveal</h2>
      
      <div className="device-pass-msg">
        <p>Pass the device to:</p>
        <h1 className="player-name-large">{currentPlayer.name}</h1>
      </div>

      <div className={`reveal-card card glass ${isRevealed ? 'revealed' : ''}`}>
        {!isRevealed ? (
          <div className="reveal-prompt" onClick={() => setIsRevealed(true)}>
            <Eye size={48} />
            <p>Tap to Reveal</p>
          </div>
        ) : (
          <div className="reveal-content">
            {currentPlayer.role === "imposter" ? (
              <div className="role-imposter">
                <h2 className="danger-text">You are IMPOSTER 😈</h2>
                <p>Try to blend in! You don't know the word.</p>
                <div className="mystery-box">???</div>
                <div className="hint-card glass">
                  <p className="hint-label">Psst! Here's a clue:</p>
                  <p className="hint-text">{selectedData.hint}</p>
                </div>
              </div>
            ) : (
              <div className="role-player">
                <h2 className="success-text">You are Crewmate 👨‍🚀</h2>
                <p>The secret is:</p>
                <div className="word-box">{selectedData.value}</div>
              </div>
            )}
            <button className="primary next-btn" onClick={handleNext}>
              {currentIndex < players.length - 1 ? "Next Player" : "Continue"}
            </button>
          </div>
        )}
      </div>

      <div className="progress-dots">
        {players.map((_, i) => (
          <div key={i} className={`dot ${i === currentIndex ? 'active' : i < currentIndex ? 'completed' : ''}`} />
        ))}
      </div>
    </div>
  );
};

export default RevealScreen;
