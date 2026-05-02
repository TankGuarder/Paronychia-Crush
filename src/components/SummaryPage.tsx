import type { LeaderboardEntry } from '../types/game';

interface SummaryPageProps {
  nickname: string;
  score: number;
  completedLevel: number;
  leaderboard: LeaderboardEntry[];
  rank: number;
  leaderboardLimit: number;
  onRestart: () => void;
}

export function SummaryPage({
  nickname,
  score,
  completedLevel,
  leaderboard,
  rank,
  leaderboardLimit,
  onRestart,
}: SummaryPageProps) {
  const topEntries = leaderboard.slice(0, leaderboardLimit);

  return (
    <main className="page summary-page">
      <section className="summary-panel">
        <p className="eyebrow">結算</p>
        <h1>{nickname} 的照護挑戰結果</h1>
        <div className="result-grid">
          <div>
            <span>總分</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>完成到</span>
            <strong>第 {completedLevel} 關</strong>
          </div>
          <div>
            <span>本次名次</span>
            <strong>第 {rank} 名</strong>
          </div>
        </div>

        <h2>暫時排行榜</h2>
        <ol className="leaderboard">
          {topEntries.map((entry, index) => (
            <li key={`${entry.nickname}-${entry.createdAt}`}>
              <span>{index + 1}. {entry.nickname}</span>
              <strong>{entry.score} 分</strong>
            </li>
          ))}
        </ol>

        {rank > leaderboardLimit && (
          <p className="status-message">你的本次名次是第 {rank} 名，目前未進入前 {leaderboardLimit} 名。</p>
        )}
        <button className="primary-button" onClick={onRestart}>再玩一次</button>
      </section>
    </main>
  );
}
