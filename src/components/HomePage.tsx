import homeCover from '../assets/home-cover.png';

interface HomePageProps {
  nickname: string;
  liffStatusText: string;
  liffDisplayName?: string;
  lineUserId?: string;
  onNicknameChange: (value: string) => void;
  onStart: () => void;
}

export function HomePage({
  nickname,
  liffStatusText,
  liffDisplayName,
  lineUserId,
  onNicknameChange,
  onStart,
}: HomePageProps) {
  const canStart = nickname.trim().length > 0;

  return (
    <main className="page home-page">
      <section className="cover-screen" aria-label="甲溝炎傳奇開始畫面">
        <img className="cover-art" src={homeCover} alt="" aria-hidden="true" />

        <div className="cover-start-panel">
          <div className="cover-player-card">
            <label className="cover-field">
              <span>玩家暱稱</span>
              <input
                value={nickname}
                maxLength={12}
                placeholder="輸入暱稱"
                onChange={(event) => onNicknameChange(event.target.value)}
              />
            </label>

            <button className="cover-start-button" disabled={!canStart} onClick={onStart}>
              開始遊戲
            </button>
          </div>

          <div className="cover-liff-status" aria-live="polite">
            <strong>{liffStatusText}</strong>
            {liffDisplayName && <span>LINE 名稱：{liffDisplayName}</span>}
            {lineUserId && <span>已保留 LINE 識別資訊</span>}
          </div>
        </div>
      </section>
    </main>
  );
}
