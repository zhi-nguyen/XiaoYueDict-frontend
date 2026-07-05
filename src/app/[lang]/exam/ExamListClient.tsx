'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchExams } from '@/lib/api/exams';
import { Exam } from '@/types/exam';
import { getAllSavedExamIds, clearExamState, loadExamState, ExamState } from '@/lib/examState';
import { useRouter, useParams } from 'next/navigation';
import ExamListZh from './components/ExamListZh';
import ExamListEn from './components/ExamListEn';
import ExamListSkeleton from './components/ExamListSkeleton';

interface ExamListClientProps {
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
      subLevel: clean.slice(spaceIdx + 1),
    };
  }
  return { category: 'Khác', subLevel: clean || 'Khác' };
}

export default function ExamListClient({ initialExams }: ExamListClientProps) {
  const router = useRouter();
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [examStates, setExamStates] = useState<Record<string, ExamState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubLevels, setActiveSubLevels] = useState<Record<string, string>>({});

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

    if (initialExams.length === 0) {
      loadExams();
    }

    // Load saved states
    const ids = getAllSavedExamIds();
    const statesMap: Record<string, ExamState> = {};
    ids.forEach((id) => {
      const state = loadExamState(id);
      if (state) {
        statesMap[id] = state;
      }
    });
    setExamStates(statesMap);
  }, [language, initialExams]);

  const handleStartOver = (examId: number) => {
    clearExamState(examId);

    // Reset status locally immediately
    setExamStates((prev) => {
      const next = { ...prev };
      delete next[examId];
      return next;
    });

    router.push(`/${language}/exam/take/${examId}`);
  };

  // Group exams by category and subLevel
  const groupedData = useMemo(() => {
    const categoriesMap: Record<string, Record<string, Exam[]>> = {};

    exams.forEach((exam) => {
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

  // Initialize active subLevels once groupedData is built
  useEffect(() => {
    const initialActive: Record<string, string> = {};
    Object.entries(groupedData).forEach(([category, subLevelsMap]) => {
      const sortedSubLevels = Object.keys(subLevelsMap).sort();
      if (sortedSubLevels.length > 0) {
        initialActive[category] = sortedSubLevels[0];
      }
    });

    setActiveSubLevels((prev) => {
      const next = { ...initialActive, ...prev };
      Object.keys(next).forEach((cat) => {
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

  if (loading) {
    return <ExamListSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full p-8 pb-16">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center font-medium font-inter">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Branch UI based on language
  if (language === 'zh') {
    return (
      <ExamListZh
        groupedData={groupedData}
        activeSubLevels={activeSubLevels}
        setActiveSubLevels={setActiveSubLevels}
        examStates={examStates}
        language={language}
        handleStartOver={handleStartOver}
      />
    );
  }

  return (
    <ExamListEn
      groupedData={groupedData}
      activeSubLevels={activeSubLevels}
      setActiveSubLevels={setActiveSubLevels}
      examStates={examStates}
      language={language}
      handleStartOver={handleStartOver}
    />
  );
}
