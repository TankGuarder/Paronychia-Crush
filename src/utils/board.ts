import { playableTileTypes } from '../data/tiles';
import type {
  BoardCell,
  BoardTile,
  MatchResult,
  ObstaclePlacement,
  ObstacleType,
  TileType,
} from '../types/game';

const MAX_BOARD_SIZE = 5;
const MIN_BOARD_SIZE = 3;

export const maxBoardSize = MAX_BOARD_SIZE;

const normalizeBoardSize = (size: number) => {
  if (!Number.isFinite(size)) {
    return MAX_BOARD_SIZE;
  }

  return Math.min(MAX_BOARD_SIZE, Math.max(MIN_BOARD_SIZE, Math.floor(size)));
};

const makeId = () => crypto.randomUUID();

const randomTileType = (): TileType => {
  const index = Math.floor(Math.random() * playableTileTypes.length);
  return playableTileTypes[index];
};

const makeTile = (type: TileType = randomTileType()): BoardTile => ({
  id: makeId(),
  type,
});

const makeTileCell = (type: TileType = randomTileType()): BoardCell => ({
  kind: 'tile',
  tile: makeTile(type),
});

const makeObstacleCell = (type: ObstacleType): BoardCell => ({
  kind: 'obstacle',
  obstacle: {
    id: makeId(),
    type,
  },
});

const getCellTileType = (cell: BoardCell | undefined) => (cell?.kind === 'tile' ? cell.tile.type : undefined);

const createsImmediateMatch = (board: BoardCell[][], row: number, col: number, type: TileType) => {
  const horizontal =
    col >= 2 && getCellTileType(board[row][col - 1]) === type && getCellTileType(board[row][col - 2]) === type;
  const vertical =
    row >= 2 && getCellTileType(board[row - 1][col]) === type && getCellTileType(board[row - 2][col]) === type;
  return horizontal || vertical;
};

export const createBoard = (requestedSize: number, obstacles: ObstaclePlacement[] = []): BoardCell[][] => {
  const boardSize = normalizeBoardSize(requestedSize);
  const board: BoardCell[][] = [];

  // 開局避免直接出現三連，讓玩家第一步更可控。
  for (let row = 0; row < boardSize; row += 1) {
    board[row] = [];
    for (let col = 0; col < boardSize; col += 1) {
      let type = randomTileType();
      while (createsImmediateMatch(board, row, col, type)) {
        type = randomTileType();
      }
      board[row][col] = makeTileCell(type);
    }
  }

  obstacles.forEach((obstacle) => {
    if (obstacle.row >= 0 && obstacle.row < boardSize && obstacle.col >= 0 && obstacle.col < boardSize) {
      board[obstacle.row][obstacle.col] = makeObstacleCell(obstacle.type);
    }
  });

  return board;
};

export const areAdjacent = (a: [number, number], b: [number, number]) => {
  const rowDiff = Math.abs(a[0] - b[0]);
  const colDiff = Math.abs(a[1] - b[1]);
  return rowDiff + colDiff === 1;
};

export const canSwapCells = (board: BoardCell[][], first: [number, number], second: [number, number]) =>
  board[first[0]]?.[first[1]]?.kind === 'tile' && board[second[0]]?.[second[1]]?.kind === 'tile';

export const swapTiles = (board: BoardCell[][], first: [number, number], second: [number, number]) => {
  const next = board.map((row) => [...row]);
  const firstTile = next[first[0]][first[1]];
  next[first[0]][first[1]] = next[second[0]][second[1]];
  next[second[0]][second[1]] = firstTile;
  return next;
};

const findMatches = (board: BoardCell[][]): Set<string> => {
  const boardSize = board.length;
  const matched = new Set<string>();

  // 先找橫向，再找直向；交叉位置用 Set 避免重複計算。
  for (let row = 0; row < boardSize; row += 1) {
    let runStart = 0;
    for (let col = 1; col <= boardSize; col += 1) {
      const current = getCellTileType(board[row][col]);
      const previous = getCellTileType(board[row][runStart]);
      if (current !== previous) {
        if (previous && col - runStart >= 3) {
          for (let matchCol = runStart; matchCol < col; matchCol += 1) {
            matched.add(`${row}-${matchCol}`);
          }
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < boardSize; col += 1) {
    let runStart = 0;
    for (let row = 1; row <= boardSize; row += 1) {
      const current = getCellTileType(board[row]?.[col]);
      const previous = getCellTileType(board[runStart]?.[col]);
      if (current !== previous) {
        if (previous && row - runStart >= 3) {
          for (let matchRow = runStart; matchRow < row; matchRow += 1) {
            matched.add(`${matchRow}-${col}`);
          }
        }
        runStart = row;
      }
    }
  }

  return matched;
};

const canObstacleBeCleared = (obstacleType: ObstacleType, adjacentTileType: TileType) => {
  if (obstacleType === 'woundedParonychia') {
    return true;
  }

  return adjacentTileType !== 'cottonSwab';
};

const getAdjacentKeys = (row: number, col: number, boardSize: number) =>
  [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]
    .filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < boardSize && nextCol >= 0 && nextCol < boardSize)
    .map(([nextRow, nextCol]) => `${nextRow}-${nextCol}`);

const findClearedObstacles = (board: BoardCell[][], matched: Set<string>) => {
  const boardSize = board.length;
  const cleared = new Set<string>();

  matched.forEach((key) => {
    const [row, col] = key.split('-').map(Number);
    const matchedCell = board[row][col];

    if (matchedCell.kind !== 'tile') {
      return;
    }

    getAdjacentKeys(row, col, boardSize).forEach((adjacentKey) => {
      const [adjacentRow, adjacentCol] = adjacentKey.split('-').map(Number);
      const adjacentCell = board[adjacentRow][adjacentCol];

      if (
        adjacentCell.kind === 'obstacle' &&
        canObstacleBeCleared(adjacentCell.obstacle.type, matchedCell.tile.type)
      ) {
        cleared.add(adjacentKey);
      }
    });
  });

  return cleared;
};

const collapseBoard = (board: BoardCell[][], removed: Set<string>): BoardCell[][] => {
  const boardSize = board.length;
  const next: BoardCell[][] = Array.from({ length: boardSize }, () => Array<BoardCell>(boardSize));

  // 障礙被消除後會變成可補牌空格；未消除的障礙會固定在原位置。
  for (let col = 0; col < boardSize; col += 1) {
    let row = boardSize - 1;

    while (row >= 0) {
      const key = `${row}-${col}`;
      const cell = board[row][col];

      if (cell.kind === 'obstacle' && !removed.has(key)) {
        next[row][col] = cell;
        row -= 1;
        continue;
      }

      const segmentEnd = row;
      while (row >= 0) {
        const segmentKey = `${row}-${col}`;
        const segmentCell = board[row][col];
        if (segmentCell.kind === 'obstacle' && !removed.has(segmentKey)) {
          break;
        }
        row -= 1;
      }
      const segmentStart = row + 1;
      const survivors: BoardCell[] = [];

      for (let segmentRow = segmentEnd; segmentRow >= segmentStart; segmentRow -= 1) {
        const segmentKey = `${segmentRow}-${col}`;
        const segmentCell = board[segmentRow][col];
        if (segmentCell.kind === 'tile' && !removed.has(segmentKey)) {
          survivors.push(segmentCell);
        }
      }

      for (let segmentRow = segmentEnd; segmentRow >= segmentStart; segmentRow -= 1) {
        next[segmentRow][col] = survivors.shift() ?? makeTileCell();
      }
    }
  }

  return next;
};

const countObstacles = (board: BoardCell[][]) =>
  board.flat().filter((cell) => cell.kind === 'obstacle').length;

export const resolveBoard = (board: BoardCell[][]): MatchResult => {
  let nextBoard = board;
  let removedTotal = 0;
  let clearedObstacles = 0;
  const removedCounts: Partial<Record<TileType, number>> = {};

  while (true) {
    const matched = findMatches(nextBoard);
    if (matched.size === 0) {
      break;
    }

    const cleared = findClearedObstacles(nextBoard, matched);
    const removed = new Set([...matched, ...cleared]);

    matched.forEach((key) => {
      const [row, col] = key.split('-').map(Number);
      const cell = nextBoard[row][col];

      if (cell.kind === 'tile') {
        const type = cell.tile.type;
        removedCounts[type] = (removedCounts[type] ?? 0) + 1;
        removedTotal += 1;
      }
    });

    clearedObstacles += cleared.size;
    nextBoard = collapseBoard(nextBoard, removed);
  }

  return {
    board: nextBoard,
    removedCounts,
    removedTotal,
    clearedObstacles,
    remainingObstacles: countObstacles(nextBoard),
  };
};

export const hasAnyMatch = (board: BoardCell[][]) => findMatches(board).size > 0;
