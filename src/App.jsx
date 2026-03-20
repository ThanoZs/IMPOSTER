//App.jsx
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
  const [gameMode, setGameMode] = useState("WORD");
  const [selectedData, setSelectedData] = useState(null);
  const [firstPicker, setFirstPicker] = useState("");
  const [firstSpeaker, setFirstSpeaker] = useState("");
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [votingRound, setVotingRound] = useState(1);
  const [globalStats, setGlobalStats] = useState({});

  const addPlayer = (name) => {
    setPlayers([...players, { name, role: 'crewmate', eliminated: false }]);
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const startGame = () => {
    if (players.length < 3) return;

    // 1. Assign Roles (Cleanly)
    const newPlayers = players.map(p => ({ ...p, role: 'crewmate', eliminated: false }));

    // Randomly choose 1 or 2 imposters if min 4 players
    let imposterCount = 1;
    if (players.length >= 4) {
      imposterCount = Math.random() < 0.5 ? 1 : 2;
    }

    const indices = Array.from({ length: players.length }, (_, i) => i);
    for (let i = 0; i < imposterCount; i++) {
      const randomIdx = Math.floor(Math.random() * indices.length);
      const playerIdx = indices.splice(randomIdx, 1)[0];
      newPlayers[playerIdx].role = 'imposter';
    }

    setPlayers(newPlayers);

    // 2. Select Word/Sentence
    const dataSet = gameMode === "WORD" ? wordData : sentenceData;
    const randomItem = dataSet[Math.floor(Math.random() * dataSet.length)];
    setSelectedData(randomItem);

    setVotingRound(1);
    setPhase(PHASES.WHEEL_PICKER);
  };

  const handlePickerResult = (picker) => {
    setFirstPicker(picker);
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

  const handleVoteComplete = (votes) => {
    // Find player with max votes, handle ties by taking a random one from top candidates
    let maxVotes = 0;
    const voteCounts = {};

    Object.keys(votes).forEach(idx => {
      const count = votes[idx];
      voteCounts[idx] = count;
      if (count > maxVotes) maxVotes = count;
    });

    const candidates = Object.keys(voteCounts).filter(idx => voteCounts[idx] === maxVotes);
    
    // DRAW condition: If more than 1 person has the max votes, vote again!
    if (candidates.length > 1) {
      alert("⚠️ VOTING DRAW ⚠️\nMultiple agents received the same number of votes. You must vote again!");
      setVotingRound(r => r + 1);
      return;
    }

    const eliminatedIdx = candidates[0];

    const eliminated = players[parseInt(eliminatedIdx)];

    // Mark as eliminated
    const updatedPlayers = players.map((p, i) =>
      i === parseInt(eliminatedIdx) ? { ...p, eliminated: true } : p
    );
    setPlayers(updatedPlayers);
    setEliminatedPlayer(eliminated);

    // Check conditions for multi-round
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
          if (crewWin) newStats[p.name].imposterLosses += 1;
          else newStats[p.name].imposterWins += 1;
        } else {
          if (crewWin) newStats[p.name].crewWins += 1;
          else newStats[p.name].crewLosses += 1;
        }
      });
      
      setGlobalStats(newStats);
      setPhase(PHASES.RESULT);
    }
  };

  const nextRound = () => {
    setVotingRound(1);
    setPhase(PHASES.DISCUSSION);
  };

  const restart = () => {
    startGame();
  };

  const reset = () => {
    setPlayers([]);
    setGlobalStats({});
    setPhase(PHASES.SETUP);
  };

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
        />
      )}

      {phase === PHASES.REVEAL && (
        <RevealScreen
          players={players}
          selectedData={selectedData}
          onComplete={handleRevealComplete}
        />
      )}

      {phase === PHASES.WHEEL_SPEAKER && (
        <WheelScreen
          players={players}
          type="SPEAKER"
          onFinish={handleSpeakerResult}
        />
      )}

      {phase === PHASES.DISCUSSION && (
        <DiscussionScreen
          players={players}
          firstSpeaker={firstSpeaker}
          onComplete={handleDiscussionComplete}
        />
      )}

      {phase === PHASES.VOTING && (
        <VotingScreen
          key={votingRound}
          players={players}
          onVoteComplete={handleVoteComplete}
        />
      )}

      {(phase === PHASES.RESULT || phase === PHASES.INTERMEDIATE_RESULT) && (
        <ResultScreen
          eliminatedPlayer={eliminatedPlayer}
          players={players}
          selectedData={selectedData}
          isIntermediate={phase === PHASES.INTERMEDIATE_RESULT}
          globalStats={globalStats}
          onNextRound={nextRound}
          onRestart={restart}
          onReset={reset}
        />
      )}
    </div>
  );
}

export default App;
