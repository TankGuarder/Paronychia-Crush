export type TileType =
  | 'ointment'
  | 'socks'
  | 'gloves'
  | 'lotion'
  | 'cottonSwab';

export type Screen = 'home' | 'tutorialVideo' | 'tutorialLevel' | 'game' | 'video' | 'quiz' | 'summary';

export interface TileDefinition {
  id: TileType;
  name: string;
  icon: string;
  educationHint: string;
}

export interface BoardTile {
  id: string;
  type: TileType;
}

export type ObstacleType = 'redParonychia' | 'woundedParonychia';

export type ObstacleCounts = Partial<Record<ObstacleType, number>>;

export interface ObstacleDefinition {
  id: ObstacleType;
  name: string;
  icon: string;
  hint: string;
}

export interface ObstaclePlacement {
  type: ObstacleType;
  row: number;
  col: number;
}

export interface BoardObstacle {
  id: string;
  type: ObstacleType;
}

export type BoardPosition = [number, number];

export type SuggestedMove = [BoardPosition, BoardPosition];

export type BoardCell =
  | {
      kind: 'tile';
      tile: BoardTile;
    }
  | {
      kind: 'obstacle';
      obstacle: BoardObstacle;
    };

export interface LevelGoal {
  label: string;
}

export interface LevelConfig {
  levelId: string;
  order: number;
  version: string;
  boardSize: number;
  secondsPerLevel: number;
  title: string;
  goal: LevelGoal;
  obstacles: ObstaclePlacement[];
  targetText: string;
  concept: string;
  passHint: string;
  videoTitle: string;
  videoMessage: string;
  demo?: LevelDemoConfig;
}

export interface LevelDemoConfig {
  title: string;
  message: string;
  durationMs: number;
  obstacleType: ObstacleType;
  matchTileType: TileType;
  obstaclePosition: [number, number];
  matchPositions: Array<[number, number]>;
  swipeFrom?: [number, number];
  swipeTo?: [number, number];
}

export interface QuizQuestion {
  id: string;
  levelId: string;
  version: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

export interface LeaderboardEntry {
  nickname: string;
  lineUserId?: string;
  score: number;
  completedLevel: number;
  createdAt: string;
}

export interface MatchResult {
  board: BoardCell[][];
  removedCounts: Partial<Record<TileType, number>>;
  removedTotal: number;
  clearedObstacles: number;
  remainingObstacles: number;
}

export interface BoardAnimationState {
  removingKeys: string[];
  droppingKeys: string[];
  newTileKeys: string[];
}

export interface BoardResolutionStep {
  board: BoardCell[][];
  animation: BoardAnimationState;
  removedCounts: Partial<Record<TileType, number>>;
  removedTotal: number;
  clearedObstacles: number;
  remainingObstacles: number;
}

export interface GameRules {
  totalLevels: number;
  secondsPerLevel: number;
  passBonusScore: number;
  quizCostScore: number;
  quizCorrectTimeBonus: number;
  leaderboardLimit: number;
}

export interface GameRunState {
  screen: Screen;
  nickname: string;
  lineUserId?: string;
  currentLevelIndex: number;
  completedLevel: number;
  score: number;
  timeBonus: number;
}

export type LiffMode = 'line' | 'browser' | 'mock';

export interface LiffUserProfile {
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
  mode: LiffMode;
  isLoggedIn: boolean;
  isMock: boolean;
}

export interface LiffInitState {
  isLoading: boolean;
  isConfigured: boolean;
  error?: string;
  profile: LiffUserProfile;
}
