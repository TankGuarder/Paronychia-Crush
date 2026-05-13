import { useMemo, useState, type CSSProperties, type PointerEvent } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import { tileDefinitions } from '../data/tiles';
import hintHandIcon from '../assets/icons/hint-hand.svg';
import type { BoardPosition, TileType } from '../types/game';

interface TutorialLevelPageProps {
  onComplete: () => void;
  onSkip: () => void;
}

type TutorialCell = TileType | 'obstacle' | 'empty';

interface TutorialStep {
  title: string;
  message: string;
  reason: string;
  board: TutorialCell[][];
  swipeFrom?: BoardPosition;
  swipeTo?: BoardPosition;
  nextLabel: string;
  requiresSwipe?: boolean;
  movablePositions?: BoardPosition[];
  lockedPositions?: BoardPosition[];
  blockedDemo?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Step 1：先認識方塊',
    message: '亮起來的是可以移動的方塊，紅紅的手指是障礙，不能移動。',
    reason: '正式遊戲中，請滑動藥膏、襪子、手套、乳液、棉棒這些主要方塊。',
    board: [
      ['ointment', 'socks', 'lotion'],
      ['gloves', 'obstacle', 'cottonSwab'],
      ['socks', 'ointment', 'gloves'],
    ],
    movablePositions: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
    ],
    lockedPositions: [[1, 1]],
    nextLabel: '知道了',
  },
  {
    title: 'Step 2：障礙不能移動',
    message: '手指碰到障礙時，障礙不會動。請移動旁邊亮起來的方塊。',
    reason: '障礙要靠旁邊的主要方塊消除，不能直接拖走。',
    board: [
      ['ointment', 'socks', 'lotion'],
      ['gloves', 'obstacle', 'cottonSwab'],
      ['socks', 'ointment', 'gloves'],
    ],
    swipeFrom: [1, 1],
    swipeTo: [1, 2],
    movablePositions: [[1, 2]],
    lockedPositions: [[1, 1]],
    nextLabel: '下一步',
    blockedDemo: true,
  },
  {
    title: 'Step 3：把方塊滑過去',
    message: '從黃色起點開始，把藥膏往上滑到終點。',
    reason: '手指按住方塊，往旁邊或上下滑，就能交換位置。',
    board: [
      ['socks', 'gloves', 'lotion'],
      ['ointment', 'socks', 'ointment'],
      ['gloves', 'ointment', 'cottonSwab'],
    ],
    swipeFrom: [2, 1],
    swipeTo: [1, 1],
    nextLabel: '我來滑滑看',
    requiresSwipe: true,
    movablePositions: [[2, 1]],
  },
  {
    title: 'Step 4：三個一樣會消除',
    message: '很好！三個藥膏連成一排，就會消除。',
    reason: '消除方塊時，附近的障礙才有機會被清掉。',
    board: [
      ['socks', 'gloves', 'lotion'],
      ['ointment', 'ointment', 'ointment'],
      ['gloves', 'empty', 'cottonSwab'],
    ],
    nextLabel: '下一步',
  },
  {
    title: 'Step 5：障礙旁邊消除',
    message: '這次把藥膏往上滑，讓障礙旁邊的三個藥膏消除。',
    reason: '障礙旁邊有方塊被消除，障礙也會消失。',
    board: [
      ['socks', 'obstacle', 'lotion'],
      ['ointment', 'socks', 'ointment'],
      ['gloves', 'ointment', 'cottonSwab'],
    ],
    swipeFrom: [2, 1],
    swipeTo: [1, 1],
    nextLabel: '清除障礙',
    requiresSwipe: true,
    movablePositions: [[2, 1]],
    lockedPositions: [[0, 1]],
  },
  {
    title: '完成教學',
    message: '記住這句話：障礙旁邊消除，障礙也會消失。',
    reason: '正式關卡就是把所有障礙清掉。準備好就開始第一關。',
    board: [
      ['socks', 'empty', 'lotion'],
      ['empty', 'empty', 'empty'],
      ['gloves', 'empty', 'cottonSwab'],
    ],
    nextLabel: '開始第一關',
  },
];

const tileMap = new Map(tileDefinitions.map((tile) => [tile.id, tile]));
const obstacleIcon = obstacleDefinitions[0]?.icon;

const samePosition = (a: BoardPosition | undefined, b: BoardPosition) => Boolean(a && a[0] === b[0] && a[1] === b[1]);
const includesPosition = (positions: BoardPosition[] | undefined, target: BoardPosition) =>
  Boolean(positions?.some((position) => samePosition(position, target)));

const getGuideStyle = (from?: BoardPosition, to?: BoardPosition): CSSProperties | undefined => {
  if (!from || !to) {
    return undefined;
  }

  const colDelta = to[1] - from[1];
  const rowDelta = to[0] - from[0];
  const length = Math.sqrt(colDelta * colDelta + rowDelta * rowDelta);

  return {
    '--tutorial-hand-left': `${((from[1] + 0.5) / 3) * 100}%`,
    '--tutorial-hand-top': `${((from[0] + 0.5) / 3) * 100}%`,
    '--tutorial-hand-dx': `${(colDelta / 3) * 100}%`,
    '--tutorial-hand-dy': `${(rowDelta / 3) * 100}%`,
    '--tutorial-track-left': `${(((from[1] + to[1]) / 2 + 0.5) / 3) * 100}%`,
    '--tutorial-track-top': `${(((from[0] + to[0]) / 2 + 0.5) / 3) * 100}%`,
    '--tutorial-track-length': `${(length / 3) * 100}%`,
    '--tutorial-track-angle': `${Math.atan2(rowDelta, colDelta)}rad`,
  } as CSSProperties;
};

export function TutorialLevelPage({ onComplete, onSkip }: TutorialLevelPageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dragStart, setDragStart] = useState<{ position: BoardPosition; x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState('先看清楚：亮起來的方塊可以動，障礙不能動。');
  const step = tutorialSteps[stepIndex];
  const guideStyle = useMemo(() => getGuideStyle(step.swipeFrom, step.swipeTo), [step.swipeFrom, step.swipeTo]);

  const goNext = () => {
    if (stepIndex >= tutorialSteps.length - 1) {
      onComplete();
      return;
    }
    setStepIndex((current) => current + 1);
    setFeedback(tutorialSteps[stepIndex + 1].requiresSwipe ? '請滑動亮起來的方塊。' : '看懂後按下一步。');
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, row: number, col: number, cell: TutorialCell) => {
    if (cell === 'obstacle') {
      setFeedback('障礙不能移動，請移動旁邊亮起來的方塊。');
      return;
    }

    setDragStart({ position: [row, col], x: event.clientX, y: event.clientY });
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragStart || !step.requiresSwipe || !step.swipeFrom || !step.swipeTo) {
      setDragStart(null);
      return;
    }

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    const target: BoardPosition =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? [dragStart.position[0], dragStart.position[1] + (deltaX > 0 ? 1 : -1)]
        : [dragStart.position[0] + (deltaY > 0 ? 1 : -1), dragStart.position[1]];

    if (samePosition(step.swipeFrom, dragStart.position) && samePosition(step.swipeTo, target)) {
      setFeedback('做得很好，方塊已經滑到正確位置。');
      window.setTimeout(goNext, 520);
    } else {
      setFeedback('再試一次，從黃色起點滑到紫色終點。');
    }
    setDragStart(null);
  };

  return (
    <main className="page tutorial-page">
      <section className="tutorial-card">
        <button className="tutorial-skip-button" type="button" onClick={onSkip}>
          跳過
        </button>
        <p className="eyebrow">新手教學</p>
        <h1>{step.title}</h1>
        <p className="tutorial-message">{step.message}</p>

        <div className="tutorial-mini-board" aria-label="新手教學棋盤">
          {step.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const position: BoardPosition = [rowIndex, colIndex];
              const isStart = samePosition(step.swipeFrom, position);
              const isEnd = samePosition(step.swipeTo, position);
              const isMovable = includesPosition(step.movablePositions, position);
              const isLocked = includesPosition(step.lockedPositions, position) || cell === 'obstacle';
              const icon = cell === 'obstacle' ? obstacleIcon : cell === 'empty' ? undefined : tileMap.get(cell)?.icon;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`tutorial-cell ${cell === 'obstacle' ? 'tutorial-obstacle' : ''} ${
                    isStart ? 'tutorial-start' : ''
                  } ${isEnd ? 'tutorial-end' : ''} ${cell === 'empty' ? 'tutorial-empty' : ''} ${
                    isMovable ? 'tutorial-movable' : ''
                  } ${isLocked ? 'tutorial-locked' : ''}`}
                  type="button"
                  onPointerDown={(event) => handlePointerDown(event, rowIndex, colIndex, cell)}
                  onPointerUp={handlePointerUp}
                >
                  {icon && <img src={icon} alt="" />}
                  {isStart && <span>起點</span>}
                  {isEnd && <span>終點</span>}
                  {isMovable && !isStart && <span>可移動</span>}
                  {isLocked && !isStart && !isEnd && <span>不能動</span>}
                </button>
              );
            }),
          )}

          {step.swipeFrom && step.swipeTo && (
            <>
              <span className="tutorial-track" style={guideStyle} aria-hidden="true" />
              <span className={`tutorial-hand ${step.blockedDemo ? 'blocked' : ''}`} style={guideStyle} aria-hidden="true">
                <img src={hintHandIcon} alt="" />
              </span>
            </>
          )}
        </div>

        <p className="tutorial-reason">{step.reason}</p>
        <p className="status-message" aria-live="polite">
          {feedback}
        </p>
        {!step.requiresSwipe && (
          <button className="primary-button" type="button" onClick={goNext}>
            {step.nextLabel}
          </button>
        )}
      </section>
    </main>
  );
}
