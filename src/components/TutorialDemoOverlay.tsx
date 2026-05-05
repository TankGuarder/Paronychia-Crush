import type { CSSProperties } from 'react';
import { obstacleDefinitions } from '../data/obstacles';
import { tileDefinitions } from '../data/tiles';
import type { LevelDemoConfig } from '../types/game';

const tileMap = new Map(tileDefinitions.map((tile) => [tile.id, tile]));
const obstacleMap = new Map(obstacleDefinitions.map((obstacle) => [obstacle.id, obstacle]));

interface TutorialDemoOverlayProps {
  boardSize: number;
  demo: LevelDemoConfig;
}

const keyOf = ([row, col]: [number, number]) => `${row}-${col}`;

export function TutorialDemoOverlay({ boardSize, demo }: TutorialDemoOverlayProps) {
  const tileDefinition = tileMap.get(demo.matchTileType);
  const obstacleDefinition = obstacleMap.get(demo.obstacleType);
  const matchKeys = new Set(demo.matchPositions.map(keyOf));
  const obstacleKey = keyOf(demo.obstaclePosition);
  const progressStyle = { '--demo-duration': `${demo.durationMs}ms` } as CSSProperties;

  return (
    <div className="demo-backdrop" role="dialog" aria-modal="true" aria-label={demo.title}>
      <section className="demo-panel">
        <p className="eyebrow">操作示範</p>
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
          <span className="demo-arrow">→</span>
          <span className="demo-hand gesture-hand">
            <span className="gesture-trail" />
            <span className="gesture-finger" />
          </span>
        </div>
        <div className="demo-progress" style={progressStyle} />
      </section>
    </div>
  );
}
