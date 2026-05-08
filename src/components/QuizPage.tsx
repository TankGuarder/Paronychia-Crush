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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const question = useMemo(
    () => quizQuestions.find((item) => item.levelId === level.levelId && item.version === level.version) ?? quizQuestions[0],
    [level.levelId, level.version],
  );
  const correctChoice = question.choices[question.answerIndex];

  const submit = () => {
    if (selectedIndex === null) {
      setFeedback('請先選擇一個答案。');
      return;
    }

    setHasSubmitted(true);

    if (selectedIndex === question.answerIndex) {
      setFeedback('答對了！即將回到原關卡並增加 10 秒。');
      window.setTimeout(onCorrect, 1800);
      return;
    }

    setFeedback('答錯了，請先看正確答案與詳細說明。');
    window.setTimeout(onWrong, 2800);
  };

  return (
    <main className="page quiz-page">
      <section className="quiz-panel">
        <p className="eyebrow">互動挑戰題</p>
        <h1>{question.prompt}</h1>
        <div className="choice-list">
          {question.choices.map((choice, index) => (
            <button
              key={choice}
              className={`choice ${selectedIndex === index ? 'selected' : ''} ${
                hasSubmitted && index === question.answerIndex ? 'correct' : ''
              } ${hasSubmitted && selectedIndex === index && selectedIndex !== question.answerIndex ? 'incorrect' : ''}`}
              disabled={hasSubmitted}
              onClick={() => setSelectedIndex(index)}
            >
              {choice}
            </button>
          ))}
        </div>

        {hasSubmitted && (
          <div className="answer-panel" aria-live="polite">
            <strong>正確答案：{correctChoice}</strong>
            <p>{question.explanation}</p>
          </div>
        )}

        <p className="status-message">
          {feedback || `答對可回到原關卡，並增加 ${rules.quizCorrectTimeBonus} 秒。`}
        </p>
        <button className="primary-button" disabled={hasSubmitted} onClick={submit}>
          送出答案
        </button>
      </section>
    </main>
  );
}
