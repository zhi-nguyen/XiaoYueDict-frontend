'use client';

import React from 'react';
import { Exam } from '@/types/exam';
import { ExamState } from '@/lib/examState';
import ExamCard from './ExamCard';
import LevelTabs from './LevelTabs';
import ExamEmptyState from './ExamEmptyState';

interface ExamListZhProps {
  groupedData: Record<string, Record<string, Exam[]>>;
  activeSubLevels: Record<string, string>;
  setActiveSubLevels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  examStates: Record<string, ExamState>;
  language: string;
  handleStartOver: (examId: number) => void;
}

export default function ExamListZh({
  groupedData,
  activeSubLevels,
  setActiveSubLevels,
  examStates,
  language,
  handleStartOver,
}: ExamListZhProps) {
  const categories = Object.keys(groupedData).sort();

  if (categories.length === 0) {
    return <ExamEmptyState />;
  }

  return (
    <div className="w-full p-6 md:p-8 pb-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-outline/30 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary font-lexend tracking-tight">
              Luyện Thi HSK / TOCFL
            </h1>
            <p className="text-sm text-on-surface-variant font-medium mt-1 font-inter">
              Hệ thống đề thi thử tiếng Trung tiêu chuẩn quốc tế
            </p>
          </div>
        </div>

        {categories.map((category) => {
          const subLevelsMap = groupedData[category];
          const sortedSubLevels = Object.keys(subLevelsMap).sort();
          const activeSubLevel = activeSubLevels[category] || sortedSubLevels[0];
          const examsToRender = subLevelsMap[activeSubLevel] || [];

          return (
            <div
              key={category}
              className="mb-12 bg-white/70 backdrop-blur-md border border-outline/80 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
            >
              {/* Decorative Chinese Courtyard Style subtle line or accent */}
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

              {/* Category Header */}
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-outline/30">
                <h2 className="text-xl md:text-2xl font-extrabold text-primary flex items-center gap-2 font-lexend">
                  {category}
                </h2>
                <span className="text-xs font-semibold text-on-surface-variant bg-hover-bg px-3 py-1 rounded-full font-inter">
                  {sortedSubLevels.length} Cấp độ
                </span>
              </div>

              {/* Sub-Levels Selector */}
              <LevelTabs
                levels={sortedSubLevels}
                activeLevel={activeSubLevel}
                onSelect={(level) =>
                  setActiveSubLevels((prev) => ({ ...prev, [category]: level }))
                }
              />

              {/* Cards Container */}
              {examsToRender.length === 0 ? (
                <ExamEmptyState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center sm:justify-items-start">
                  {examsToRender.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      examState={examStates[exam.id.toString()] || null}
                      language={language}
                      variant="zh"
                      onStartOver={handleStartOver}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
