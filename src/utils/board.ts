import { playableTileTypes } from '../data/tiles';
import type {
  BoardCell,
  BoardResolutionStep,
  BoardTile,
  MatchResult,
  ObstacleCounts,
  ObstaclePlacement,
  ObstacleType,
  SuggestedMove,
  TileType,
} from '../types/game';

const MAX_BOARD_SIZE = 15;
const MIN_BOARD_SIZE = 3;
const MAX_PLAYABLE_BOARD_ATTEMPTS = 80;
const MAX_OBSTACLES_PER_BOARD = 15;

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

const createBoardCandidate = (requestedSize: number, obstacles: ObstaclePlacement[] = []): BoardCell[][] => {
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

const getAdjacentKeys = (row: number, col: number, boardSize: number) =>
  [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]
    .filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < boardSize && nextCol >= 0 && nextCol < boardSize)
    .map(([nextRow, nextCol]) => `${nextRow}-${nextCol}`);

const getAdjacentPositions = (row: number, col: number, boardSize: number): Array<[number, number]> =>
  [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ].filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < boardSize && nextCol >= 0 && nextCol < boardSize) as Array<
    [number, number]
  >;

const findClearedObstacles = (board: BoardCell[][], matched: Set<string>) => {
  const boardSize = board.length;
  const cleared = new Set<string>();

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.kind !== 'obstacle') {
        return;
      }

      // All obstacle types share the same rule: if any four-way adjacent main tile
      // is in this match set, clear the obstacle in this resolution step.
      const hasAdjacentMatchedTile = getAdjacentKeys(rowIndex, colIndex, boardSize).some((adjacentKey) =>
        matched.has(adjacentKey),
      );

      if (hasAdjacentMatchedTile) {
        cleared.add(`${rowIndex}-${colIndex}`);
      }
    });
  });

  return cleared;
};

const hasObstacles = (board: BoardCell[][]) => board.some((row) => row.some((cell) => cell.kind === 'obstacle'));

const hasAccessibleObstacles = (board: BoardCell[][]) => {
  const boardSize = board.length;

  return board.every((row, rowIndex) =>
    row.every((cell, colIndex) => {
      if (cell.kind !== 'obstacle') {
        return true;
      }

      return getAdjacentPositions(rowIndex, colIndex, boardSize).some(
        ([adjacentRow, adjacentCol]) => board[adjacentRow][adjacentCol].kind === 'tile',
      );
    }),
  );
};

const getMatchesAfterSwap = (board: BoardCell[][], first: [number, number], second: [number, number]) => {
  if (!canSwapCells(board, first, second)) {
    return null;
  }

  const swapped = swapTiles(board, first, second);
  const matched = findMatches(swapped);
  return matched.size > 0 ? { swapped, matched } : null;
};

export const findObstacleClearingMove = (board: BoardCell[][]): SuggestedMove | null => {
  const boardSize = board.length;

  if (!hasObstacles(board)) {
    return null;
  }

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const first: [number, number] = [row, col];
      const candidates: Array<[number, number]> = [
        [row, col + 1],
        [row + 1, col],
      ];

      for (const second of candidates) {
        const result = getMatchesAfterSwap(board, first, second);

        if (result && findClearedObstacles(result.swapped, result.matched).size > 0) {
          return [first, second];
        }
      }
    }
  }

  return null;
};

const collapseBoardWithAnimation = (board: BoardCell[][], removed: Set<string>) => {
  const boardSize = board.length;
  const next: BoardCell[][] = Array.from({ length: boardSize }, () => Array<BoardCell>(boardSize));
  const droppingKeys = new Set<string>();
  const newTileKeys = new Set<string>();

  for (let col = 0; col < boardSize; col += 1) {
    const survivors: Array<{ cell: BoardCell; fromRow: number }> = [];

    // Obstacles are board contents, not fixed overlays. Any non-removed cell
    // keeps its identity and falls under the same gravity pass as main tiles.
    for (let row = boardSize - 1; row >= 0; row -= 1) {
      const key = `${row}-${col}`;
      if (!removed.has(key)) {
        survivors.push({ cell: board[row][col], fromRow: row });
      }
    }

    for (let row = boardSize - 1; row >= 0; row -= 1) {
      const survivor = survivors.shift();
      const key = `${row}-${col}`;

      if (survivor) {
        next[row][col] = survivor.cell;
        if (survivor.fromRow !== row) {
          droppingKeys.add(key);
        }
        continue;
      }

      next[row][col] = makeTileCell();
      newTileKeys.add(key);
    }
  }

  return {
    board: next,
    droppingKeys: [...droppingKeys],
    newTileKeys: [...newTileKeys],
  };
};

const countObstacles = (board: BoardCell[][]) =>
  board.flat().filter((cell) => cell.kind === 'obstacle').length;

export const countObstaclesByType = (board: BoardCell[][]): ObstacleCounts =>
  board.flat().reduce<ObstacleCounts>((counts, cell) => {
    if (cell.kind === 'obstacle') {
      counts[cell.obstacle.type] = (counts[cell.obstacle.type] ?? 0) + 1;
    }

    return counts;
  }, {});

export const resolveBoardStep = (board: BoardCell[][]): BoardResolutionStep | null => {
  const matched = findMatches(board);

  if (matched.size === 0) {
    return null;
  }

  const cleared = findClearedObstacles(board, matched);
  const removed = new Set([...matched, ...cleared]);
  const removedCounts: Partial<Record<TileType, number>> = {};
  let removedTotal = 0;

  matched.forEach((key) => {
    const [row, col] = key.split('-').map(Number);
    const cell = board[row][col];

    if (cell.kind === 'tile') {
      const type = cell.tile.type;
      removedCounts[type] = (removedCounts[type] ?? 0) + 1;
      removedTotal += 1;
    }
  });

  const collapsed = collapseBoardWithAnimation(board, removed);

  return {
    board: collapsed.board,
    animation: {
      removingKeys: [...removed],
      droppingKeys: collapsed.droppingKeys,
      newTileKeys: collapsed.newTileKeys,
    },
    removedCounts,
    removedTotal,
    clearedObstacles: cleared.size,
    remainingObstacles: countObstacles(collapsed.board),
  };
};

export const resolveBoard = (board: BoardCell[][]): MatchResult => {
  let nextBoard = board;
  let removedTotal = 0;
  let clearedObstacles = 0;
  const removedCounts: Partial<Record<TileType, number>> = {};

  while (true) {
    const step = resolveBoardStep(nextBoard);
    if (!step) {
      break;
    }

    Object.entries(step.removedCounts).forEach(([type, count]) => {
      removedCounts[type as TileType] = (removedCounts[type as TileType] ?? 0) + (count ?? 0);
    });

    removedTotal += step.removedTotal;
    clearedObstacles += step.clearedObstacles;
    nextBoard = step.board;
  }

  return {
    board: ensurePlayableBoard(nextBoard),
    removedCounts,
    removedTotal,
    clearedObstacles,
    remainingObstacles: countObstacles(nextBoard),
  };
};

export const hasAnyMatch = (board: BoardCell[][]) => findMatches(board).size > 0;

export const findSuggestedMove = (board: BoardCell[][]): SuggestedMove | null => {
  const obstacleMove = findObstacleClearingMove(board);
  if (obstacleMove) {
    return obstacleMove;
  }

  const boardSize = board.length;

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const first: [number, number] = [row, col];

      if (board[row][col].kind !== 'tile') {
        continue;
      }

      const candidates: Array<[number, number]> = [
        [row, col + 1],
        [row + 1, col],
      ];

      for (const second of candidates) {
        if (!canSwapCells(board, first, second)) {
          continue;
        }

        if (getMatchesAfterSwap(board, first, second)) {
          return [first, second];
        }
      }
    }
  }

  return null;
};

export const hasLegalMove = (board: BoardCell[][]) => findSuggestedMove(board) !== null;

const hasGoalRelevantMove = (board: BoardCell[][]) =>
  !hasObstacles(board) || (hasAccessibleObstacles(board) && findObstacleClearingMove(board) !== null);

const shuffleItems = <T,>(items: T[]) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const getObstaclePlacementsFromBoard = (board: BoardCell[][]): ObstaclePlacement[] =>
  board.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) =>
      cell.kind === 'obstacle' ? [{ type: cell.obstacle.type, row: rowIndex, col: colIndex }] : [],
    ),
  );

const rebuildBoardWithTiles = (board: BoardCell[][], tiles: BoardCell[]) => {
  let tileIndex = 0;

  return board.map((row) =>
    row.map((cell) => {
      if (cell.kind === 'obstacle') {
        return cell;
      }

      const nextTile = tiles[tileIndex];
      tileIndex += 1;
      return nextTile ?? makeTileCell();
    }),
  );
};

const isStablePlayableBoard = (board: BoardCell[][]) =>
  !hasAnyMatch(board) && hasLegalMove(board) && hasGoalRelevantMove(board);

const canPlaceLegalMovePattern = (board: BoardCell[][], positions: Array<[number, number]>) =>
  positions.every(([row, col]) => board[row]?.[col]?.kind === 'tile');

const withForcedLegalMovePattern = (
  board: BoardCell[][],
  positions: Array<[number, number]>,
  primaryType: TileType,
  blockerType: TileType,
) => {
  const next = board.map((row) => [...row]);
  const patternTypes = [primaryType, blockerType, primaryType, primaryType];

  positions.forEach(([row, col], index) => {
    next[row][col] = makeTileCell(patternTypes[index]);
  });

  return next;
};

const createPatternedTileBoard = (board: BoardCell[][]) =>
  board.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (cell.kind === 'obstacle') {
        return cell;
      }

      return makeTileCell(playableTileTypes[(rowIndex * 2 + colIndex) % playableTileTypes.length]);
    }),
  );

const createForcedPlayableBoard = (board: BoardCell[][]): BoardCell[][] | null => {
  const obstacles = getObstaclePlacementsFromBoard(board);
  const boardSize = board.length;
  const obstacleAdjacentPatterns = getObstacleAdjacentForcedPatterns(board);

  const tryForcePattern = (candidate: BoardCell[][], patterns: Array<Array<[number, number]>>) => {
    for (const pattern of patterns) {
      if (!canPlaceLegalMovePattern(candidate, pattern)) {
        continue;
      }

      for (const primaryType of playableTileTypes) {
        for (const blockerType of playableTileTypes) {
          if (primaryType === blockerType) {
            continue;
          }

          const forced = withForcedLegalMovePattern(candidate, pattern, primaryType, blockerType);

          if (isStablePlayableBoard(forced)) {
            return forced;
          }
        }
      }
    }

    return null;
  };

  const forcedCurrentBoard = tryForcePattern(board, obstacleAdjacentPatterns);
  if (forcedCurrentBoard) {
    return forcedCurrentBoard;
  }

  const forcedPatternedBoard = tryForcePattern(createPatternedTileBoard(board), obstacleAdjacentPatterns);
  if (forcedPatternedBoard) {
    return forcedPatternedBoard;
  }

  for (let attempt = 0; attempt < MAX_PLAYABLE_BOARD_ATTEMPTS; attempt += 1) {
    const candidate = createBoardCandidate(boardSize, obstacles);
    const forcedCandidate = tryForcePattern(candidate, obstacleAdjacentPatterns);

    if (forcedCandidate) {
      return forcedCandidate;
    }

    for (let row = 0; row < boardSize; row += 1) {
      for (let col = 0; col < boardSize; col += 1) {
        const patterns: Array<Array<[number, number]>> = [
          [
            [row, col],
            [row, col + 1],
            [row, col + 2],
            [row + 1, col + 1],
          ],
          [
            [row, col],
            [row + 1, col],
            [row + 2, col],
            [row + 1, col + 1],
          ],
        ];

        for (const pattern of patterns) {
          if (!canPlaceLegalMovePattern(candidate, pattern)) {
            continue;
          }

          for (const primaryType of playableTileTypes) {
            for (const blockerType of playableTileTypes) {
              if (primaryType === blockerType) {
                continue;
              }

              const forced = withForcedLegalMovePattern(candidate, pattern, primaryType, blockerType);

              if (isStablePlayableBoard(forced)) {
                return forced;
              }
            }
          }
        }
      }
    }
  }

  return null;
};

const getObstacleAdjacentForcedPatterns = (board: BoardCell[][]) => {
  const boardSize = board.length;
  const patterns: Array<Array<[number, number]>> = [];
  const seen = new Set<string>();

  const addPattern = (pattern: Array<[number, number]>) => {
    const key = pattern.map(([row, col]) => `${row}-${col}`).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      patterns.push(pattern);
    }
  };

  const isAdjacentToObstacle = (positions: Array<[number, number]>) =>
    positions.some(([row, col]) =>
      getAdjacentPositions(row, col, boardSize).some(
        ([adjacentRow, adjacentCol]) => board[adjacentRow][adjacentCol].kind === 'obstacle',
      ),
    );

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize - 2; col += 1) {
      const matchLine: Array<[number, number]> = [
        [row, col],
        [row, col + 1],
        [row, col + 2],
      ];

      if (!isAdjacentToObstacle(matchLine)) {
        continue;
      }

      [
        [row - 1, col + 1],
        [row + 1, col + 1],
      ].forEach(([supportRow, supportCol]) => {
        addPattern([...matchLine, [supportRow, supportCol]]);
      });
    }
  }

  for (let row = 0; row < boardSize - 2; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const matchLine: Array<[number, number]> = [
        [row, col],
        [row + 1, col],
        [row + 2, col],
      ];

      if (!isAdjacentToObstacle(matchLine)) {
        continue;
      }

      [
        [row + 1, col - 1],
        [row + 1, col + 1],
      ].forEach(([supportRow, supportCol]) => {
        addPattern([...matchLine, [supportRow, supportCol]]);
      });
    }
  }

  return patterns;
};

const hasAccessiblePlacements = (boardSize: number, obstacles: ObstaclePlacement[]) => {
  const occupied = new Set(obstacles.map((obstacle) => `${obstacle.row}-${obstacle.col}`));

  return obstacles.every((obstacle) =>
    getAdjacentPositions(obstacle.row, obstacle.col, boardSize).some(
      ([row, col]) => !occupied.has(`${row}-${col}`),
    ),
  );
};

const createAccessibleObstaclePlacements = (boardSize: number, obstacles: ObstaclePlacement[]) => {
  const safePlacementPatterns: Record<number, Array<[number, number]>> = {
    5: [
      [0, 4],
      [1, 0],
      [1, 4],
      [2, 0],
      [2, 4],
      [3, 0],
      [3, 4],
      [4, 0],
      [4, 2],
      [4, 4],
      [0, 0],
      [0, 2],
    ],
    6: [
      [0, 5],
      [1, 0],
      [1, 5],
      [2, 0],
      [2, 5],
      [3, 0],
      [3, 5],
      [4, 0],
      [4, 5],
      [5, 0],
      [5, 2],
      [5, 5],
      [0, 0],
      [0, 2],
      [2, 2],
      [3, 3],
    ],
  };
  const count = Math.min(obstacles.length, MAX_OBSTACLES_PER_BOARD, Math.max(0, boardSize * boardSize - 4));
  const safePattern = safePlacementPatterns[boardSize];

  if (safePattern && count <= safePattern.length) {
    return safePattern.slice(0, count).map(([row, col], index) => ({
      type: obstacles[index % obstacles.length]?.type ?? 'redParonychia',
      row,
      col,
    }));
  }

  const allPositions: Array<[number, number]> = [];
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      allPositions.push([row, col]);
    }
  }

  const preferredPositions = [
    ...allPositions.filter(([row, col]) => (row + col) % 2 === 0),
    ...allPositions.filter(([row, col]) => (row + col) % 2 !== 0),
  ];

  for (let attempt = 0; attempt < MAX_PLAYABLE_BOARD_ATTEMPTS; attempt += 1) {
    const pool = attempt === 0 ? preferredPositions : shuffleItems(preferredPositions);
    const placements = pool.slice(0, count).map(([row, col], index) => ({
      type: obstacles[index % obstacles.length]?.type ?? 'redParonychia',
      row,
      col,
    }));

    if (hasAccessiblePlacements(boardSize, placements)) {
      return placements;
    }
  }

  return obstacles.slice(0, count);
};

export const shuffleBoardPreservingObstacles = (board: BoardCell[][]): BoardCell[][] => {
  const tiles = board.flat().filter((cell) => cell.kind === 'tile');

  // 先嘗試只重排既有主方塊；障礙方塊留在原位，因此不會改變關卡進度。
  for (let attempt = 0; attempt < MAX_PLAYABLE_BOARD_ATTEMPTS; attempt += 1) {
    const shuffled = rebuildBoardWithTiles(board, shuffleItems(tiles));

    if (isStablePlayableBoard(shuffled)) {
      return shuffled;
    }
  }

  const obstacles = getObstaclePlacementsFromBoard(board);

  // 若既有方塊組合本身難以重排出合法步，改產生新的主方塊；仍保留障礙位置與數量。
  for (let attempt = 0; attempt < MAX_PLAYABLE_BOARD_ATTEMPTS; attempt += 1) {
    const candidate = createBoardCandidate(board.length, obstacles);

    if (isStablePlayableBoard(candidate)) {
      return candidate;
    }
  }

  const accessibleObstacles = createAccessibleObstaclePlacements(board.length, obstacles);
  for (let attempt = 0; attempt < MAX_PLAYABLE_BOARD_ATTEMPTS; attempt += 1) {
    const candidate = createBoardCandidate(board.length, accessibleObstacles);

    if (isStablePlayableBoard(candidate)) {
      return candidate;
    }
  }

  return createForcedPlayableBoard(createBoardCandidate(board.length, accessibleObstacles)) ?? createForcedPlayableBoard(board) ?? board;
};

export const ensurePlayableBoard = (board: BoardCell[][]) =>
  isStablePlayableBoard(board) ? board : shuffleBoardPreservingObstacles(board);

export const createBoard = (requestedSize: number, obstacles: ObstaclePlacement[] = []): BoardCell[][] => {
  for (let attempt = 0; attempt < MAX_PLAYABLE_BOARD_ATTEMPTS; attempt += 1) {
    const candidate = createBoardCandidate(requestedSize, obstacles);

    if (isStablePlayableBoard(candidate)) {
      return candidate;
    }
  }

  return ensurePlayableBoard(createBoardCandidate(requestedSize, obstacles));
};
