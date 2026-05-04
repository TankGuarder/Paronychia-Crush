import type { LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'paronychia-match-leaderboard';
const invalidNicknamePattern = /^(unknown|undefined|null|不明玩家|未命名玩家|本次玩家|訪客|測試|test|player)$/i;

const sortEntries = (entries: LeaderboardEntry[]) =>
  [...entries].sort((a, b) => b.score - a.score || b.completedLevel - a.completedLevel);

const isValidDate = (value: string | undefined) => Boolean(value && !Number.isNaN(Date.parse(value)));

const normalizeEntry = (entry: Partial<LeaderboardEntry>): LeaderboardEntry | null => {
  const nickname = typeof entry.nickname === 'string' ? entry.nickname.trim() : '';
  const score = Number(entry.score);
  const completedLevel = Number(entry.completedLevel);
  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : undefined;

  if (
    !nickname ||
    invalidNicknamePattern.test(nickname) ||
    !Number.isFinite(score) ||
    score <= 0 ||
    !Number.isFinite(completedLevel) ||
    completedLevel < 0 ||
    !isValidDate(createdAt)
  ) {
    return null;
  }

  return {
    nickname,
    lineUserId: entry.lineUserId,
    score,
    completedLevel,
    createdAt: createdAt as string,
  };
};

const cleanEntries = (entries: unknown): LeaderboardEntry[] => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return sortEntries(
    entries
      .map((entry) => normalizeEntry(entry as Partial<LeaderboardEntry>))
      .filter((entry): entry is LeaderboardEntry => entry !== null),
  );
};

const writeLeaderboard = (entries: LeaderboardEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const loadLeaderboard = (): LeaderboardEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const entries = cleanEntries(JSON.parse(raw));
    writeLeaderboard(entries);
    return entries;
  } catch {
    writeLeaderboard([]);
    return [];
  }
};

export const saveScore = (entry: LeaderboardEntry) => {
  const validEntry = normalizeEntry(entry);
  const entries = validEntry ? sortEntries([...loadLeaderboard(), validEntry]) : loadLeaderboard();

  writeLeaderboard(entries);

  const rank = validEntry ? entries.findIndex((item) => item.createdAt === validEntry.createdAt) + 1 : 0;
  return { entries, rank };
};
