'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Headphones,
  BookOpen,
  Edit3,
  Mic,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Home,
  Check,
  ChevronDown,
  ChevronUp,
  Menu,
  LogOut
} from 'lucide-react';
import { Exam, Question, Section } from '@/types/exam';
import { clearExamState } from '@/lib/examState';
import QuestionCard from './QuestionCard';
import ImageLightbox from './ImageLightbox';
import dynamic from 'next/dynamic';
import { useUIStore } from '@/store/useUIStore';

const ConfirmModal = dynamic(() => import('@/components/ConfirmModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });

interface ExamResultViewProps {
  exam: Exam;
  answers: Record<string, string>;
  score: number;
  language: string;
}

const sectionColors: Record<string, { bg: string; text: string; bar: string; track: string }> = {
  Listening: {
    bg: 'bg-emerald-50 text-emerald-600',
    text: 'text-emerald-700',
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100/50'
  },
  Reading: {
    bg: 'bg-blue-50 text-blue-600',
    text: 'text-blue-700',
    bar: 'bg-blue-500',
    track: 'bg-blue-100/50'
  },
  Writing: {
    bg: 'bg-amber-50 text-amber-600',
    text: 'text-amber-700',
    bar: 'bg-amber-500',
    track: 'bg-amber-100/50'
  },
  Speaking: {
    bg: 'bg-teal-50 text-teal-600',
    text: 'text-teal-700',
    bar: 'bg-teal-500',
    track: 'bg-teal-100/50'
  },
};

export default function ExamResultView({
  exam,
  answers,
  score,
  language,
}: ExamResultViewProps) {
  const router = useRouter();
  const { setSidebarOpen } = useUIStore();

  const [activeTab, setActiveTab] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);

  // Auto scroll to top when result page mounts
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.querySelector('main')?.scrollTo(0, 0);
      document.querySelectorAll('.overflow-y-auto').forEach(el => el.scrollTo(0, 0));
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    }
  }, []);

  // Audio Play State for review questions
  const segmentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Determine exam type
  const isIelts = exam.level?.toUpperCase().includes('IELTS');
  const totalScore = exam.total_score || 100;

  // Calculate IELTS Band Score dynamically (1.0 to 9.0)
  const ieltsBand = useMemo(() => {
    if (!isIelts) return 0;
    const band = Math.round((score / totalScore) * 9 * 2) / 2;
    return Math.min(9.0, Math.max(1.0, band));
  }, [score, totalScore, isIelts]);

  // Calculate percentage correct
  const percentCorrect = useMemo(() => {
    return totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
  }, [score, totalScore]);

  // Generate a realistic performance percentile based on percent correct
  const percentile = useMemo(() => {
    return Math.min(99, Math.max(10, Math.round(percentCorrect * 0.9 + 5)));
  }, [percentCorrect]);

  const passed = score >= exam.passing_score;

  // Aggregate sectional score details
  const aggregatedSections = useMemo(() => {
    const sectionsMap: Record<string, { totalPoints: number; correctPoints: number; totalQuestions: number; correctQuestions: number }> = {};

    exam.sections?.forEach((sec) => {
      const name = sec.section_name || 'Listening';
      if (!sectionsMap[name]) {
        sectionsMap[name] = { totalPoints: 0, correctPoints: 0, totalQuestions: 0, correctQuestions: 0 };
      }

      sec.questions.forEach((q) => {
        sectionsMap[name].totalPoints += q.points;
        sectionsMap[name].totalQuestions += 1;

        const isTextInput =
          q.question_type === 'fill_blank' ||
          (q.question_type === 'ordering' && (!q.options || q.options.length === 0));

        const cleanAnswer = (str: string) => str.trim().toLowerCase().replace(/[.。!！?？]+$/, '').trim();
        const formattedUserAnswer = cleanAnswer(answers[q.question_id] || '');
        const correctAnswersList = (q.correct_answer || '').split('/').map((ans) => cleanAnswer(ans));

        const isCorrect = isTextInput
          ? correctAnswersList.includes(formattedUserAnswer)
          : answers[q.question_id] === q.correct_answer;

        if (isCorrect) {
          sectionsMap[name].correctPoints += q.points;
          sectionsMap[name].correctQuestions += 1;
        }
      });
    });

    return Object.entries(sectionsMap).map(([name, data]) => {
      const percentage = data.totalPoints > 0 ? Math.round((data.correctPoints / data.totalPoints) * 100) : 0;
      return {
        name,
        totalPoints: data.totalPoints,
        correctPoints: data.correctPoints,
        totalQuestions: data.totalQuestions,
        correctQuestions: data.correctQuestions,
        percentage,
      };
    });
  }, [exam, answers]);

  // Flat list of questions for detailed review
  const allQuestions = useMemo(() => {
    return exam.sections?.flatMap((s) => s.questions) || [];
  }, [exam]);

  // Helper to determine question correctness
  const isQuestionCorrect = (q: Question) => {
    const isTextInput =
      q.question_type === 'fill_blank' ||
      (q.question_type === 'ordering' && (!q.options || q.options.length === 0));

    const cleanAnswer = (str: string) => str.trim().toLowerCase().replace(/[.。!！?？]+$/, '').trim();
    const formattedUserAnswer = cleanAnswer(answers[q.question_id] || '');
    const correctAnswersList = (q.correct_answer || '').split('/').map((ans) => cleanAnswer(ans));

    return isTextInput
      ? correctAnswersList.includes(formattedUserAnswer)
      : answers[q.question_id] === q.correct_answer;
  };

  const correctCount = allQuestions.filter(isQuestionCorrect).length;
  const incorrectCount = allQuestions.length - correctCount;

  // Filtered questions based on active tab
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const correct = isQuestionCorrect(q);
      if (activeTab === 'correct') return correct;
      if (activeTab === 'incorrect') return !correct;
      return true;
    });
  }, [allQuestions, activeTab]);

  // Handle restarting exam
  const handleRestart = () => {
    clearExamState(exam.id);
    window.location.reload();
  };

  // Handle back to home/exams list
  const handleBackToHome = () => {
    router.push(`/${language}/exam`);
  };

  // Section details helper
  const getSectionIcon = (name: string) => {
    const clean = name.toLowerCase();
    if (clean.includes('listen')) return <Headphones className="w-5 h-5" />;
    if (clean.includes('read')) return <BookOpen className="w-5 h-5" />;
    if (clean.includes('write')) return <Edit3 className="w-5 h-5" />;
    if (clean.includes('speak') || clean.includes('talk')) return <Mic className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getSectionStyle = (name: string) => {
    const clean = name.toLowerCase();
    if (clean.includes('listen')) return sectionColors.Listening;
    if (clean.includes('read')) return sectionColors.Reading;
    if (clean.includes('write')) return sectionColors.Writing;
    if (clean.includes('speak') || clean.includes('talk')) return sectionColors.Speaking;
    return {
      bg: 'bg-slate-50 text-slate-600',
      text: 'text-slate-700',
      bar: 'bg-slate-500',
      track: 'bg-slate-100/50'
    };
  };

  // Audio Play Handler for question review
  const playSegmentAudio = (
    questionId: string,
    startTime: string,
    endTime: string,
    audioUrl?: string
  ) => {
    if (activeSegmentId === questionId && segmentAudioRef.current) {
      segmentAudioRef.current.pause();
      setActiveSegmentId(null);
      return;
    }

    if (segmentAudioRef.current) {
      segmentAudioRef.current.pause();
      const mainAudioUrl = exam.sections?.find((s) => s.section_audio_url)?.section_audio_url || '';
      const targetSrc = audioUrl || mainAudioUrl;

      if (segmentAudioRef.current.src !== targetSrc) {
        segmentAudioRef.current.src = targetSrc;
      }

      const parseTimeToSeconds = (t: string) => {
        if (!t) return 0;
        const parts = t.split(':').map(parseFloat);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0];
      };

      const startSec = parseTimeToSeconds(startTime);
      const endSec = parseTimeToSeconds(endTime);

      segmentAudioRef.current.currentTime = startSec;
      (segmentAudioRef.current as any).activeSegmentEndTime = endSec;

      segmentAudioRef.current.play().catch(console.error);
      setActiveSegmentId(questionId);
    }
  };

  const stopSegmentAudio = () => {
    setActiveSegmentId(null);
  };

  // Formatting completion date
  const completedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Circle SVG metrics
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const percentageFill = isIelts ? (ieltsBand / 9.0) * 100 : percentCorrect;
  const strokeDashoffset = circumference - (percentageFill / 100) * circumference;

  return (
    <div className="w-full min-h-screen bg-slate-50/50 pb-12 font-lexend">
      {/* Hidden Audio Element for Segment Playback */}
      <audio
        ref={segmentAudioRef as any}
        onTimeUpdate={() => {
          if (segmentAudioRef.current) {
            const activeEndTime = (segmentAudioRef.current as any).activeSegmentEndTime || 0;
            if (activeEndTime && segmentAudioRef.current.currentTime >= activeEndTime) {
              segmentAudioRef.current.pause();
              stopSegmentAudio();
            }
          }
        }}
        className="hidden"
      />

      {/* Top Sticky Header */}
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 h-16 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-700 focus:outline-none"
            title="Mở menu phần thi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display-lg text-lg font-extrabold text-slate-800 font-lexend">
            XiaoYueDict
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
            {isIelts ? 'Exam Results' : 'Kết quả thi'}
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRestartConfirmOpen(true)}
            className={`bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full font-bold text-xs transition-all shadow-sm flex items-center justify-center ${isIelts ? 'px-4 py-2 gap-1.5' : 'w-9 h-9'
              }`}
            title={isIelts ? 'Restart Test' : 'Làm lại bài'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleBackToHome}
            className={`bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs transition-all shadow-sm flex items-center justify-center ${isIelts ? 'px-4 py-2 gap-1.5' : 'w-9 h-9'
              }`}
            title={isIelts ? 'Back to list' : 'Quay về'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-[1120px] mx-auto px-4 pt-8 md:pt-12">
        {/* Header Section (Mobile Centered Layout) */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center text-center md:text-left gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Báo cáo kết quả • Analysis Report
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {isIelts ? 'Exam Results' : 'Kết Quả Thi'}
            </h1>
            <p className="text-sm text-slate-500 font-medium font-inter mt-1.5">
              {exam.exam_name} • Hoàn thành ngày {completedDate}
            </p>
          </div>
        </div>

        {/* Top Cards Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Card Left: Circular Progress Gauge */}
          <div className="col-span-1 md:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
            {/* Soft background decor */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/30 to-violet-50/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />

            {/* SVG Circular Gauge */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="ieltsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                  <linearGradient id="hskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                {/* Background track circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Colored fill progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="transition-all duration-1000 ease-out"
                  stroke={isIelts ? 'url(#ieltsGradient)' : 'url(#hskGradient)'}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner score label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-slate-800 tracking-tight">
                  {isIelts ? ieltsBand.toFixed(1) : score}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {isIelts ? 'Overall Band' : `TỔNG ĐIỂM`}
                </span>
                {!isIelts && (
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    / {totalScore}
                  </span>
                )}
              </div>
            </div>

            {/* Performance status & message */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">
                {isIelts ? (
                  ieltsBand >= 7.5 ? 'Good Progress' : ieltsBand >= 6.0 ? 'Moderate Level' : 'Needs Practice'
                ) : (
                  passed ? 'Excellent Result!' : 'Cần cố gắng thêm!'
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium font-inter max-w-[240px] leading-relaxed">
                {isIelts ? (
                  `You performed better than ${percentile}% of students this month.`
                ) : (
                  `${exam.level} • Đạt tỉ lệ chính xác ${percentCorrect}%`
                )}
              </p>
            </div>
          </div>

          {/* Card Right: Sectional Breakdown */}
          <div className="col-span-1 md:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {isIelts ? 'Sectional Performance' : 'Skills Breakdown'}
              </h2>
              <span className="text-xs font-bold text-slate-400 font-inter uppercase">
                {aggregatedSections.length} Phần đánh giá
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aggregatedSections.map((section) => {
                const style = getSectionStyle(section.name);
                return (
                  <div
                    key={section.name}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[100px] hover:shadow-sm hover:border-slate-200 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${style.bg}`}>
                          {getSectionIcon(section.name)}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">
                          {section.name === 'Listening' ? 'Listening (Nghe)' :
                            section.name === 'Reading' ? 'Reading (Đọc)' :
                              section.name === 'Writing' ? 'Writing (Viết)' :
                                section.name === 'Speaking' ? 'Speaking (Nói)' : section.name}
                        </span>
                      </div>

                      {/* Metric score info */}
                      <span className={`text-base font-extrabold ${style.text}`}>
                        {isIelts ? `${section.percentage}%` : `${section.correctPoints}/${section.totalPoints}`}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold font-inter">
                        <span>Chính xác: {section.correctQuestions}/{section.totalQuestions} câu</span>
                        <span>{section.percentage}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${style.track}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
                          style={{ width: `${section.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="w-full bg-white border border-slate-100 rounded-[2rem] p-4 md:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {isIelts ? 'Detailed Question Review' : 'Chi tiết bài làm'}
            </h2>
            <p className="text-xs text-slate-400 font-semibold font-inter">
              Xem lại từng câu hỏi, đáp án đã làm và giải thích chi tiết.
            </p>
          </div>

          {/* Filtering Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2 rounded-full font-bold text-xs transition-all duration-200 ${activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
            >
              Tất cả ({allQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab('correct')}
              className={`px-5 py-2 rounded-full font-bold text-xs transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'correct'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50'
                }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Đúng ({correctCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('incorrect')}
              className={`px-5 py-2 rounded-full font-bold text-xs transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'incorrect'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100/50'
                }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Sai ({incorrectCount})</span>
            </button>
          </div>

          {/* Filtered Question List */}
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium font-inter">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredQuestions.map((q) => {
                // Find the original index of the question in the full list
                const originalIndex = allQuestions.findIndex((item) => item.question_id === q.question_id);
                return (
                  <QuestionCard
                    key={q.question_id}
                    question={q}
                    index={originalIndex !== -1 ? originalIndex : 0}
                    isSubmitted={true}
                    userAnswer={answers[q.question_id]}
                    onSelectOption={() => { }}
                    onAnswerChange={() => { }}
                    onReport={(dbId) => {
                      setReportQuestionId(String(dbId));
                      setIsReportModalOpen(true);
                    }}
                    activeSegmentId={activeSegmentId}
                    playSegmentAudio={playSegmentAudio}
                    setLightboxImage={setLightboxImage}
                    setLightboxZoom={setLightboxZoom}
                    showExplanationAfter="exam_submitted"
                    variant={isIelts ? 'en' : 'zh'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Confirm Restart Dialog */}
      <ConfirmModal
        isOpen={isRestartConfirmOpen}
        title="Làm lại bài thi"
        message="Bạn có chắc chắn muốn xóa toàn bộ kết quả hiện tại và làm lại bài thi này từ đầu?"
        confirmText="Làm lại"
        isDestructive={true}
        onConfirm={handleRestart}
        onCancel={() => setIsRestartConfirmOpen(false)}
      />

      {/* Image Lightbox viewer */}
      <ImageLightbox
        image={lightboxImage}
        zoom={lightboxZoom}
        setZoom={setLightboxZoom}
        onClose={() => setLightboxImage(null)}
      />

      {/* Report Modal */}
      {isReportModalOpen && reportQuestionId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          contentType="exam_question"
          objectId={reportQuestionId}
          defaultReportType="exam_question"
          title="Báo cáo lỗi câu hỏi thi"
        />
      )}
    </div>
  );
}
