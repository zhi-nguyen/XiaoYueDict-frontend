import React, { useState, useMemo } from 'react';
import { ListeningExercise } from '@/types/note';
import { playTTSWithClientCache } from '@/lib/zhUtils';

interface FlashCardListenTabProps {
  exercise: ListeningExercise;
  audioUrl?: string;
  lang: string;
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

export default function FlashCardListenTab({
  exercise,
  lang,
  onAnswered,
  onSkip,
}: FlashCardListenTabProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const shuffledChoices = useMemo(() => {
    if (!exercise?.choices) return [];
    return shuffleArray([...exercise.choices]);
  }, [exercise]);

  const handlePlayAudio = () => {
    setIsPlaying(true);
    playTTSWithClientCache(
      exercise.sentence,
      lang === 'en' ? 'en' : 'zh',
      undefined,
      () => setIsPlaying(false)
    ).catch((err) => {
      console.warn("Failed to play TTS audio:", err);
      setIsPlaying(false);
    });
  };

  const handleSelect = (idx: number, isCorrect: boolean) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    onAnswered(isCorrect);
  };

  return (
    <div className="py-4 text-center">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 text-left">
        <h3 className="text-lg sm:text-xl font-bold text-primary">
          Nghe và chọn nghĩa đúng:
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

      <div className="flex flex-col items-center justify-center mb-12 mt-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Ripple rings behind button */}
          {isPlaying && (
            <>
              <div className="absolute inset-0 rounded-full bg-sage/30 pointer-events-none pulse-ring-1" />
              <div className="absolute inset-0 rounded-full bg-sage/25 pointer-events-none pulse-ring-2" />
              <div className="absolute inset-0 rounded-full bg-sage/15 pointer-events-none pulse-ring-3" />
            </>
          )}

          <button
            onClick={handlePlayAudio}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${
              isPlaying ? 'bg-sage text-white scale-105 shadow-emerald-200/50' : 'bg-primary text-white'
            }`}
            title="Phát âm thanh"
          >
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shuffledChoices.map((choice, idx) => {
          const isSelected = selectedIdx === idx;
          const isRevealed = selectedIdx !== null;
          
          let btnClass = "border border-outline hover:border-primary hover:bg-hover-bg text-primary";
          let icon = null;

          if (isRevealed) {
            if (choice.is_correct) {
              btnClass = "border-2 border-sage bg-emerald-50/50 text-[#1d2b3e] font-semibold";
              icon = <span className="material-symbols-outlined text-sage font-bold text-sm">check_circle</span>;
            } else if (isSelected) {
              btnClass = "border-2 border-red-500 bg-red-50/50 text-red-700 font-semibold";
              icon = <span className="material-symbols-outlined text-red-500 font-bold text-sm">cancel</span>;
            } else {
              btnClass = "border border-outline text-secondary/60 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              disabled={isRevealed}
              onClick={() => handleSelect(idx, choice.is_correct)}
              className={`p-4 rounded-xl transition-all text-sm flex justify-between items-center text-left ${btnClass}`}
            >
              <span className="select-none">{choice.text}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="mt-8 text-left bg-surface-container-low p-4 rounded-xl border border-outline/50 animate-in fade-in">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Đáp án đúng là câu:</p>
          <p className="text-base font-semibold text-primary select-all">
            {exercise.sentence}
          </p>
          {exercise.pinyin && (
            <p className="text-xs font-mono text-emerald-600 mt-0.5 select-all">
              [{exercise.pinyin}]
            </p>
          )}
        </div>
      )}
    </div>
  );
}
