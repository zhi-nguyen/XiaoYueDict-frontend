'use client';

import React from 'react';
import { Question } from '@/types/exam';

interface QuestionNavigatorProps {
  allQuestions: Question[];
  answers: Record<string, string>;
  isSubmitted: boolean;
  score: number;
  totalScore: number;
  passingScore: number;
  onSubmit: () => void;
}

export default function QuestionNavigator({
  allQuestions,
  answers,
  isSubmitted,
  score,
  totalScore,
  passingScore,
  onSubmit,
}: QuestionNavigatorProps) {
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-outline/80 flex flex-col min-h-0">
      <h2 className="text-lg font-bold text-primary mb-4 flex-shrink-0 flex items-center justify-between font-lexend">
        <span>Bản Đồ Câu Hỏi</span>
        <span className="text-xs font-semibold text-secondary bg-slate-100 px-3 py-1 rounded-full font-inter">
          {answeredCount} / {allQuestions.length} đã làm
        </span>
      </h2>

      {/* Grid container with custom scrollbar */}
      <div className="flex-1 overflow-y-auto pr-1 pb-1 max-h-[280px] md:max-h-[360px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="grid grid-cols-5 gap-2.5 font-lexend">
          {allQuestions.map((q, idx) => {
            const isAnswered = !!answers[q.question_id];
            const isCorrect = answers[q.question_id] === q.correct_answer;

            let btnClass =
              'w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border-2 transition-all duration-200 focus:outline-none ';

            if (isSubmitted) {
              if (isCorrect) {
                btnClass += 'bg-green-50 text-green-700 border-green-400';
              } else {
                btnClass += 'bg-red-50 text-red-700 border-red-400';
              }
            } else {
              if (isAnswered) {
                btnClass += 'bg-primary text-white border-primary shadow-sm hover:opacity-90';
              } else {
                btnClass += 'bg-white text-secondary border-outline hover:border-primary/50';
              }
            }

            return (
              <button
                key={`nav-q-${q.question_id}`}
                onClick={() => {
                  document
                    .getElementById(`question-${q.question_id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={btnClass}
                title={
                  isSubmitted
                    ? isCorrect
                      ? 'Đúng'
                      : 'Sai'
                    : isAnswered
                    ? 'Đã trả lời'
                    : 'Chưa trả lời'
                }
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Nộp Bài / Kết quả */}
        {!isSubmitted ? (
          <div className="mt-6 pt-5 border-t border-outline/50">
            <button
              onClick={onSubmit}
              className="w-full bg-primary hover:bg-[#334155] text-white font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-[0.98] font-lexend text-sm"
            >
              Nộp Bài Thi
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-5 border-t border-outline/50 font-inter">
            <div
              className={`p-4 rounded-2xl border shadow-inner ${
                score >= passingScore
                  ? 'bg-green-50/50 border-green-200 text-green-800'
                  : 'bg-red-50/50 border-red-200 text-red-800'
              }`}
            >
              <h3 className="text-sm font-bold mb-2 font-lexend">Kết quả bài thi</h3>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-3xl font-black font-lexend">{score}</span>
                <span className="text-xs opacity-75 font-semibold">/ {totalScore} điểm</span>
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
  );
}
