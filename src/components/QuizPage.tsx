import { useMemo, useState } from 'react';
import { quizQuestions } from '../data/questions';
import type { GameRules, LevelConfig } from '../types/game';

interface QuizPageProps {
  level: LevelConfig;
  rules: GameRules;
  onCorrect: () => void;
  onWrong: () => void;
}

export function QuizPage({ level, rules, onCorrect, onWrong }: QuizPageProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const question = useMemo(
    () => quizQuestions.find((item) => item.levelId === level.levelId && item.version === level.version) ?? quizQuestions[0],
    [level.levelId, level.version],
  );

  const submit = () => {
    if (selectedIndex === null) {
      setFeedback('請先選擇一個答案。');
      return;
    }

    if (selectedIndex === question.answerIndex) {
      onCorrect();
      return;
    }

    setFeedback(question.explanation);
    window.setTimeout(onWrong, 900);
  };

  return (
    <main className="page quiz-page">
      <section className="quiz-panel">
        <p className="eyebrow">互動題挑戰</p>
        <h1>{question.prompt}</h1>
        <div className="choice-list">
          {question.choices.map((choice, index) => (
            <button
              key={choice}
              className={`choice ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(index)}
            >
              {choice}
            </button>
          ))}
        </div>
        <p className="status-message">
          {feedback || `答對可回到原關卡並增加 ${rules.quizCorrectTimeBonus} 秒。答錯會直接結算。`}
        </p>
        <button className="primary-button" onClick={submit}>送出答案</button>
      </section>
    </main>
  );
}
