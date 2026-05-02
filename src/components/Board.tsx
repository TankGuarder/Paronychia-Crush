import { tileDefinitions } from '../data/tiles';
import { obstacleDefinitions } from '../data/obstacles';
import type { BoardCell } from '../types/game';

const tileMap = new Map(tileDefinitions.map((tile) => [tile.id, tile]));
const obstacleMap = new Map(obstacleDefinitions.map((obstacle) => [obstacle.id, obstacle]));

interface BoardProps {
  board: BoardCell[][];
  selected: [number, number] | null;
  disabled: boolean;
  onTilePress: (row: number, col: number) => void;
}

export function Board({ board, selected, disabled, onTilePress }: BoardProps) {
  const boardSize = board.length;

  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      aria-label={`${boardSize} 乘 ${boardSize} 三消棋盤`}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
          const definition =
            cell.kind === 'tile' ? tileMap.get(cell.tile.type) : obstacleMap.get(cell.obstacle.type);
          const tileClass = cell.kind === 'tile' ? `tile-${cell.tile.type}` : `obstacle obstacle-${cell.obstacle.type}`;

          return (
            <button
              key={cell.kind === 'tile' ? cell.tile.id : cell.obstacle.id}
              className={`tile ${tileClass} ${isSelected ? 'selected' : ''}`}
              disabled={disabled}
              onClick={() => onTilePress(rowIndex, colIndex)}
              aria-label={`${definition?.name ?? '方塊'}，第 ${rowIndex + 1} 列第 ${colIndex + 1} 欄`}
            >
              {definition?.icon && (
                <img className="tile-icon" src={definition.icon} alt="" aria-hidden="true" />
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
