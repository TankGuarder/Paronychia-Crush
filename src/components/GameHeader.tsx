interface GameHeaderProps {
  level: number;
  totalLevels: number;
  secondsLeft: number;
  score: number;
  targetText: string;
}

export function GameHeader({ level, totalLevels, secondsLeft, score, targetText }: GameHeaderProps) {
  return (
    <header className="game-header" aria-label="遊戲狀態">
      <div className="stat">
        <span>關卡</span>
        <strong>{level}/{totalLevels}</strong>
      </div>
      <div className="stat urgent">
        <span>剩餘</span>
        <strong>{secondsLeft} 秒</strong>
      </div>
      <div className="stat">
        <span>總分</span>
        <strong>{score}</strong>
      </div>
      <div className="goal-box">
        <span>關卡目標</span>
        <strong>{targetText}</strong>
      </div>
    </header>
  );
}
