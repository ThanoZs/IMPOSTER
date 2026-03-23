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
      setError('Name already taken');
      setTimeout(() => setError(''), 2500);
      return;
    }
    if (players.length >= 10) {
      setError('Max 10 players');
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
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hero-section"
      >
        <h1 className="title">IMPOSTER</h1>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mode-selector card glass"
      >
        <p className="section-title">
          <Users size={11} /> Mission Type
        </p>
        <div className="mode-buttons">
          <button
            className={gameMode === 'WORD' ? 'active' : ''}
            onClick={() => setGameMode('WORD')}
          >
            <Zap size={11} /> Word
          </button>
          <button
            className={gameMode === 'SENTENCE' ? 'active' : ''}
            onClick={() => setGameMode('SENTENCE')}
          >
            <Zap size={11} /> Sentence
          </button>
        </div>
      </motion.div>

      {/* Player Setup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="player-setup-card card glass"
      >
        <form onSubmit={handleAdd} className="input-row">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Player name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={12}
              autoComplete="off"
            />
            {newName && (
              <button type="button" className="clear-btn" onClick={() => setNewName('')}>
                <X size={11} />
              </button>
            )}
          </div>
          <motion.button
            type="submit"
            className="add-btn primary"
            disabled={!newName.trim()}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={18} />
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
            Players — <span style={{ color: players.length >= 10 ? 'var(--red)' : 'var(--indigo)' }}>{players.length}</span>
            <span style={{ color: 'var(--ink-4)' }}>/10</span>
          </div>
          <div className="player-list">
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <motion.div
                  key={p.name}
                  layout
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 16, opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  className="player-item"
                >
                  <div className="player-info">
                    <User size={13} className="user-icon" />
                    <span>{p.name}</span>
                  </div>
                  <button onClick={() => onRemovePlayer(i)} className="remove-btn" type="button">
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {players.length === 0 && <p className="empty-msg">No players yet</p>}
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        className="primary big start-btn"
        onClick={onStartGame}
        disabled={players.length < 3}
      >
        <Play size={17} /> Start Game
      </motion.button>

      {players.length < 3 && (
        <p style={{
          textAlign: 'center', fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem', letterSpacing: '1.5px', color: 'var(--ink-4)', marginTop: '-6px',
        }}>
          Minimum 3 players required
        </p>
      )}
    </div>
  );
};

export default SetupScreen;