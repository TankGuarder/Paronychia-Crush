interface HomePageProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  onStart: () => void;
}

export function HomePage({ nickname, onNicknameChange, onStart }: HomePageProps) {
  const canStart = nickname.trim().length > 0;

  return (
    <main className="page home-page">
      <section className="intro-panel">
        <p className="eyebrow">甲溝炎照護練習</p>
        <h1>甲溝炎衛教三消遊戲</h1>
        <p className="lead">
          共 10 關固定任務。交換相鄰方塊，完成每關照護任務，複習一個甲溝炎照護重點。
        </p>

        <label className="field">
          <span>玩家暱稱</span>
          <input
            value={nickname}
            maxLength={12}
            placeholder="例如：王阿姨"
            onChange={(event) => onNicknameChange(event.target.value)}
          />
        </label>

        <button className="primary-button" disabled={!canStart} onClick={onStart}>
          開始遊戲
        </button>
      </section>
    </main>
  );
}
