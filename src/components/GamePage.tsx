import { useEffect, useMemo, useState } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import type { BoardAnimationState, BoardCell, BoardPosition, GameRules, LevelConfig, SuggestedMove } from '../types/game';
import {
  areAdjacent,
  canSwapCells,
  countObstaclesByType,
  createBoard,
  ensurePlayableBoard,
  findSuggestedMove,
  hasAnyMatch,
  resolveBoardStep,
  swapTiles,
} from '../utils/board';
import { Board } from './Board';
import { GameHeader } from './GameHeader';
import { Modal } from './Modal';
import { TutorialDemoOverlay } from './TutorialDemoOverlay';

const idleHintDelayMs = 5000;

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
  const [secondsLeft, setSecondsLeft] = useState(rules.secondsPerLevel + timeBonus);
  const [passed, setPassed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [lastMessage, setLastMessage] = useState('請滑動主方塊，朝相鄰方塊交換並形成三消。');
  const [isDemoActive, setIsDemoActive] = useState(Boolean(level.demo));
  const [hintMove, setHintMove] = useState<SuggestedMove | null>(null);
  const [interactionTick, setInteractionTick] = useState(0);
  const [animation, setAnimation] = useState<BoardAnimationState | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const wait = (durationMs: number) => new Promise((resolve) => window.setTimeout(resolve, durationMs));

  const obstacleHint = useMemo(
    () => obstacleDefinitions.map((obstacle) => `${obstacle.name}：${obstacle.hint}`).join(' '),
    [],
  );

  const obstacleMap = useMemo(
    () => new Map(obstacleDefinitions.map((obstacle) => [obstacle.id, obstacle])),
    [],
  );

  const levelObstacleTypes = useMemo(
    () => [...new Set(level.obstacles.map((obstacle) => obstacle.type))],
    [level.obstacles],
  );

  const remainingObstacleCounts = useMemo(() => countObstaclesByType(board), [board]);
  const remainingObstacleTotal = useMemo(
    () => Object.values(remainingObstacleCounts).reduce((total, count) => total + (count ?? 0), 0),
    [remainingObstacleCounts],
  );

  const clearIdleHint = () => {
    setHintMove(null);
    setInteractionTick((current) => current + 1);
  };

  useEffect(() => {
    setBoard(createBoard(level.boardSize, level.obstacles));
    setSecondsLeft(rules.secondsPerLevel + timeBonus);
    setPassed(false);
    setTimedOut(false);
    setIsDemoActive(Boolean(level.demo));
    setHintMove(null);
    setAnimation(null);
    setIsResolving(false);
    setInteractionTick((current) => current + 1);
    setLastMessage(
      timeBonus > 0
        ? `互動題答對，增加 ${timeBonus} 秒，繼續挑戰。`
        : '請滑動主方塊，朝相鄰方塊交換並形成三消。',
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
    if (passed || timedOut || isDemoActive || isResolving) {
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
  }, [isDemoActive, isResolving, passed, secondsLeft, timedOut]);

  useEffect(() => {
    if (passed || timedOut || isDemoActive || isResolving) {
      setHintMove(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setHintMove(findSuggestedMove(board));
    }, idleHintDelayMs);

    return () => window.clearTimeout(timer);
  }, [board, interactionTick, isDemoActive, isResolving, passed, timedOut]);

  useEffect(() => {
    if (!passed && remainingObstacleTotal === 0) {
      setPassed(true);
      setHintMove(null);
      onScoreChange(rules.passBonusScore);
    }
  }, [onScoreChange, passed, remainingObstacleTotal, rules.passBonusScore]);

  const playResolutionAnimation = async (startBoard: BoardCell[][]) => {
    let currentBoard = startBoard;
    let removedTotal = 0;
    let clearedObstacles = 0;

    setIsResolving(true);
    setHintMove(null);

    while (true) {
      const step = resolveBoardStep(currentBoard);

      if (!step) {
        break;
      }

      removedTotal += step.removedTotal;
      clearedObstacles += step.clearedObstacles;

      setAnimation({
        removingKeys: step.animation.removingKeys,
        droppingKeys: [],
        newTileKeys: [],
      });
      await wait(180);

      setBoard(step.board);
      setAnimation({
        removingKeys: [],
        droppingKeys: step.animation.droppingKeys,
        newTileKeys: step.animation.newTileKeys,
      });
      onScoreChange(step.removedTotal);
      currentBoard = step.board;
      await wait(260);
    }

    const playableBoard = ensurePlayableBoard(currentBoard);
    if (playableBoard !== currentBoard) {
      setBoard(playableBoard);
      setLastMessage('盤面已自動洗牌，保留目前障礙進度。');
      await wait(120);
    } else if (removedTotal > 0) {
      setLastMessage(
        clearedObstacles > 0
          ? `消除 ${removedTotal} 個方塊，並清除 ${clearedObstacles} 個障礙。`
          : `消除 ${removedTotal} 個方塊，繼續清除障礙。`,
      );
    }

    setAnimation(null);
    setIsResolving(false);
    setInteractionTick((current) => current + 1);
  };

  const handleTileSwipe = async (from: BoardPosition, to: BoardPosition) => {
    if (passed || timedOut || isDemoActive || isResolving) {
      return;
    }

    clearIdleHint();

    if (!areAdjacent(from, to)) {
      setLastMessage('請朝上下左右相鄰方塊滑動交換。');
      return;
    }

    if (!canSwapCells(board, from, to)) {
      setLastMessage('障礙不能交換，請滑動主要方塊。');
      return;
    }

    const previousBoard = board;
    const swapped = swapTiles(board, from, to);
    setBoard(swapped);

    if (!hasAnyMatch(swapped)) {
      setIsResolving(true);
      setLastMessage('這次交換沒有形成三消，方塊會回到原位。');
      await wait(180);
      setBoard(previousBoard);
      await wait(160);
      setIsResolving(false);
      setInteractionTick((current) => current + 1);
      return;
    }

    void playResolutionAnimation(swapped);
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
          剩餘障礙 {remainingObstacleTotal}/{level.obstacles.length}
        </div>
      </section>
      <p className="status-message obstacle-hint">{obstacleHint}</p>

      <section className="target-tray" aria-label="本關剩餘障礙">
        <span className="target-tray-title">目標</span>
        <div className="target-list">
          {levelObstacleTypes.map((type) => {
            const obstacle = obstacleMap.get(type);
            const count = remainingObstacleCounts[type] ?? 0;

            return (
              <div className={`target-item target-${type} ${count === 0 ? 'cleared' : ''}`} key={type}>
                {obstacle?.icon && <img src={obstacle.icon} alt="" aria-hidden="true" />}
                <span>{obstacle?.name ?? '障礙'}</span>
                <strong>{count}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <Board
        board={board}
        hintMove={hintMove}
        animation={animation}
        disabled={passed || timedOut || isDemoActive || isResolving}
        onInteractionStart={clearIdleHint}
        onTileSwipe={(from, to) => {
          void handleTileSwipe(from, to);
        }}
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
