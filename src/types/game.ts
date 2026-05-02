export type TileType = 'ointment' | 'looseSocks' | 'gloves' | 'moisturizer' | 'cottonSwab' | 'redness';

export type Screen = 'home' | 'game' | 'video' | 'quiz' | 'summary';

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

export interface LevelGoal {
  tileType: TileType;
  count: number;
  label: string;
}

export interface LevelConfig {
  levelId: string;
  order: number;
  version: string;
  title: string;
  goal: LevelGoal;
  targetText: string;
  concept: string;
  passHint: string;
  videoTitle: string;
  videoMessage: string;
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
  board: BoardTile[][];
  removedCounts: Partial<Record<TileType, number>>;
  removedTotal: number;
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
