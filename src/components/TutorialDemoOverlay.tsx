import type { CSSProperties } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import { tileDefinitions } from '../data/tiles';
import hintHandIcon from '../assets/icons/hint-hand.svg';
import type { LevelDemoConfig } from '../types/game';

const tileMap = new Map(tileDefinitions.map((tile) => [tile.id, tile]));
const obstacleMap = new Map(obstacleDefinitions.map((obstacle) => [obstacle.id, obstacle]));

interface TutorialDemoOverlayProps {
  boardSize: number;
  demo: LevelDemoConfig;
}

const keyOf = ([row, col]: [number, number]) => `${row}-${col}`;

const positionToPercent = ([row, col]: [number, number], boardSize: number) => ({
  x: ((col + 0.5) / boardSize) * 100,
  y: ((row + 0.5) / boardSize) * 100,
});

export function TutorialDemoOverlay({ boardSize, demo }: TutorialDemoOverlayProps) {
  const tileDefinition = tileMap.get(demo.matchTileType);
  const obstacleDefinition = obstacleMap.get(demo.obstacleType);
  const matchKeys = new Set(demo.matchPositions.map(keyOf));
  const obstacleKey = keyOf(demo.obstaclePosition);
  const progressStyle = { '--demo-duration': `${demo.durationMs}ms` } as CSSProperties;
  const swipeFrom = demo.swipeFrom ?? demo.matchPositions[0];
  const swipeTo = demo.swipeTo ?? demo.matchPositions[demo.matchPositions.length - 1];
  const startPoint = positionToPercent(swipeFrom, boardSize);
  const endPoint = positionToPercent(swipeTo, boardSize);
  const handStyle = {
    '--demo-hand-left': `${startPoint.x}%`,
    '--demo-hand-top': `${startPoint.y}%`,
    '--demo-hand-dx': `${endPoint.x - startPoint.x}%`,
    '--demo-hand-dy': `${endPoint.y - startPoint.y}%`,
  } as CSSProperties;

  return (
    <div className="demo-backdrop" role="dialog" aria-modal="true" aria-label={demo.title}>
      <section className="demo-panel">
        <p className="eyebrow">教學示範</p>
        <h2>{demo.title}</h2>
        <p>{demo.message}</p>
        <div
          className="demo-board"
          style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          {Array.from({ length: boardSize * boardSize }, (_, index) => {
            const row = Math.floor(index / boardSize);
            const col = index % boardSize;
            const key = `${row}-${col}`;
            const isMatch = matchKeys.has(key);
            const isObstacle = key === obstacleKey;
            const icon = isObstacle ? obstacleDefinition?.icon : isMatch ? tileDefinition?.icon : undefined;

            return (
              <div
                key={key}
                className={`demo-cell ${isMatch ? 'demo-match' : ''} ${isObstacle ? 'demo-obstacle' : ''}`}
              >
                {icon && <img src={icon} alt="" />}
                {isMatch && <span className="demo-spark" />}
                {isObstacle && <span className="demo-ring" />}
              </div>
            );
          })}
          <svg className="demo-swipe-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1={startPoint.x} y1={startPoint.y} x2={endPoint.x} y2={endPoint.y} />
            <circle cx={startPoint.x} cy={startPoint.y} r="2.8" />
            <circle cx={endPoint.x} cy={endPoint.y} r="3.6" />
          </svg>
          <span className="demo-hand" style={handStyle}>
            <img src={hintHandIcon} alt="" />
          </span>
        </div>
        <div className="demo-progress" style={progressStyle} />
      </section>
    </div>
  );
}
