import { useCallback, useState } from 'react';
import { GamePage } from './components/GamePage';
import { HomePage } from './components/HomePage';
import { QuizPage } from './components/QuizPage';
import { SummaryPage } from './components/SummaryPage';
import { VideoPage } from './components/VideoPage';
import { levels } from './data/levels';
import { gameRules } from './data/rules';
import type { GameRunState, LeaderboardEntry } from './types/game';
import { saveScore } from './utils/leaderboard';

const initialRunState: GameRunState = {
  screen: 'home',
  nickname: '',
  currentLevelIndex: 0,
  completedLevel: 0,
  score: 0,
  timeBonus: 0,
};

export default function App() {
  const [runState, setRunState] = useState<GameRunState>(initialRunState);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rank, setRank] = useState(0);

  const { screen, nickname, currentLevelIndex, completedLevel, score, timeBonus } = runState;
  const currentLevel = levels[currentLevelIndex];
  const isFinalLevel = currentLevelIndex === levels.length - 1;

  const changeScore = useCallback((delta: number) => {
    setRunState((current) => ({
      ...current,
      score: Math.max(0, current.score + delta),
    }));
  }, []);

  const startGame = () => {
    if (!nickname.trim()) {
      return;
    }
    setRunState((current) => ({
      ...initialRunState,
      nickname: current.nickname,
      screen: 'game',
    }));
  };

  const finishRun = useCallback(() => {
    const entry: LeaderboardEntry = {
      nickname: nickname.trim() || '未命名玩家',
      score,
      completedLevel,
      createdAt: new Date().toISOString(),
    };
    const result = saveScore(entry);
    setLeaderboard(result.entries);
    setRank(result.rank);
    setRunState((current) => ({ ...current, screen: 'summary' }));
  }, [completedLevel, nickname, score]);

  const handleLevelPassed = () => {
    setRunState((current) => ({
      ...current,
      completedLevel: Math.max(current.completedLevel, currentLevel.order),
      screen: 'video',
    }));
  };

  const handleVideoDone = () => {
    if (isFinalLevel) {
      finishRun();
      return;
    }

    setRunState((current) => ({
      ...current,
      currentLevelIndex: current.currentLevelIndex + 1,
      timeBonus: 0,
      screen: 'game',
    }));
  };

  const handleQuizStart = () => {
    changeScore(-gameRules.quizCostScore);
    setRunState((current) => ({ ...current, screen: 'quiz' }));
  };

  const handleQuizCorrect = () => {
    setRunState((current) => ({
      ...current,
      timeBonus: gameRules.quizCorrectTimeBonus,
      screen: 'game',
    }));
  };

  const restart = () => {
    setRunState((current) => ({
      ...initialRunState,
      nickname: current.nickname,
    }));
  };

  if (screen === 'home') {
    return (
      <HomePage
        nickname={nickname}
        onNicknameChange={(value) => setRunState((current) => ({ ...current, nickname: value }))}
        onStart={startGame}
      />
    );
  }

  if (screen === 'video') {
    return <VideoPage level={currentLevel} isFinalLevel={isFinalLevel} onContinue={handleVideoDone} />;
  }

  if (screen === 'quiz') {
    return <QuizPage level={currentLevel} rules={gameRules} onCorrect={handleQuizCorrect} onWrong={finishRun} />;
  }

  if (screen === 'summary') {
    return (
      <SummaryPage
        nickname={nickname.trim() || '未命名玩家'}
        score={score}
        completedLevel={completedLevel}
        leaderboard={leaderboard}
        rank={rank}
        leaderboardLimit={gameRules.leaderboardLimit}
        onRestart={restart}
      />
    );
  }

  return (
    <GamePage
      level={currentLevel}
      score={score}
      timeBonus={timeBonus}
      rules={gameRules}
      onScoreChange={changeScore}
      onLevelPassed={handleLevelPassed}
      onTimeUpSettle={finishRun}
      onTimeUpQuiz={handleQuizStart}
    />
  );
}
