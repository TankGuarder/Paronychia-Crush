import { useEffect, useMemo, useState } from 'react';
import { tileDefinitions } from '../data/tiles';
import type { BoardTile, GameRules, LevelConfig, TileType } from '../types/game';
import { areAdjacent, createBoard, resolveBoard, swapTiles } from '../utils/board';
import { Board } from './Board';
import { GameHeader } from './GameHeader';
import { Modal } from './Modal';

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
  const [board, setBoard] = useState<BoardTile[][]>(() => createBoard(level.boardSize));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(rules.secondsPerLevel + timeBonus);
  const [collected, setCollected] = useState(0);
  const [passed, setPassed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [lastMessage, setLastMessage] = useState('選兩個相鄰方塊交換。');

  const tileName = useMemo(
    () => tileDefinitions.find((tile) => tile.id === level.goal.tileType)?.name ?? '目標方塊',
    [level.goal.tileType],
  );

  useEffect(() => {
    setBoard(createBoard(level.boardSize));
    setSelected(null);
    setSecondsLeft(rules.secondsPerLevel + timeBonus);
    setCollected(0);
    setPassed(false);
    setTimedOut(false);
    setLastMessage(timeBonus > 0 ? `互動題答對，已增加 ${timeBonus} 秒。` : '選兩個相鄰方塊交換。');
  }, [level.boardSize, level.levelId, rules.secondsPerLevel, timeBonus]);

  useEffect(() => {
    if (passed || timedOut) {
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
  }, [passed, secondsLeft, timedOut]);

  useEffect(() => {
    if (!passed && collected >= level.goal.count) {
      setPassed(true);
      onScoreChange(rules.passBonusScore);
    }
  }, [collected, level.goal.count, onScoreChange, passed, rules.passBonusScore]);

  const addCollectedCounts = (counts: Partial<Record<TileType, number>>) => {
    const targetCount = counts[level.goal.tileType] ?? 0;
    if (targetCount > 0) {
      setCollected((current) => Math.min(level.goal.count, current + targetCount));
    }
  };

  const handleTilePress = (row: number, col: number) => {
    if (passed || timedOut) {
      return;
    }

    if (!selected) {
      setSelected([row, col]);
      return;
    }

    const nextSelection: [number, number] = [row, col];
    if (selected[0] === row && selected[1] === col) {
      setSelected(null);
      return;
    }

    if (!areAdjacent(selected, nextSelection)) {
      setSelected(nextSelection);
      setLastMessage('請選擇相鄰的兩個方塊。');
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
    addCollectedCounts(resolved.removedCounts);
    setLastMessage(`清除了 ${resolved.removedTotal} 個方塊。`);
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
          {tileName} {collected}/{level.goal.count}
        </div>
      </section>

      <Board board={board} selected={selected} disabled={passed || timedOut} onTilePress={handleTilePress} />
      <p className="status-message" aria-live="polite">{lastMessage}</p>

      {passed && (
        <Modal
          title="過關"
          actions={<button className="primary-button" onClick={onLevelPassed}>觀看衛教影片</button>}
        >
          <p>完成「{level.goal.label}」，過關獲得 {rules.passBonusScore} 分。</p>
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
          <p>本關尚未達成目標。若分數足夠，可花費 {rules.quizCostScore} 分回答互動題，答對會回到本關並增加 {rules.quizCorrectTimeBonus} 秒。</p>
          {score < rules.quizCostScore && <p className="warning-text">目前分數不足 {rules.quizCostScore} 分，無法進入互動題。</p>}
        </Modal>
      )}
    </main>
  );
}
