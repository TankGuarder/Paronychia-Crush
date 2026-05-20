import { useEffect, useRef } from 'react';
import introVideoUrl from '../assets/videos/intro-title.mp4';

interface IntroVideoPageProps {
  onDone: () => void;
}

export function IntroVideoPage({ onDone }: IntroVideoPageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    void video.play().catch(() => undefined);
  }, []);

  return (
    <main className="intro-video-page" aria-label="遊戲片頭影片">
      <video
        ref={videoRef}
        className="intro-video"
        src={introVideoUrl}
        autoPlay
        playsInline
        controls={false}
        onEnded={onDone}
      />
      <button className="intro-skip-button" type="button" onClick={onDone}>
        略過
      </button>
    </main>
  );
}
