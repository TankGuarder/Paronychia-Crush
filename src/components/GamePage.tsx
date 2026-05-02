import { useEffect, useMemo, useState } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import type { BoardCell, GameRules, LevelConfig } from '../types/game';
import { areAdjacent, canSwapCells, createBoard, resolveBoard, swapTiles } from '../utils/board';
import { Board } from './Board';
import { GameHeader } from './GameHeader';
import { Modal } from './Modal';
import { TutorialDemoOverlay } from './TutorialDemoOverlay';

interface GamePageProps {
  level: LevelConfig;
  score: number;
  timeBonus: number;
  rules: GameRules;
  onScoreChange: (delta: number) => void;
  onLevelPassed: () => void;
  onTimeUpSettle: () => void;
  onTimeUpQuiz: () => void;
}

export function GamePage({
  level,
  score,
  timeBonus,
  rules,
  onScoreChange,
  onLevelPassed,
  onTimeUpSettle,
  onTimeUpQuiz,
}: GamePageProps) {
  const [board, setBoard] = useState<BoardCell[][]>(() => createBoard(level.boardSize, level.obstacles));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(rules.secondsPerLevel + timeBonus);
  const [remainingObstacles, setRemainingObstacles] = useState(level.obstacles.length);
  const [passed, setPassed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [lastMessage, setLastMessage] = useState('選兩個相鄰方塊交換。');
  const [isDemoActive, setIsDemoActive] = useState(Boolean(level.demo));

  const obstacleHint = useMemo(
    () => obstacleDefinitions.map((obstacle) => `${obstacle.name}：${obstacle.hint}`).join(' '),
    [],
  );

  useEffect(() => {
    setBoard(createBoard(level.boardSize, level.obstacles));
    setSelected(null);
    setSecondsLeft(rules.secondsPerLevel + timeBonus);
    setRemainingObstacles(level.obstacles.length);
    setPassed(false);
    setTimedOut(false);
    setIsDemoActive(Boolean(level.demo));
    setLastMessage(
      timeBonus > 0
        ? `互動題答對，已增加 ${timeBonus} 秒。請清除所有障礙。`
        : '選兩個相鄰主方塊交換，三消時清除旁邊的障礙。',
    );
  }, [level.boardSize, level.demo, level.levelId, level.obstacles, rules.secondsPerLevel, timeBonus]);

  useEffect(() => {
    if (!level.demo || !isDemoActive) {
      return;
    }

    const timer = window.setTimeout(() => setIsDemoActive(false), level.demo.durationMs);
    return () => window.clearTimeout(timer);
  }, [isDemoActive, level.demo]);

  useEffect(() => {
    if (passed || timedOut || isDemoActive) {
      return;
    }

    if (secondsLeft <= 0) {
      setTimedOut(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isDemoActive, passed, secondsLeft, timedOut]);

  useEffect(() => {
    if (!passed && remainingObstacles === 0) {
      setPassed(true);
      onScoreChange(rules.passBonusScore);
    }
  }, [onScoreChange, passed, remainingObstacles, rules.passBonusScore]);

  const handleTilePress = (row: number, col: number) => {
    if (passed || timedOut || isDemoActive) {
      return;
    }

    if (!selected) {
      if (board[row][col].kind === 'obstacle') {
        setLastMessage('障礙方塊不可交換，請選主方塊。');
        return;
      }
      setSelected([row, col]);
      return;
    }

    const nextSelection: [number, number] = [row, col];
    if (selected[0] === row && selected[1] === col) {
      setSelected(null);
      return;
    }

    if (!areAdjacent(selected, nextSelection)) {
      if (board[row][col].kind === 'obstacle') {
        setLastMessage('障礙方塊不可交換，請選主方塊。');
        return;
      }
      setSelected(nextSelection);
      setLastMessage('請選擇相鄰的兩個方塊。');
      return;
    }

    if (!canSwapCells(board, selected, nextSelection)) {
      setSelected(null);
      setLastMessage('障礙方塊不可交換。');
      return;
    }

    const swapped = swapTiles(board, selected, nextSelection);
    const resolved = resolveBoard(swapped);
    setSelected(null);

    if (resolved.removedTotal === 0) {
      setLastMessage('這次沒有形成三消，方塊已換回。');
      return;
    }

    setBoard(resolved.board);
    onScoreChange(resolved.removedTotal);
    setRemainingObstacles(resolved.remainingObstacles);
    setLastMessage(
      resolved.clearedObstacles > 0
        ? `清除了 ${resolved.removedTotal} 個主方塊，並消除 ${resolved.clearedObstacles} 個障礙。`
        : `清除了 ${resolved.removedTotal} 個主方塊。障礙需靠相鄰三消消除。`,
    );
  };

  return (
    <main className="page game-page">
      <GameHeader
        level={level.order}
        totalLevels={rules.totalLevels}
        secondsLeft={secondsLeft}
        score={score}
        targetText={level.targetText}
      />

      <section className="level-summary" aria-live="polite">
        <div>
          <p className="eyebrow">{level.title}</p>
          <h1>{level.goal.label}</h1>
          <p className="concept-text">核心觀念：{level.concept}</p>
        </div>
        <div className="progress-pill">
          剩餘障礙 {remainingObstacles}/{level.obstacles.length}
        </div>
      </section>
      <p className="status-message obstacle-hint">{obstacleHint}</p>

      <Board board={board} selected={selected} disabled={passed || timedOut || isDemoActive} onTilePress={handleTilePress} />
      <p className="status-message" aria-live="polite">{lastMessage}</p>

      {level.demo && isDemoActive && <TutorialDemoOverlay boardSize={level.boardSize} demo={level.demo} />}

      {passed && (
        <Modal
          title="過關"
          actions={<button className="primary-button" onClick={onLevelPassed}>觀看衛教影片</button>}
        >
          <p>已清除本關所有障礙，過關獲得 {rules.passBonusScore} 分。</p>
          <p className="hint-text">{level.passHint}</p>
          <p>看完衛教影片後才能進下一關。</p>
        </Modal>
      )}

      {timedOut && (
        <Modal
          title="時間到"
          actions={
            <>
              <button className="secondary-button" onClick={onTimeUpSettle}>直接結算分數</button>
              <button className="primary-button" disabled={score < rules.quizCostScore} onClick={onTimeUpQuiz}>
                花費 {rules.quizCostScore} 分挑戰互動題
              </button>
            </>
          }
        >
          <p>本關仍有障礙尚未清除。若分數足夠，可花費 {rules.quizCostScore} 分回答互動題，答對會回到本關並增加 {rules.quizCorrectTimeBonus} 秒。</p>
          {score < rules.quizCostScore && <p className="warning-text">目前分數不足 {rules.quizCostScore} 分，無法進入互動題。</p>}
        </Modal>
      )}
    </main>
  );
}
