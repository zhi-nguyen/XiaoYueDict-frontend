'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Play, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { Exam } from '@/types/exam';
import { ExamState } from '@/lib/examState';

interface ExamCardProps {
  exam: Exam;
  examState: ExamState | null;
  language: string;
  variant: 'zh' | 'en';
  onStartOver: (examId: number) => void;
}

export default function ExamCard({
  exam,
  examState,
  language,
  variant,
  onStartOver,
}: ExamCardProps) {
  const isCompleted = examState?.isSubmitted;
  const isInProgress = examState && !examState.isSubmitted;

  // Determine sections description
  const getExamSectionsDesc = (levelStr: string) => {
    const clean = (levelStr || '').toUpperCase();
    if (clean.includes('HSK 1') || clean.includes('HSK 2')) {
      return 'Nghe, Đọc';
    }
    if (clean.includes('HSK')) {
      return 'Nghe, Đọc, Viết';
    }
    if (clean.includes('TOCFL')) {
      return 'Nghe, Đọc';
    }
    if (clean.includes('IELTS')) {
      return 'Nghe, Nói, Đọc, Viết';
    }
    return 'Nghe, Đọc';
  };

  const sections = getExamSectionsDesc(exam.level);

  // Variant-specific styles based on examples (MD3 styles)
  const cardBgStyle =
    variant === 'zh'
      ? 'bg-surface-container-low/60 hover:bg-surface-container-low border-outline/50 hover:border-primary/30'
      : 'bg-white hover:bg-surface-container-low border-outline/60 hover:border-premium-violet/30';

  const badgeStyle =
    variant === 'zh'
      ? 'bg-secondary-container text-on-secondary-container'
      : 'bg-[#6366F1]/10 text-[#6366F1]';

  const btnPrimaryStyle =
    variant === 'zh'
      ? 'bg-primary hover:bg-[#334155] text-white'
      : 'bg-[#6366F1] hover:bg-[#4f46e5] text-white';

  return (
    <div
      className={`relative rounded-[1.5rem] p-5 flex flex-col justify-between w-full max-w-[360px] min-h-[240px] border shadow-sm transition-all duration-300 group hover:shadow-md hover:scale-[1.01] ${cardBgStyle}`}
    >
      {/* Decorative gradient overlay for IELTS variant */}
      {variant === 'en' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
      )}

      <div className="flex flex-col h-full justify-between z-10">
        <div>
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-lexend ${badgeStyle}`}>
              {exam.level}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs text-score-excellent font-bold bg-score-excellent-bg px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã nộp</span>
              </span>
            )}
            {isInProgress && (
              <span className="flex items-center gap-1 text-xs text-[#F59E0B] font-bold bg-score-moderate-bg px-2 py-0.5 rounded-full animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Đang làm...</span>
              </span>
            )}
          </div>

          <h4
            className="font-bold text-base text-primary font-lexend line-clamp-2 leading-tight group-hover:text-primary-container transition-colors"
            title={exam.exam_name}
          >
            {exam.exam_name}
          </h4>

          <div className="text-on-surface-variant/80 text-xs mt-3 space-y-1 font-medium font-inter">
            <p className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-secondary" />
              <span>{exam.total_questions} câu hỏi</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              <span>{exam.total_time_minutes} phút làm bài</span>
            </p>
            <p className="italic opacity-80 pl-5">{sections}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 border-t border-outline/30">
          {/* History Score / State */}
          <div className="flex items-center">
            {isCompleted && examState.score !== undefined ? (
              <div className="text-xs text-secondary font-medium">
                <span className="font-bold text-primary font-lexend text-sm">
                  {examState.score}/{exam.total_score}
                </span>{' '}
                điểm
              </div>
            ) : (
              <div className="text-[11px] text-on-surface-variant/60 font-semibold uppercase tracking-wider">
                {!examState ? 'Chưa làm' : ''}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <>
                <button
                  onClick={() => onStartOver(exam.id)}
                  className="p-2 rounded-full text-on-surface-variant/70 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Xóa kết quả và làm lại mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <Link
                  href={`/${language}/exam/take/${exam.id}`}
                  className="bg-primary-container hover:bg-[#475569] text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1 font-lexend"
                >
                  Kết quả
                </Link>
              </>
            ) : isInProgress ? (
              <>
                <button
                  onClick={() => onStartOver(exam.id)}
                  className="p-2 rounded-full text-on-surface-variant/70 hover:text-primary hover:bg-hover-bg transition-all"
                  title="Hủy tiến trình cũ và làm lại từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <Link
                  href={`/${language}/exam/take/${exam.id}`}
                  className="bg-score-excellent hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1 font-lexend"
                >
                  Tiếp tục
                </Link>
              </>
            ) : (
              <Link
                href={`/${language}/exam/take/${exam.id}`}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1 font-lexend active:scale-95 ${btnPrimaryStyle}`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Bắt đầu</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
