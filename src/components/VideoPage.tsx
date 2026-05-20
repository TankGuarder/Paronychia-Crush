import { useEffect, useState } from 'react';
import type { LevelConfig } from '../types/game';

interface VideoPageProps {
  level: LevelConfig;
  isFinalLevel: boolean;
  onContinue: () => void;
}

export function VideoPage({ level, isFinalLevel, onContinue }: VideoPageProps) {
  const requiredSeconds = level.videoRequiredSeconds ?? 5;
  const [secondsLeft, setSecondsLeft] = useState(requiredSeconds);

  useEffect(() => {
    setSecondsLeft(requiredSeconds);
  }, [level.levelId, requiredSeconds]);

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
        {level.videoUrl ? (
          <video className="education-video" src={level.videoUrl} controls autoPlay playsInline />
        ) : (
          <div className="fake-video" aria-label="衛教影片模擬區塊">
            <span>衛教影片播放中</span>
          </div>
        )}
        <p className="lead video-message">{level.videoMessage}</p>
        <button className="primary-button" disabled={secondsLeft > 0} onClick={onContinue}>
          {secondsLeft > 0 ? `請觀看 ${secondsLeft} 秒後繼續` : isFinalLevel ? '進入結算' : '進入下一關'}
        </button>
      </section>
    </main>
  );
}
