import { playableTileTypes } from '../data/tiles';
import type { BoardTile, MatchResult, TileType } from '../types/game';

const BOARD_SIZE = 8;

export const boardSize = BOARD_SIZE;

const makeId = () => crypto.randomUUID();

const randomTileType = (): TileType => {
  const index = Math.floor(Math.random() * playableTileTypes.length);
  return playableTileTypes[index];
};

const makeTile = (type: TileType = randomTileType()): BoardTile => ({
  id: makeId(),
  type,
});

const createsImmediateMatch = (board: BoardTile[][], row: number, col: number, type: TileType) => {
  const horizontal =
    col >= 2 && board[row][col - 1]?.type === type && board[row][col - 2]?.type === type;
  const vertical =
    row >= 2 && board[row - 1][col]?.type === type && board[row - 2][col]?.type === type;
  return horizontal || vertical;
};

export const createBoard = (): BoardTile[][] => {
  const board: BoardTile[][] = [];

  // 開局避免直接出現三連，讓玩家第一步更可控。
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let type = randomTileType();
      while (createsImmediateMatch(board, row, col, type)) {
        type = randomTileType();
      }
      board[row][col] = makeTile(type);
    }
  }

  return board;
};

export const areAdjacent = (a: [number, number], b: [number, number]) => {
  const rowDiff = Math.abs(a[0] - b[0]);
  const colDiff = Math.abs(a[1] - b[1]);
  return rowDiff + colDiff === 1;
};

export const swapTiles = (board: BoardTile[][], first: [number, number], second: [number, number]) => {
  const next = board.map((row) => [...row]);
  const firstTile = next[first[0]][first[1]];
  next[first[0]][first[1]] = next[second[0]][second[1]];
  next[second[0]][second[1]] = firstTile;
  return next;
};

const findMatches = (board: BoardTile[][]): Set<string> => {
  const matched = new Set<string>();

  // 先找橫向，再找直向；交叉位置用 Set 避免重複計算。
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let runStart = 0;
    for (let col = 1; col <= BOARD_SIZE; col += 1) {
      const current = board[row][col]?.type;
      const previous = board[row][runStart]?.type;
      if (current !== previous) {
        if (col - runStart >= 3) {
          for (let matchCol = runStart; matchCol < col; matchCol += 1) {
            matched.add(`${row}-${matchCol}`);
          }
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let runStart = 0;
    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const current = board[row]?.[col]?.type;
      const previous = board[runStart]?.[col]?.type;
      if (current !== previous) {
        if (row - runStart >= 3) {
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

const collapseBoard = (board: BoardTile[][], matched: Set<string>): BoardTile[][] => {
  const next: BoardTile[][] = Array.from({ length: BOARD_SIZE }, () => Array<BoardTile>(BOARD_SIZE));

  // 每一欄由下往上保留未消除方塊，再從頂端補入新方塊。
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const survivors: BoardTile[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      if (!matched.has(`${row}-${col}`)) {
        survivors.push(board[row][col]);
      }
    }

    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      next[row][col] = survivors.shift() ?? makeTile();
    }
  }

  return next;
};

export const resolveBoard = (board: BoardTile[][]): MatchResult => {
  let nextBoard = board;
  let removedTotal = 0;
  const removedCounts: Partial<Record<TileType, number>> = {};

  while (true) {
    const matched = findMatches(nextBoard);
    if (matched.size === 0) {
      break;
    }

    matched.forEach((key) => {
      const [row, col] = key.split('-').map(Number);
      const type = nextBoard[row][col].type;
      removedCounts[type] = (removedCounts[type] ?? 0) + 1;
      removedTotal += 1;
    });

    nextBoard = collapseBoard(nextBoard, matched);
  }

  return { board: nextBoard, removedCounts, removedTotal };
};

export const hasAnyMatch = (board: BoardTile[][]) => findMatches(board).size > 0;
