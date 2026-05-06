import { useEffect, useRef } from 'react';
import homeBgmUrl from '../assets/audio/home-bgm.mp3';
import homeCover from '../assets/home-cover.png';

interface HomePageProps {
  nickname: string;
  liffStatusText: string;
  liffDisplayName?: string;
  lineUserId?: string;
  onNicknameChange: (value: string) => void;
  onStart: () => void;
}

export function HomePage({ nickname, onNicknameChange, onStart }: HomePageProps) {
  const canStart = nickname.trim().length > 0;
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const playHomeBgm = () => {
    const audio = bgmRef.current;
    if (!audio) {
      return;
    }

    void audio.play().catch(() => undefined);
  };

  useEffect(() => {
    const audio = new Audio(homeBgmUrl);
    audio.loop = true;
    audio.volume = 0.36;
    bgmRef.current = audio;
    playHomeBgm();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      bgmRef.current = null;
    };
  }, []);

  return (
    <main className="page home-page">
      <section className="cover-screen" aria-label="甲溝炎傳奇首頁" onPointerDown={playHomeBgm}>
        <img className="cover-art" src={homeCover} alt="" aria-hidden="true" />

        <div className="cover-start-panel">
          <div className="cover-player-card">
            <label className="cover-field">
              <span>玩家暱稱</span>
              <input
                value={nickname}
                maxLength={12}
                placeholder="請輸入暱稱"
                onChange={(event) => onNicknameChange(event.target.value)}
                onFocus={playHomeBgm}
              />
            </label>

            <button className="cover-start-button" disabled={!canStart} onPointerDown={playHomeBgm} onClick={onStart}>
              開始遊戲
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
