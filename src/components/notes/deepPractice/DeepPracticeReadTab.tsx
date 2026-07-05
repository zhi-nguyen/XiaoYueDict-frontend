import React, { useState, useMemo } from 'react';
import { ReadingExercise } from '@/types/note';

interface DeepPracticeReadTabProps {
  exercise: ReadingExercise;
  onAnswered: (isCorrect: boolean) => void;
  onSkip?: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function DeepPracticeReadTab({
  exercise,
  onAnswered,
  onSkip,
}: DeepPracticeReadTabProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const shuffledChoices = useMemo(() => {
    if (!exercise?.choices) return [];
    return shuffleArray([...exercise.choices]);
  }, [exercise]);

  const handleSelect = (idx: number, isCorrect: boolean) => {
    if (selectedIdx !== null) return; // Only allow one choice
    setSelectedIdx(idx);
    onAnswered(isCorrect);
  };

  return (
    <div className="py-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-primary text-left">
          Tìm nghĩa đúng của từ vựng mục tiêu trong câu dưới đây:
        </h3>
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-outline hover:bg-hover-bg text-secondary hover:text-primary transition-all text-xs font-bold focus:outline-none shrink-0 self-start sm:self-center"
            title="Đổi sang câu hỏi khác"
          >
            <span className="material-symbols-outlined text-sm font-bold">autorenew</span>
            Đổi câu hỏi
          </button>
        )}
      </div>
      
      <div className="bg-surface-container-low border border-outline p-5 rounded-xl text-center mb-8">
        <p className="text-xl font-bold text-primary select-all">
          {exercise.question}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {shuffledChoices.map((choice, idx) => {
          const isSelected = selectedIdx === idx;
          const isRevealed = selectedIdx !== null;
          
          let btnClass = "border border-outline hover:border-primary hover:bg-hover-bg text-primary";
          let icon = null;

          if (isRevealed) {
            if (choice.is_correct) {
              btnClass = "border-2 border-sage bg-emerald-50/50 text-[#1d2b3e] font-semibold";
              icon = <span className="material-symbols-outlined text-sage font-bold">check_circle</span>;
            } else if (isSelected) {
              btnClass = "border-2 border-red-500 bg-red-50/50 text-red-700 font-semibold";
              icon = <span className="material-symbols-outlined text-red-500 font-bold">cancel</span>;
            } else {
              btnClass = "border border-outline text-secondary/60 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              disabled={isRevealed}
              onClick={() => handleSelect(idx, choice.is_correct)}
              className={`w-full text-left p-4 rounded-xl transition-all text-base flex justify-between items-center ${btnClass}`}
            >
              <span className="select-none">{choice.text}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && exercise.explanation && (
        <div className="mt-6 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl animate-in fade-in slide-in-from-top-3">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Giải thích:</p>
          <p className="text-sm text-secondary leading-relaxed select-all">
            {exercise.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
