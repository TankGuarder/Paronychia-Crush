import { tileDefinitions } from '../data/tiles';
import type { BoardTile } from '../types/game';

const tileMap = new Map(tileDefinitions.map((tile) => [tile.id, tile]));

interface BoardProps {
  board: BoardTile[][];
  selected: [number, number] | null;
  disabled: boolean;
  onTilePress: (row: number, col: number) => void;
}

export function Board({ board, selected, disabled, onTilePress }: BoardProps) {
  return (
    <div className="board" aria-label="三消棋盤">
      {board.map((row, rowIndex) =>
        row.map((tile, colIndex) => {
          const definition = tileMap.get(tile.type);
          const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;

          return (
            <button
              key={tile.id}
              className={`tile tile-${tile.type} ${isSelected ? 'selected' : ''}`}
              disabled={disabled}
              onClick={() => onTilePress(rowIndex, colIndex)}
              aria-label={`${definition?.name ?? tile.type}，第 ${rowIndex + 1} 列第 ${colIndex + 1} 欄`}
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
