import { useEffect, useMemo, useState } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import type { BoardCell, GameRules, LevelConfig, SuggestedMove } from '../types/game';
import { areAdjacent, canSwapCells, createBoard, findSuggestedMove, resolveBoard, swapTiles } from '../utils/board';
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
  const [lastMessage, setLastMessage] = useState('請交換相鄰方塊，讓三個以上相同圖示連成一線。');
  const [isDemoActive, setIsDemoActive] = useState(Boolean(level.demo));
  const [hintMove, setHintMove] = useState<SuggestedMove | null>(null);
  const [interactionTick, setInteractionTick] = useState(0);

  const obstacleHint = useMemo(
    () => obstacleDefinitions.map((obstacle) => `${obstacle.name}：${obstacle.hint}`).join(' '),
    [],
  );

  const clearIdleHint = () => {
    setHintMove(null);
    setInteractionTick((current) => current + 1);
  };

  useEffect(() => {
    setBoard(createBoard(level.boardSize, level.obstacles));
    setSelected(null);
    setSecondsLeft(rules.secondsPerLevel + timeBonus);
    setRemainingObstacles(level.obstacles.length);
    setPassed(false);
    setTimedOut(false);
    setIsDemoActive(Boolean(level.demo));
    setHintMove(null);
    setInteractionTick((current) => current + 1);
    setLastMessage(
      timeBonus > 0
        ? `互動題答對，增加 ${timeBonus} 秒，繼續挑戰。`
        : '請交換相鄰方塊，讓三個以上相同圖示連成一線。',
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
    if (passed || timedOut || isDemoActive) {
      setHintMove(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setHintMove(findSuggestedMove(board));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [board, interactionTick, isDemoActive, passed, timedOut]);

  useEffect(() => {
    if (!passed && remainingObstacles === 0) {
      setPassed(true);
      setHintMove(null);
      onScoreChange(rules.passBonusScore);
    }
  }, [onScoreChange, passed, remainingObstacles, rules.passBonusScore]);

  const handleTilePress = (row: number, col: number) => {
    if (passed || timedOut || isDemoActive) {
      return;
    }

    clearIdleHint();

    if (!selected) {
      if (board[row][col].kind === 'obstacle') {
        setLastMessage('障礙不能交換，請消除旁邊的主要方塊。');
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
        setLastMessage('障礙不能交換，請消除旁邊的主要方塊。');
        return;
      }
      setSelected(nextSelection);
      setLastMessage('請選擇相鄰的兩個方塊交換。');
      return;
    }

    if (!canSwapCells(board, selected, nextSelection)) {
      setSelected(null);
      setLastMessage('障礙不能交換。');
      return;
    }

    const swapped = swapTiles(board, selected, nextSelection);
    const resolved = resolveBoard(swapped);
    setSelected(null);

    if (resolved.removedTotal === 0) {
      setLastMessage('這次交換沒有形成三消，請再試一次。');
      return;
    }

    setBoard(resolved.board);
    onScoreChange(resolved.removedTotal);
    setRemainingObstacles(resolved.remainingObstacles);
    setLastMessage(
      resolved.clearedObstacles > 0
        ? `消除 ${resolved.removedTotal} 個方塊，並清除 ${resolved.clearedObstacles} 個障礙。`
        : `消除 ${resolved.removedTotal} 個方塊，繼續清除障礙。`,
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
          <p className="concept-text">本關重點：{level.concept}</p>
        </div>
        <div className="progress-pill">
          剩餘障礙 {remainingObstacles}/{level.obstacles.length}
        </div>
      </section>
      <p className="status-message obstacle-hint">{obstacleHint}</p>

      <Board
        board={board}
        selected={selected}
        hintMove={hintMove}
        disabled={passed || timedOut || isDemoActive}
        onTilePress={handleTilePress}
      />
      <p className="status-message" aria-live="polite">
        {lastMessage}
      </p>

      {level.demo && isDemoActive && <TutorialDemoOverlay boardSize={level.boardSize} demo={level.demo} />}

      {passed && (
        <Modal
          title="過關"
          actions={
            <button className="primary-button" onClick={onLevelPassed}>
              觀看衛教影片
            </button>
          }
        >
          <p>完成本關目標，獲得 {rules.passBonusScore} 分。</p>
          <p className="hint-text">{level.passHint}</p>
          <p>下一步請先看完衛教影片，再進入下一關。</p>
        </Modal>
      )}

      {timedOut && (
        <Modal
          title="時間到"
          actions={
            <>
              <button className="secondary-button" onClick={onTimeUpSettle}>
                直接結算分數
              </button>
              <button className="primary-button" disabled={score < rules.quizCostScore} onClick={onTimeUpQuiz}>
                花費 {rules.quizCostScore} 分挑戰互動題
              </button>
            </>
          }
        >
          <p>
            本關還有障礙沒有清除。你可以直接結算，或花費 {rules.quizCostScore} 分挑戰互動題，答對可回到本關並增加{' '}
            {rules.quizCorrectTimeBonus} 秒。
          </p>
          {score < rules.quizCostScore && (
            <p className="warning-text">目前分數未達 {rules.quizCostScore} 分，無法進入互動題。</p>
          )}
        </Modal>
      )}
    </main>
  );
}
