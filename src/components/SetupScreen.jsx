// SetupScreen.jsx
import React, { useState } from 'react';
import { User, Plus, Trash2, Play, Users, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SetupScreen = ({ players, onAddPlayer, onRemovePlayer, onStartGame, gameMode, setGameMode }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Agent ID already taken');
      setTimeout(() => setError(''), 2500);
      return;
    }

    if (players.length >= 10) {
      setError('Squad capacity reached');
      setTimeout(() => setError(''), 2500);
      return;
    }

    onAddPlayer(trimmed);
    setNewName('');
    setError('');
  };

  return (
    <div className="screen-container setup-screen">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="hero-section"
      >
        <h1 className="title title-glitch" data-text="IMPOSTER">IMPOSTER</h1>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mode-selector card glass"
      >
        <p className="section-title">
          <Users size={12} /> Mission Type
        </p>
        <div className="mode-buttons">
          <button
            className={gameMode === 'WORD' ? 'active' : ''}
            onClick={() => setGameMode('WORD')}
          >
            <Zap size={12} /> WORD
          </button>
          <button
            className={gameMode === 'SENTENCE' ? 'active' : ''}
            onClick={() => setGameMode('SENTENCE')}
          >
            <Zap size={12} /> SENTENCE
          </button>
        </div>
      </motion.div>

      {/* Player Setup */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="player-setup-card card glass"
      >
        <form onSubmit={handleAdd} className="input-row">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Agent codename..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={12}
              autoComplete="off"
            />
            {newName && (
              <button type="button" className="clear-btn" onClick={() => setNewName('')}>
                <X size={12} />
              </button>
            )}
          </div>
          <motion.button
            type="submit"
            className="add-btn primary"
            disabled={!newName.trim()}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={20} />
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="error-text"
            >
              ⚠ {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="player-list-container">
          <div className="list-header">
            AGENTS ENLISTED —&nbsp;
            <span style={{ color: players.length >= 10 ? 'var(--blood)' : 'var(--plasma)' }}>
              {players.length}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>/10</span>
          </div>
          <div className="player-list">
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <motion.div
                  key={p.name}
                  layout
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="player-item"
                >
                  <div className="player-info">
                    <User size={14} className="user-icon" />
                    <span>{p.name}</span>
                  </div>
                  <button
                    onClick={() => onRemovePlayer(i)}
                    className="remove-btn"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length === 0 && (
              <p className="empty-msg">// no agents enlisted //</p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        className="primary big start-btn"
        onClick={onStartGame}
        disabled={players.length < 3}
      >
        <Play size={18} /> DEPLOY MISSION
      </motion.button>

      {players.length < 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '2px',
            color: 'var(--text-muted)',
            marginTop: '-12px'
          }}
        >
          MINIMUM 3 AGENTS REQUIRED
        </motion.p>
      )}
    </div>
  );
};

export default SetupScreen;