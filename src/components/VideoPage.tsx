import { useEffect, useState } from 'react';
import type { LevelConfig } from '../types/game';

interface VideoPageProps {
  level: LevelConfig;
  isFinalLevel: boolean;
  onContinue: () => void;
}

export function VideoPage({ level, isFinalLevel, onContinue }: VideoPageProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <main className="page video-page">
      <section className="video-layout">
        <p className="eyebrow">衛教影片</p>
        <h1>{level.videoTitle}</h1>
        <div className="fake-video" aria-label="假影片區塊">
          <span>影片模擬區</span>
        </div>
        <p className="lead">{level.videoMessage}</p>
        <button className="primary-button" disabled={secondsLeft > 0} onClick={onContinue}>
          {secondsLeft > 0 ? `請先觀看 ${secondsLeft} 秒` : isFinalLevel ? '前往結算' : '進入下一關'}
        </button>
      </section>
    </main>
  );
}
