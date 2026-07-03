'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchExams } from '@/lib/api/exams';
import { Exam } from '@/types/exam';
import { getAllSavedExamIds, clearExamState, loadExamState, ExamState } from '@/lib/examState';
import { Clock } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface ExamClientProps {
  initialExams: Exam[];
}

function parseExamLevel(levelStr: string) {
  const clean = (levelStr || '').trim();
  if (clean.toUpperCase().startsWith('HSK')) {
    return { category: 'HSK', subLevel: clean };
  }
  if (clean.toUpperCase().startsWith('TOCFL')) {
    const sub = clean.slice(5).trim();
    return { category: 'TOCFL', subLevel: sub || clean };
  }
  if (clean.toUpperCase().startsWith('IELTS')) {
    const sub = clean.slice(5).trim();
    return { category: 'IELTS', subLevel: sub || clean };
  }
  
  const spaceIdx = clean.indexOf(' ');
  if (spaceIdx !== -1) {
    return {
      category: clean.slice(0, spaceIdx),
      subLevel: clean.slice(spaceIdx + 1)
    };
  }
  return { category: 'Khác', subLevel: clean || 'Khác' };
}

function getExamSections(levelStr: string) {
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
}

export default function ExamClient({ initialExams }: ExamClientProps) {
  const router = useRouter();
  const params = useParams();
  const language = (params?.lang as string) || 'zh';
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [examStates, setExamStates] = useState<Record<string, ExamState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch when language changes (if different from initial load)
  useEffect(() => {
    async function loadExams() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchExams(undefined, language);
        setExams(data);
      } catch (err) {
        setError('Không thể tải danh sách đề thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    }
    
    loadExams();
    
    // Load saved states
    const ids = getAllSavedExamIds();
    const statesMap: Record<string, ExamState> = {};
    ids.forEach(id => {
      const state = loadExamState(id);
      if (state) {
        statesMap[id] = state;
      }
    });
    setExamStates(statesMap);
  }, [language]);

  const handleStartOver = (examId: number) => {
    clearExamState(examId);
    
    // Reset status locally immediately
    setExamStates(prev => {
      const next = { ...prev };
      delete next[examId];
      return next;
    });

    router.push(`/${language}/exam/take/${examId}`);
  };

  // Group exams by category and subLevel
  const groupedData = useMemo(() => {
    const categoriesMap: Record<string, Record<string, Exam[]>> = {};

    exams.forEach(exam => {
      const { category, subLevel } = parseExamLevel(exam.level);
      if (!categoriesMap[category]) {
        categoriesMap[category] = {};
      }
      if (!categoriesMap[category][subLevel]) {
        categoriesMap[category][subLevel] = [];
      }
      categoriesMap[category][subLevel].push(exam);
    });

    return categoriesMap;
  }, [exams]);

  const [activeSubLevels, setActiveSubLevels] = useState<Record<string, string>>({});

  // Initialize active subLevels once groupedData is built
  useEffect(() => {
    const initialActive: Record<string, string> = {};
    Object.entries(groupedData).forEach(([category, subLevelsMap]) => {
      const sortedSubLevels = Object.keys(subLevelsMap).sort();
      if (sortedSubLevels.length > 0) {
        initialActive[category] = sortedSubLevels[0];
      }
    });
    
    setActiveSubLevels(prev => {
      const next = { ...initialActive, ...prev };
      Object.keys(next).forEach(cat => {
        if (!groupedData[cat]) {
          delete next[cat];
        } else if (!groupedData[cat][next[cat]]) {
          const sorted = Object.keys(groupedData[cat]).sort();
          next[cat] = sorted[0];
        }
      });
      return next;
    });
  }, [groupedData]);

  const categories = Object.keys(groupedData).sort();

  return (
    <div className="w-full p-8 pb-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-primary exam-font-override">
            {language === 'zh' ? 'Luyện Thi HSK / TOCFL' : 'Luyện Thi IELTS'}
          </h1>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-20 text-secondary">
            Chưa có đề thi nào trong hệ thống.
          </div>
        )}

        {!loading && !error && categories.map(category => {
          const subLevelsMap = groupedData[category];
          const sortedSubLevels = Object.keys(subLevelsMap).sort();
          const activeSubLevel = activeSubLevels[category] || sortedSubLevels[0];
          const examsToRender = subLevelsMap[activeSubLevel] || [];

          return (
            <div key={category} className="mb-12 bg-surface border border-outline rounded-[2rem] p-6 shadow-sm">
              {/* Category Header */}
              <div className="flex justify-between items-center mb-6 border-b border-outline/30 pb-3">
                <h2 className="text-2xl font-extrabold text-primary flex items-center gap-2 exam-font-override">
                  {category}
                </h2>
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Sub-Levels Selector */}
              {sortedSubLevels.length > 1 && (
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
                  {sortedSubLevels.map(subLevel => {
                    const isActive = activeSubLevel === subLevel;
                    return (
                      <button
                        key={subLevel}
                        onClick={() => setActiveSubLevels(prev => ({ ...prev, [category]: subLevel }))}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap focus:outline-none ${
                          isActive
                            ? 'bg-[#1E293B] text-white shadow-sm'
                            : 'text-secondary hover:text-primary hover:bg-hover-bg'
                        }`}
                      >
                        {subLevel}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Cards Container (Horizontal scrolling) */}
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {examsToRender.map(exam => {
                  const state = examStates[exam.id.toString()];
                  const isCompleted = state?.isSubmitted;
                  const isInProgress = state && !state.isSubmitted;
                  const sections = getExamSections(exam.level);

                  return (
                    <div
                      key={exam.id}
                      className="relative bg-hover-bg/40 rounded-[1.5rem] p-5 flex flex-col justify-between w-[290px] h-[200px] shrink-0 border border-outline/40 shadow-sm overflow-hidden"
                    >

                      {/* Content */}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                          <h4 className="font-bold text-base text-primary truncate max-w-[240px]" title={exam.exam_name}>
                            {exam.exam_name}
                          </h4>
                          <div className="text-secondary text-xs mt-2 space-y-0.5 font-medium">
                            <p>{exam.total_questions} câu</p>
                            <p>{exam.total_time_minutes} phút</p>
                            <p className="opacity-80 italic">{sections}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          {/* Lịch sử nộp bài / Đang làm dở */}
                          {isCompleted ? (
                            <div className="text-[11px] text-secondary font-medium whitespace-nowrap shrink-0">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-orange" />
                                <span className="font-bold text-primary">
                                  {state.score !== undefined ? `${state.score}/${exam.total_score}` : 'Đã nộp'}
                                </span>
                              </div>
                            </div>
                          ) : isInProgress ? (
                            <div className="text-[11px] text-green-600 font-bold animate-pulse whitespace-nowrap shrink-0">
                              Đang làm...
                            </div>
                          ) : (
                            <div />
                          )}

                          {/* Nút hành động */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isCompleted ? (
                              <>
                                <button
                                  onClick={() => handleStartOver(exam.id)}
                                  className="text-xs text-secondary hover:text-red-500 hover:underline whitespace-nowrap shrink-0"
                                  title="Xóa lịch sử và làm lại mới"
                                >
                                  Làm mới
                                </button>
                                <Link
                                  href={`/${language}/exam/take/${exam.id}`}
                                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm whitespace-nowrap shrink-0"
                                >
                                  Kết quả
                                </Link>
                              </>
                            ) : isInProgress ? (
                              <>
                                <button
                                  onClick={() => handleStartOver(exam.id)}
                                  className="text-xs text-secondary hover:text-primary hover:underline whitespace-nowrap shrink-0"
                                  title="Xóa tiến trình và làm lại từ đầu"
                                >
                                  Làm lại
                                </button>
                                <Link
                                  href={`/${language}/exam/take/${exam.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm whitespace-nowrap shrink-0"
                                >
                                  Tiếp tục
                                </Link>
                              </>
                            ) : (
                              <Link
                                href={`/${language}/exam/take/${exam.id}`}
                                className="bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm whitespace-nowrap shrink-0"
                              >
                                Bắt đầu
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
