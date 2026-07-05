'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Question } from '@/types/exam';

interface MobileNavigatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allQuestions: Question[];
  answers: Record<string, string>;
  isSubmitted: boolean;
  score: number;
  totalScore: number;
  passingScore: number;
  onSubmit: () => void;
}

export default function MobileNavigatorDrawer({
  isOpen,
  onClose,
  allQuestions,
  answers,
  isSubmitted,
  score,
  totalScore,
  passingScore,
  onSubmit,
}: MobileNavigatorDrawerProps) {
  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 animate-in fade-in duration-200" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-80 max-w-[85vw] h-full bg-white border-l border-outline p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant/80 hover:text-primary p-1 rounded-full focus:outline-none"
          title="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-lg font-bold text-primary mb-6 pr-8 flex items-center justify-between font-lexend">
          <span>Bản Đồ Câu Hỏi</span>
          <span className="text-xs font-semibold text-secondary bg-slate-100 px-3 py-1 rounded-full font-inter">
            {answeredCount} / {allQuestions.length}
          </span>
        </h2>

        <div className="flex-1 overflow-y-auto pr-1 pb-4">
          <div className="flex flex-wrap gap-2.5 font-lexend justify-start">
            {allQuestions.map((q, idx) => {
              const isAnswered = !!answers[q.question_id];
              const isCorrect = answers[q.question_id] === q.correct_answer;

              let btnClass =
                'w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border-2 transition-all duration-200 focus:outline-none ';

              if (isSubmitted) {
                if (isCorrect) btnClass += 'bg-green-100 text-green-700 border-green-400';
                else btnClass += 'bg-red-100 text-red-700 border-red-400';
              } else {
                if (isAnswered) btnClass += 'bg-primary text-white border-primary shadow-sm';
                else btnClass += 'bg-white text-secondary border-outline hover:border-primary';
              }

              return (
                <button
                  key={`nav-drawer-q-${q.question_id}`}
                  onClick={() => {
                    const element = document.getElementById(`mobile-question-${q.question_id}`) || document.getElementById(`question-${q.question_id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    onClose();
                  }}
                  className={btnClass}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {!isSubmitted ? (
            <div className="mt-8 pt-6 border-t border-outline">
              <button
                onClick={() => {
                  onClose();
                  onSubmit();
                }}
                className="w-full bg-primary hover:bg-[#334155] text-white font-bold py-3.5 rounded-xl shadow-md font-lexend text-sm active:scale-95 transition-transform"
              >
                Nộp Bài Thi
              </button>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-outline font-inter">
              <div
                className={`p-4 rounded-xl border shadow-inner ${
                  score >= passingScore
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <h3 className="text-sm font-bold mb-2 font-lexend">Kết quả bài thi</h3>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-black font-lexend">{score}</span>
                  <span className="text-xs opacity-70">/ {totalScore} điểm</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {score >= passingScore
                    ? '🎉 Tuyệt vời! Bạn đã đạt yêu cầu.'
                    : 'Rất tiếc! Bạn chưa đạt điểm yêu cầu.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
