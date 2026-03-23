// App.jsx
import React, { useState } from 'react';
import { PHASES, wordData, sentenceData } from './constants/gameData';
import SetupScreen from './components/SetupScreen';
import WheelScreen from './components/WheelScreen';
import RevealScreen from './components/RevealScreen';
import DiscussionScreen from './components/GameScreen';
import VotingScreen from './components/VotingScreen';
import ResultScreen from './components/ResultScreen';
import './index.css';

function App() {
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [players, setPlayers] = useState([]);
  const [gameMode, setGameMode] = useState('WORD');
  const [selectedData, setSelectedData] = useState(null);
  const [firstPicker, setFirstPicker] = useState('');
  const [firstSpeaker, setFirstSpeaker] = useState('');
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [votingRound, setVotingRound] = useState(1);
  const [globalStats, setGlobalStats] = useState({});
  const [voteLog, setVoteLog] = useState([]);  // [{voterName, targetName}]
  // Index of player who won the picker spin — they pick their card first in RevealScreen
  const [pickerIdx, setPickerIdx] = useState(0);

  const goHome = () => {
    setPlayers([]);
    setGlobalStats({});
    setPhase(PHASES.SETUP);
  };

  const addPlayer = (name) => {
    setPlayers(prev => [...prev, { name, role: 'crewmate', eliminated: false }]);
  };

  const removePlayer = (index) => {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const startGame = () => {
    if (players.length < 3) return;

    const newPlayers = players.map(p => ({ ...p, role: 'crewmate', eliminated: false }));

    let imposterCount = 1;
    if (players.length >= 4) imposterCount = Math.random() < 0.5 ? 1 : 2;

    const indices = Array.from({ length: players.length }, (_, i) => i);
    for (let i = 0; i < imposterCount; i++) {
      const randomIdx = Math.floor(Math.random() * indices.length);
      const playerIdx = indices.splice(randomIdx, 1)[0];
      newPlayers[playerIdx].role = 'imposter';
    }

    setPlayers(newPlayers);

    const dataSet = gameMode === 'WORD' ? wordData : sentenceData;
    const randomItem = dataSet[Math.floor(Math.random() * dataSet.length)];
    setSelectedData(randomItem);

    setVotingRound(1);
    setPhase(PHASES.WHEEL_PICKER);
  };

  const handlePickerResult = (pickerName) => {
    setFirstPicker(pickerName);
    // Find index of picker so RevealScreen starts with them
    const idx = players.findIndex(p => p.name === pickerName);
    setPickerIdx(idx >= 0 ? idx : 0);
    setPhase(PHASES.REVEAL);
  };

  const handleRevealComplete = () => {
    setPhase(PHASES.WHEEL_SPEAKER);
  };

  const handleSpeakerResult = (speaker) => {
    setFirstSpeaker(speaker);
    setPhase(PHASES.DISCUSSION);
  };

  const handleDiscussionComplete = () => {
    setPhase(PHASES.VOTING);
  };

  const handleVoteComplete = (votes, log = []) => {
    setVoteLog(log);
    let maxVotes = 0;
    const voteCounts = {};

    Object.keys(votes).forEach(idx => {
      voteCounts[idx] = votes[idx];
      if (votes[idx] > maxVotes) maxVotes = votes[idx];
    });

    const candidates = Object.keys(voteCounts).filter(idx => voteCounts[idx] === maxVotes);

    if (candidates.length > 1) {
      alert('⚠️ DRAW — Multiple agents received equal votes. Vote again!');
      setVotingRound(r => r + 1);
      return;
    }

    const eliminatedIdx = parseInt(candidates[0]);
    const eliminated = players[eliminatedIdx];

    const updatedPlayers = players.map((p, i) =>
      i === eliminatedIdx ? { ...p, eliminated: true } : p
    );
    setPlayers(updatedPlayers);
    setEliminatedPlayer(eliminated);

    const activeImposters = updatedPlayers.filter(p => p.role === 'imposter' && !p.eliminated);

    if (eliminated.role === 'imposter' && activeImposters.length > 0) {
      setPhase(PHASES.INTERMEDIATE_RESULT);
    } else {
      const crewWin = eliminated.role === 'imposter';
      const newStats = { ...globalStats };
      updatedPlayers.forEach(p => {
        if (!newStats[p.name]) {
          newStats[p.name] = { imposterWins: 0, imposterLosses: 0, crewWins: 0, crewLosses: 0 };
        }
        if (p.role === 'imposter') {
          crewWin ? newStats[p.name].imposterLosses++ : newStats[p.name].imposterWins++;
        } else {
          crewWin ? newStats[p.name].crewWins++ : newStats[p.name].crewLosses++;
        }
      });
      setGlobalStats(newStats);
      setPhase(PHASES.RESULT);
    }
  };

  const nextRound = () => { setVotingRound(1); setPhase(PHASES.DISCUSSION); };
  const restart = () => startGame();
  const reset = () => goHome();

  return (
    <div className="app-main">
      {phase === PHASES.SETUP && (
        <SetupScreen
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onStartGame={startGame}
          gameMode={gameMode}
          setGameMode={setGameMode}
        />
      )}

      {phase === PHASES.WHEEL_PICKER && (
        <WheelScreen
          players={players}
          type="PICKER"
          onFinish={handlePickerResult}
          onHome={goHome}
        />
      )}

      {phase === PHASES.REVEAL && (
        <RevealScreen
          players={players}
          selectedData={selectedData}
          startIndex={pickerIdx}
          onComplete={handleRevealComplete}
          onHome={goHome}
        />
      )}

      {phase === PHASES.WHEEL_SPEAKER && (
        <WheelScreen
          players={players}
          type="SPEAKER"
          onFinish={handleSpeakerResult}
          onHome={goHome}
        />
      )}

      {phase === PHASES.DISCUSSION && (
        <DiscussionScreen
          players={players}
          firstSpeaker={firstSpeaker}
          onComplete={handleDiscussionComplete}
          onHome={goHome}
        />
      )}

      {phase === PHASES.VOTING && (
        <VotingScreen
          key={votingRound}
          players={players}
          onVoteComplete={handleVoteComplete}
          onHome={goHome}
        />
      )}

      {(phase === PHASES.RESULT || phase === PHASES.INTERMEDIATE_RESULT) && (
        <ResultScreen
          eliminatedPlayer={eliminatedPlayer}
          players={players}
          selectedData={selectedData}
          isIntermediate={phase === PHASES.INTERMEDIATE_RESULT}
          globalStats={globalStats}
          voteLog={voteLog}
          onNextRound={nextRound}
          onRestart={restart}
          onReset={reset}
          onHome={goHome}
        />
      )}
    </div>
  );
}

export default App;