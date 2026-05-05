import { useState, type CSSProperties, type PointerEvent } from 'react';
import { tileDefinitions } from '../data/tiles';
import { obstacleDefinitions } from '../data/obstacles';
import type { BoardAnimationState, BoardCell, BoardPosition, SuggestedMove } from '../types/game';

const tileMap = new Map(tileDefinitions.map((tile) => [tile.id, tile]));
const obstacleMap = new Map(obstacleDefinitions.map((obstacle) => [obstacle.id, obstacle]));
const swipeThreshold = 24;
const maxDragPreview = 76;

interface BoardProps {
  board: BoardCell[][];
  hintMove: SuggestedMove | null;
  animation: BoardAnimationState | null;
  disabled: boolean;
  onInteractionStart: () => void;
  onTileSwipe: (from: BoardPosition, to: BoardPosition) => void;
}

interface DragState {
  row: number;
  col: number;
  pointerId: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
}

const getHintIndex = (hintMove: SuggestedMove | null, row: number, col: number) =>
  hintMove?.findIndex(([hintRow, hintCol]) => hintRow === row && hintCol === col) ?? -1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getSwipeTarget = (drag: DragState): BoardPosition | null => {
  const absX = Math.abs(drag.deltaX);
  const absY = Math.abs(drag.deltaY);

  if (Math.max(absX, absY) < swipeThreshold) {
    return null;
  }

  if (absX > absY) {
    return [drag.row, drag.col + (drag.deltaX > 0 ? 1 : -1)];
  }

  return [drag.row + (drag.deltaY > 0 ? 1 : -1), drag.col];
};

const getDragStyle = (drag: DragState | null, row: number, col: number): CSSProperties | undefined => {
  if (!drag || drag.row !== row || drag.col !== col) {
    return undefined;
  }

  const absX = Math.abs(drag.deltaX);
  const absY = Math.abs(drag.deltaY);
  const dragX = absX >= absY ? clamp(drag.deltaX, -maxDragPreview, maxDragPreview) : 0;
  const dragY = absY > absX ? clamp(drag.deltaY, -maxDragPreview, maxDragPreview) : 0;

  return {
    '--drag-x': `${dragX}px`,
    '--drag-y': `${dragY}px`,
  } as CSSProperties;
};

export function Board({ board, hintMove, animation, disabled, onInteractionStart, onTileSwipe }: BoardProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const boardSize = board.length;
  const removingKeys = new Set(animation?.removingKeys ?? []);
  const droppingKeys = new Set(animation?.droppingKeys ?? []);
  const newTileKeys = new Set(animation?.newTileKeys ?? []);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, row: number, col: number, cell: BoardCell) => {
    if (disabled || cell.kind === 'obstacle') {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onInteractionStart();
    setDrag({
      row,
      col,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    setDrag({
      ...drag,
      deltaX: event.clientX - drag.startX,
      deltaY: event.clientY - drag.startY,
    });
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const target = getSwipeTarget(drag);
    const from: BoardPosition = [drag.row, drag.col];
    setDrag(null);

    if (target) {
      onTileSwipe(from, target);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag?.pointerId === event.pointerId) {
      setDrag(null);
    }
  };

  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      aria-label={`${boardSize} x ${boardSize} 遊戲棋盤`}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const hintIndex = getHintIndex(hintMove, rowIndex, colIndex);
          const isHinted = hintIndex >= 0;
          const isDragging = drag?.row === rowIndex && drag.col === colIndex;
          const cellKey = `${rowIndex}-${colIndex}`;
          const animationClass = [
            removingKeys.has(cellKey) ? 'removing' : '',
            droppingKeys.has(cellKey) ? 'dropping' : '',
            newTileKeys.has(cellKey) ? 'new-tile' : '',
            isDragging ? 'dragging' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const definition =
            cell.kind === 'tile' ? tileMap.get(cell.tile.type) : obstacleMap.get(cell.obstacle.type);
          const tileClass = cell.kind === 'tile' ? `tile-${cell.tile.type}` : `obstacle obstacle-${cell.obstacle.type}`;

          return (
            <button
              key={cell.kind === 'tile' ? cell.tile.id : cell.obstacle.id}
              className={`tile ${tileClass} ${isHinted ? 'hinted' : ''} ${animationClass}`}
              disabled={disabled}
              type="button"
              style={getDragStyle(drag, rowIndex, colIndex)}
              onPointerDown={(event) => handlePointerDown(event, rowIndex, colIndex, cell)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerCancel}
              aria-label={`${definition?.name ?? '方塊'}，第 ${rowIndex + 1} 列第 ${colIndex + 1} 欄`}
            >
              {definition?.icon && <img className="tile-icon" src={definition.icon} alt="" aria-hidden="true" />}
              {hintIndex === 1 && (
                <span className="idle-hand gesture-hand" aria-hidden="true">
                  <span className="gesture-trail" />
                  <span className="gesture-finger" />
                </span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
