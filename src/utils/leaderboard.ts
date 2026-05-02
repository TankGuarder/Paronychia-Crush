import { sampleLeaderboard } from '../data/sampleLeaderboard';
import type { LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'paronychia-match-leaderboard';

const sortEntries = (entries: LeaderboardEntry[]) =>
  [...entries].sort((a, b) => b.score - a.score || b.completedLevel - a.completedLevel);

export const loadLeaderboard = (): LeaderboardEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return sampleLeaderboard;
  }

  try {
    return sortEntries(JSON.parse(raw) as LeaderboardEntry[]);
  } catch {
    return sampleLeaderboard;
  }
};

export const saveScore = (entry: LeaderboardEntry) => {
  // MVP 先用 localStorage 模擬排行榜，之後可替換成 API 呼叫。
  const entries = sortEntries([...loadLeaderboard(), entry]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  const rank = entries.findIndex((item) => item.createdAt === entry.createdAt) + 1;
  return { entries, rank };
};
