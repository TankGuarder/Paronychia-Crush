import type { LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'paronychia-match-leaderboard';
const apiBaseUrl = (import.meta.env.VITE_LEADERBOARD_API_BASE_URL || '').replace(/\/$/, '');
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseTableName = 'leaderboard_entries';
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

const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

const toSupabaseRow = (entry: LeaderboardEntry) => ({
  nickname: entry.nickname,
  score: entry.score,
  completed_level: entry.completedLevel,
  line_user_id: entry.lineUserId ?? null,
  created_at: entry.createdAt,
});

const fromSupabaseRow = (row: Record<string, unknown>): Partial<LeaderboardEntry> => ({
  nickname: typeof row.nickname === 'string' ? row.nickname : undefined,
  score: Number(row.score),
  completedLevel: Number(row.completed_level),
  lineUserId: typeof row.line_user_id === 'string' ? row.line_user_id : undefined,
  createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
});

const supabaseHeaders = () => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  Accept: 'application/json',
});

const readSupabaseLeaderboard = async (): Promise<LeaderboardEntry[] | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const query = new URLSearchParams({
    select: 'nickname,score,completed_level,line_user_id,created_at',
    order: 'score.desc,completed_level.desc,created_at.asc',
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTableName}?${query}`, {
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Supabase leaderboard failed: ${response.status}`);
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return cleanEntries(rows.map(fromSupabaseRow));
};

const writeSupabaseScore = async (entry: LeaderboardEntry) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTableName}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(toSupabaseRow(entry)),
  });

  if (!response.ok) {
    throw new Error(`Supabase leaderboard failed: ${response.status}`);
  }

  const entries = (await readSupabaseLeaderboard()) ?? [];
  return {
    entries,
    rank: entries.findIndex((item) => item.createdAt === entry.createdAt && item.nickname === entry.nickname) + 1,
  };
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

export const getLeaderboardSourceLabel = () => {
  if (isSupabaseConfigured()) {
    return 'Supabase';
  }
  if (apiBaseUrl) {
    return apiBaseUrl;
  }
  return '本機 localStorage 模式';
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
    return (await readSupabaseLeaderboard()) ?? (await readRemoteLeaderboard()) ?? loadLeaderboard();
  } catch {
    return loadLeaderboard();
  }
};

export const saveScore = async (entry: LeaderboardEntry) => {
  const validEntry = normalizeEntry(entry);

  if (validEntry) {
    try {
      const supabaseResult = await writeSupabaseScore(validEntry);
      if (supabaseResult) {
        return supabaseResult;
      }
    } catch {
      // Keep the MVP playable if Supabase is not configured correctly yet.
    }

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
