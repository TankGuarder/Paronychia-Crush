import { useEffect, useMemo, useState } from 'react';
import type { LeaderboardEntry } from '../types/game';
import { loadSharedLeaderboard } from '../utils/leaderboard';

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_LEADERBOARD_API_BASE_URL || '本機 localStorage 模式', []);

  const refresh = async () => {
    setIsLoading(true);
    setError('');
    try {
      setEntries(await loadSharedLeaderboard());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '無法讀取排行榜資料');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <main className="page admin-page">
      <section className="admin-panel">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">後台排行榜</p>
            <h1>所有玩家名次</h1>
            <p className="admin-meta">資料來源：{apiBaseUrl}</p>
          </div>
          <button className="secondary-button admin-refresh" onClick={() => void refresh()}>
            重新整理
          </button>
        </div>

        {isLoading && <p className="status-message">讀取排行榜資料中...</p>}
        {error && <p className="status-message warning-text">{error}</p>}
        {!isLoading && !error && entries.length === 0 && <p className="status-message">目前尚無有效遊戲紀錄。</p>}

        {entries.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>名次</th>
                  <th>暱稱</th>
                  <th>分數</th>
                  <th>完成關卡</th>
                  <th>完成時間</th>
                  <th>LINE 帳號 ID</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={`${entry.nickname}-${entry.createdAt}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{entry.nickname}</td>
                    <td>{entry.score}</td>
                    <td>第 {entry.completedLevel} 關</td>
                    <td>{formatDateTime(entry.createdAt)}</td>
                    <td>{entry.lineUserId || '未取得'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
