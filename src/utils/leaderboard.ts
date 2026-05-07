import type { LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'paronychia-match-leaderboard';
const apiBaseUrl = (import.meta.env.VITE_LEADERBOARD_API_BASE_URL || '').replace(/\/$/, '');
const invalidNicknamePattern = /^(unknown|undefined|null|test|player|local player|mock player|不明玩家)$/i;

const sortEntries = (entries: LeaderboardEntry[]) =>
  [...entries].sort((a, b) => b.score - a.score || b.completedLevel - a.completedLevel || a.createdAt.localeCompare(b.createdAt));

const isValidDate = (value: string | undefined) => Boolean(value && !Number.isNaN(Date.parse(value)));

const normalizeEntry = (entry: Partial<LeaderboardEntry>): LeaderboardEntry | null => {
  const nickname = typeof entry.nickname === 'string' ? entry.nickname.trim() : '';
  const score = Number(entry.score);
  const completedLevel = Number(entry.completedLevel);
  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : undefined;
  const lineUserId = typeof entry.lineUserId === 'string' && entry.lineUserId.trim() ? entry.lineUserId.trim() : undefined;

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
    lineUserId,
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

const readRemoteLeaderboard = async (): Promise<LeaderboardEntry[] | null> => {
  if (!apiBaseUrl) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/api/leaderboard`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Leaderboard API failed: ${response.status}`);
  }

  const payload = (await response.json()) as { entries?: unknown };
  return cleanEntries(payload.entries);
};

const writeRemoteScore = async (entry: LeaderboardEntry) => {
  if (!apiBaseUrl) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/api/leaderboard`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error(`Leaderboard API failed: ${response.status}`);
  }

  return (await response.json()) as { entries?: unknown; rank?: number };
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

export const loadSharedLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    return (await readRemoteLeaderboard()) ?? loadLeaderboard();
  } catch {
    return loadLeaderboard();
  }
};

export const saveScore = async (entry: LeaderboardEntry) => {
  const validEntry = normalizeEntry(entry);

  if (validEntry) {
    try {
      const remoteResult = await writeRemoteScore(validEntry);
      if (remoteResult) {
        const entries = cleanEntries(remoteResult.entries);
        return {
          entries,
          rank: Number(remoteResult.rank) || entries.findIndex((item) => item.createdAt === validEntry.createdAt) + 1,
        };
      }
    } catch {
      // Keep the MVP playable in local mode if the shared API is not running.
    }
  }

  const entries = validEntry ? sortEntries([...loadLeaderboard(), validEntry]) : loadLeaderboard();
  writeLeaderboard(entries);

  const rank = validEntry ? entries.findIndex((item) => item.createdAt === validEntry.createdAt) + 1 : 0;
  return { entries, rank };
};
