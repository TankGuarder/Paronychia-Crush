import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
  board?: TutorialCell[][];
  nextLabel: string;
  showLegend?: boolean;
  swipeFrom?: BoardPosition;
  swipeTo?: BoardPosition;
  movablePositions?: BoardPosition[];
  lockedPositions?: BoardPosition[];
  clearPreviewTile?: TileType;
  clearPreviewPositions?: BoardPosition[];
  redOutlinePositions?: BoardPosition[];
  fadeOutPositions?: BoardPosition[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Step 1：辨認方塊',
    message: '遊戲方塊分成兩類：工具方塊可以移動；障礙方塊不能移動。',
    reason: '先記住哪些可以滑動、哪些不能動，下一步會示範怎麼用工具方塊消除障礙。',
    showLegend: true,
    nextLabel: '看移動示範',
  },
  {
    title: 'Step 2：看工具方塊怎麼消除障礙',
    message: '手指會自動把藥膏往上滑，讓三個藥膏在障礙旁邊連成一條線。',
    reason: '工具方塊連成一線後，這些工具方塊會消除；旁邊的障礙方塊也會一起消失。',
    board: [
      ['socks', 'obstacle', 'lotion'],
      ['ointment', 'socks', 'ointment'],
      ['gloves', 'ointment', 'cottonSwab'],
    ],
    swipeFrom: [2, 1],
    swipeTo: [1, 1],
    nextLabel: '開始正式第一關',
    movablePositions: [[2, 1]],
    lockedPositions: [[0, 1]],
    clearPreviewTile: 'ointment',
    clearPreviewPositions: [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
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
const mainTileLabels: Array<{ id: TileType; label: string }> = [
  { id: 'ointment', label: '藥膏' },
  { id: 'socks', label: '襪子' },
  { id: 'gloves', label: '手套' },
  { id: 'lotion', label: '乳液' },
  { id: 'cottonSwab', label: '棉棒' },
];

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
  if (tutorialSteps[stepIndex]?.swipeFrom) {
    return '請看動畫：工具方塊會滑動、連線，然後和障礙一起消失。';
  }
  return '工具方塊可以移動；障礙方塊不能移動。';
};

export function TutorialLevelPage({ initialStep, onComplete, onSkip }: TutorialLevelPageProps) {
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [feedback, setFeedback] = useState(getDefaultFeedback(initialStep));
  const step = tutorialSteps[stepIndex] ?? tutorialSteps[0];
  const guideStyle = useMemo(() => getGuideStyle(step.swipeFrom, step.swipeTo), [step.swipeFrom, step.swipeTo]);

  useEffect(() => {
    const nextStep = Math.min(initialStep, tutorialSteps.length - 1);
    setStepIndex(nextStep);
    setFeedback(getDefaultFeedback(nextStep));
  }, [initialStep]);

  const goNext = () => {
    if (stepIndex >= tutorialSteps.length - 1) {
      onComplete();
      return;
    }

    const nextStep = stepIndex + 1;
    setStepIndex(nextStep);
    setFeedback(getDefaultFeedback(nextStep));
  };

  const goBack = () => {
    const previousStep = Math.max(0, stepIndex - 1);
    setStepIndex(previousStep);
    setFeedback(getDefaultFeedback(previousStep));
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

        {step.showLegend && (
          <div className="tutorial-legend" aria-label="方塊類型說明">
            <div className="tutorial-legend-group">
              <strong>工具方塊：可以移動</strong>
              <ul className="tutorial-icon-list">
                {mainTileLabels.map((tile) => {
                  const icon = tileMap.get(tile.id)?.icon;
                  return (
                    <li key={tile.id}>
                      <span className="tutorial-legend-icon">{icon && <img src={icon} alt={tile.label} />}</span>
                      <span>{tile.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="tutorial-legend-group tutorial-legend-obstacle">
              <strong>障礙方塊：不可移動</strong>
              <ul className="tutorial-icon-list">
                <li>
                  <span className="tutorial-legend-icon">
                    {obstacleIcon && <img src={obstacleIcon} alt="發紅手指障礙" />}
                  </span>
                  <span>發紅手指</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {step.board && (
          <div className="tutorial-mini-board tutorial-demo-board" aria-label="自動示範棋盤">
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
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`tutorial-cell ${cell === 'obstacle' ? 'tutorial-obstacle' : ''} ${
                      isStart ? 'tutorial-start tutorial-moving-source' : ''
                    } ${isEnd ? 'tutorial-end' : ''} ${cell === 'empty' ? 'tutorial-empty' : ''} ${
                      isMovable ? 'tutorial-movable' : ''
                    } ${isLocked ? 'tutorial-locked' : ''} ${isRedOutlined ? 'tutorial-red-outline' : ''} ${
                      shouldFadeOut ? 'tutorial-fade-out' : ''
                    }`}
                    style={isStart ? guideStyle : undefined}
                  >
                    {icon && <img className="tutorial-cell-icon" src={icon} alt="" />}
                    {isClearPreview && previewIcon && (
                      <img className="tutorial-clear-preview" src={previewIcon} alt="" aria-hidden="true" />
                    )}
                  </div>
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
        )}

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
          <button className="primary-button" type="button" onClick={goNext}>
            {step.nextLabel}
          </button>
        </div>
      </section>
    </main>
  );
}
