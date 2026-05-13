import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import { tileDefinitions } from '../data/tiles';
import hintHandIcon from '../assets/icons/hint-hand.svg';
import type { BoardPosition, TileType } from '../types/game';

interface TutorialLevelPageProps {
  initialStep: number;
  onComplete: () => void;
  onSkip: () => void;
}

type TutorialCell = TileType | 'obstacle' | 'empty';

interface TutorialStep {
  title: string;
  message: string;
  reason: string;
  board: TutorialCell[][];
  nextLabel: string;
  swipeFrom?: BoardPosition;
  swipeTo?: BoardPosition;
  requiresSwipe?: boolean;
  movablePositions?: BoardPosition[];
  lockedPositions?: BoardPosition[];
  clearPreviewTile?: TileType;
  clearPreviewPositions?: BoardPosition[];
  redOutlinePositions?: BoardPosition[];
  fadeOutPositions?: BoardPosition[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Step 1：先看目標',
    message: '目標是清掉發紅手指障礙。移動工具方塊，讓三個一樣的工具在障礙旁邊連線。',
    reason: '工具方塊可以移動；發紅手指是障礙，不能直接移動。',
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
    nextLabel: '下一步',
  },
  {
    title: 'Step 2：滑動亮起來的方塊',
    message: '請按住亮起來的藥膏，往上滑到中間的襪子位置。',
    reason: '藥膏滑到襪子的位置後，三個藥膏會連成一排並消除。',
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
    clearPreviewTile: 'ointment',
    clearPreviewPositions: [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  },
  {
    title: 'Step 3：障礙也會一起消失',
    message: '三個藥膏在障礙旁邊連線後，藥膏會消除，旁邊的發紅手指障礙也會消失。',
    reason: '正式關卡就是重複這件事：在障礙旁邊消除工具方塊，把所有障礙清掉。',
    board: [
      ['socks', 'obstacle', 'lotion'],
      ['ointment', 'ointment', 'ointment'],
      ['gloves', 'empty', 'cottonSwab'],
    ],
    nextLabel: '開始第一關',
    lockedPositions: [[0, 1]],
    redOutlinePositions: [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    fadeOutPositions: [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
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

const getDefaultFeedback = (stepIndex: number) => {
  if (tutorialSteps[stepIndex]?.requiresSwipe) {
    return '請滑動亮起來的方塊。';
  }
  return stepIndex === 0 ? '先看清楚：工具方塊可以移動，障礙不能移動。' : '看懂後按下一步。';
};

export function TutorialLevelPage({ initialStep, onComplete, onSkip }: TutorialLevelPageProps) {
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [dragStart, setDragStart] = useState<{ position: BoardPosition; x: number; y: number } | null>(null);
  const [feedback, setFeedback] = useState(getDefaultFeedback(initialStep));
  const step = tutorialSteps[stepIndex];
  const guideStyle = useMemo(() => getGuideStyle(step.swipeFrom, step.swipeTo), [step.swipeFrom, step.swipeTo]);

  useEffect(() => {
    setStepIndex(initialStep);
    setFeedback(getDefaultFeedback(initialStep));
  }, [initialStep]);

  const goNext = () => {
    if (stepIndex >= tutorialSteps.length - 1) {
      onComplete();
      return;
    }

    const nextStep = stepIndex + 1;
    setDragStart(null);
    setStepIndex(nextStep);
    setFeedback(getDefaultFeedback(nextStep));
  };

  const goBack = () => {
    const previousStep = Math.max(0, stepIndex - 1);
    setDragStart(null);
    setStepIndex(previousStep);
    setFeedback(getDefaultFeedback(previousStep));
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, row: number, col: number, cell: TutorialCell) => {
    if (cell === 'obstacle') {
      setFeedback('障礙不能移動，請移動旁邊亮起來的工具方塊。');
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
      setFeedback('做得很好，三個藥膏會慢慢連起來並消除。');
      window.setTimeout(goNext, 1100);
    } else {
      setFeedback('再試一次，從亮起來的藥膏往上滑到襪子。');
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
              const isClearPreview = includesPosition(step.clearPreviewPositions, position);
              const isRedOutlined = includesPosition(step.redOutlinePositions, position);
              const shouldFadeOut = includesPosition(step.fadeOutPositions, position);
              const icon = cell === 'obstacle' ? obstacleIcon : cell === 'empty' ? undefined : tileMap.get(cell)?.icon;
              const previewIcon = step.clearPreviewTile ? tileMap.get(step.clearPreviewTile)?.icon : undefined;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`tutorial-cell ${cell === 'obstacle' ? 'tutorial-obstacle' : ''} ${
                    isStart ? 'tutorial-start' : ''
                  } ${isEnd ? 'tutorial-end' : ''} ${cell === 'empty' ? 'tutorial-empty' : ''} ${
                    isMovable ? 'tutorial-movable' : ''
                  } ${isLocked ? 'tutorial-locked' : ''} ${isRedOutlined ? 'tutorial-red-outline' : ''} ${
                    shouldFadeOut ? 'tutorial-fade-out' : ''
                  }`}
                  type="button"
                  onPointerDown={(event) => handlePointerDown(event, rowIndex, colIndex, cell)}
                  onPointerUp={handlePointerUp}
                >
                  {icon && <img src={icon} alt="" />}
                  {isClearPreview && previewIcon && (
                    <img className="tutorial-clear-preview" src={previewIcon} alt="" aria-hidden="true" />
                  )}
                </button>
              );
            }),
          )}

          {step.swipeFrom && step.swipeTo && (
            <>
              <span className="tutorial-track" style={guideStyle} aria-hidden="true" />
              <span className="tutorial-hand" style={guideStyle} aria-hidden="true">
                <img src={hintHandIcon} alt="" />
              </span>
            </>
          )}
        </div>

        <p className="tutorial-reason">{step.reason}</p>
        <p className="status-message" aria-live="polite">
          {feedback}
        </p>
        <div className="tutorial-actions">
          {stepIndex > 0 && (
            <button className="secondary-button" type="button" onClick={goBack}>
              回上一步
            </button>
          )}
          {!step.requiresSwipe && (
            <button className="primary-button" type="button" onClick={goNext}>
              {step.nextLabel}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
