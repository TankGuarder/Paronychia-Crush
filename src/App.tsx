import { useCallback, useEffect, useState } from 'react';
import { AdminLeaderboardPage } from './components/AdminLeaderboardPage';
import { GamePage } from './components/GamePage';
import { HomePage } from './components/HomePage';
import { QuizPage } from './components/QuizPage';
import { SummaryPage } from './components/SummaryPage';
import { TutorialDemoOverlay } from './components/TutorialDemoOverlay';
import { TutorialLevelPage } from './components/TutorialLevelPage';
import { VideoPage } from './components/VideoPage';
import { levels } from './data/levels';
import { gameRules } from './data/rules';
import { useLiffProfile } from './hooks/useLiffProfile';
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

const tutorialStorageKey = 'paronychiaTutorialState';

const hasFinishedTutorial = () =>
  window.localStorage.getItem(tutorialStorageKey) === 'completed' ||
  window.localStorage.getItem(tutorialStorageKey) === 'skipped';

const setTutorialState = (state: 'completed' | 'skipped') => {
  window.localStorage.setItem(tutorialStorageKey, state);
};

export default function App() {
  const [runState, setRunState] = useState<GameRunState>(initialRunState);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rank, setRank] = useState(0);
  const liffState = useLiffProfile();

  const { screen, nickname, lineUserId, currentLevelIndex, completedLevel, score, timeBonus } = runState;
  const currentLevel = levels[currentLevelIndex];
  const isFinalLevel = currentLevelIndex === levels.length - 1;
  const isAdminRoute = window.location.pathname.endsWith('/admin/leaderboard') || window.location.hash === '#/admin/leaderboard';

  const liffStatusText = (() => {
    if (liffState.isLoading) {
      return 'LIFF 初始化中';
    }
    if (liffState.error) {
      return 'LIFF 初始化失敗，使用本地測試模式';
    }
    if (!liffState.isConfigured) {
      return '本地測試模式';
    }
    if (liffState.profile.mode === 'line') {
      return 'LINE 環境已連線';
    }
    return '一般瀏覽器模式';
  })();

  useEffect(() => {
    if (liffState.isLoading) {
      return;
    }

    setRunState((current) => ({
      ...current,
      lineUserId: liffState.profile.lineUserId,
      nickname: current.nickname || liffState.profile.displayName || '',
    }));
  }, [liffState.isLoading, liffState.profile.displayName, liffState.profile.lineUserId]);

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
      lineUserId: current.lineUserId,
      screen: hasFinishedTutorial() ? 'game' : 'tutorialVideo',
    }));
  };

  const enterFormalFirstLevel = (tutorialState: 'completed' | 'skipped') => {
    setTutorialState(tutorialState);
    setRunState((current) => ({
      ...current,
      currentLevelIndex: 0,
      completedLevel: 0,
      score: 0,
      timeBonus: 0,
      screen: 'game',
    }));
  };

  const finishRun = useCallback(async () => {
    const entry: LeaderboardEntry = {
      nickname: nickname.trim(),
      lineUserId,
      score,
      completedLevel,
      createdAt: new Date().toISOString(),
    };
    const result = await saveScore(entry);
    setLeaderboard(result.entries);
    setRank(result.rank);
    setRunState((current) => ({ ...current, screen: 'summary' }));
  }, [completedLevel, lineUserId, nickname, score]);

  const handleLevelPassed = () => {
    setRunState((current) => ({
      ...current,
      completedLevel: Math.max(current.completedLevel, currentLevel.order),
      screen: 'video',
    }));
  };

  const handleVideoDone = () => {
    if (isFinalLevel) {
      void finishRun();
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
      lineUserId: current.lineUserId,
    }));
  };

  if (screen === 'home') {
    if (isAdminRoute) {
      return <AdminLeaderboardPage />;
    }

    return (
      <HomePage
        nickname={nickname}
        liffStatusText={liffStatusText}
        liffDisplayName={liffState.profile.displayName}
        lineUserId={lineUserId}
        onNicknameChange={(value) => setRunState((current) => ({ ...current, nickname: value }))}
        onStart={startGame}
      />
    );
  }

  if (screen === 'video') {
    return <VideoPage level={currentLevel} isFinalLevel={isFinalLevel} onContinue={handleVideoDone} />;
  }

  if (screen === 'tutorialVideo' && levels[0].demo) {
    return (
      <TutorialDemoOverlay
        boardSize={levels[0].boardSize}
        demo={levels[0].demo}
        onDone={() => setRunState((current) => ({ ...current, screen: 'tutorialLevel' }))}
        onSkip={() => enterFormalFirstLevel('skipped')}
      />
    );
  }

  if (screen === 'tutorialLevel') {
    return <TutorialLevelPage onComplete={() => enterFormalFirstLevel('completed')} onSkip={() => enterFormalFirstLevel('skipped')} />;
  }

  if (screen === 'quiz') {
    return <QuizPage level={currentLevel} rules={gameRules} onCorrect={handleQuizCorrect} onWrong={() => void finishRun()} />;
  }

  if (screen === 'summary') {
    return (
      <SummaryPage
        nickname={nickname.trim() || '本次玩家'}
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
      onTimeUpSettle={() => void finishRun()}
      onTimeUpQuiz={handleQuizStart}
      suppressDemo={hasFinishedTutorial()}
    />
  );
}
