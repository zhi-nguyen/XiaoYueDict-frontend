'use client';

import React from 'react';
import { ArrowLeft, Menu, BookOpen, Clock, User, LogOut } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { Exam, Question, Section } from '@/types/exam';
import QuestionSection from './QuestionSection';
import AudioPlayerCard from './AudioPlayerCard';
import QuestionNavigator from './QuestionNavigator';
import MobileNavigatorDrawer from './MobileNavigatorDrawer';
import ReadingSidebarDrawer from './ReadingSidebarDrawer';
import ImageLightbox from './ImageLightbox';
import dynamic from 'next/dynamic';

const ConfirmModal = dynamic(() => import('@/components/ConfirmModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });

interface ExamTakeEnProps {
  exam: Exam;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitted: boolean;
  score: number;
  timeRemaining: number | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  segmentAudioRef: React.RefObject<HTMLAudioElement | null>;
  isMainAudioPlaying: boolean;
  activeSegmentId: string | null;
  mainAudioCurrentTime: number;
  setMainAudioCurrentTime: (time: number) => void;
  isQuestionListOpen: boolean;
  setIsQuestionListOpen: (open: boolean) => void;
  isGlobalReportModalOpen: boolean;
  setIsGlobalReportModalOpen: (open: boolean) => void;
  reportQuestionDbId: string | null;
  modalConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  };
  setModalConfig: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      title: string;
      message: string;
      confirmText?: string;
      isDestructive?: boolean;
      onConfirm: () => void;
    }>
  >;
  activeSection: Section | null;
  showReadingSidebarButton: boolean;
  isReadingDrawerOpen: boolean;
  setIsReadingDrawerOpen: (open: boolean) => void;
  lightboxImage: string | null;
  setLightboxImage: (url: string | null) => void;
  lightboxZoom: number;
  setLightboxZoom: React.Dispatch<React.SetStateAction<number>>;
  handleOptionSelect: (questionId: string, optionId: string) => void;
  handleSubmit: () => void;
  handleReportQuestion: (dbId: number | string) => void;
  handleLeave: () => void;
  handlePlayMainAudio: () => void;
  handlePauseMainAudio: () => void;
  playSegmentAudio: (questionId: string, start: string, end: string, audioUrl?: string) => void;
  stopSegmentAudio: () => void;
  formatTime: (seconds: number) => string;
}

export default function ExamTakeEn({
  exam,
  answers,
  setAnswers,
  isSubmitted,
  score,
  timeRemaining,
  audioRef,
  segmentAudioRef,
  isMainAudioPlaying,
  activeSegmentId,
  mainAudioCurrentTime,
  setMainAudioCurrentTime,
  isQuestionListOpen,
  setIsQuestionListOpen,
  isGlobalReportModalOpen,
  setIsGlobalReportModalOpen,
  reportQuestionDbId,
  modalConfig,
  setModalConfig,
  activeSection,
  showReadingSidebarButton,
  isReadingDrawerOpen,
  setIsReadingDrawerOpen,
  lightboxImage,
  setLightboxImage,
  lightboxZoom,
  setLightboxZoom,
  handleOptionSelect,
  handleSubmit,
  handleReportQuestion,
  handleLeave,
  handlePlayMainAudio,
  handlePauseMainAudio,
  playSegmentAudio,
  stopSegmentAudio,
  formatTime,
}: ExamTakeEnProps) {
  const { setSidebarOpen } = useUIStore();
  const mainAudioUrl = exam.sections?.find((s) => s.section_audio_url)?.section_audio_url;
  const allQuestions = exam.sections?.flatMap((s) => s.questions) || [];

  const sectionSuffixes = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const indices: Record<string, number> = {};
    const mapping: Record<string, string> = {};
    
    exam.sections?.forEach((sec) => {
      const key = `${sec.section_name}_${sec.part_number}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    exam.sections?.forEach((sec) => {
      const key = `${sec.section_name}_${sec.part_number}`;
      indices[key] = (indices[key] || 0) + 1;
      mapping[sec.id] = counts[key] > 1 ? `-${indices[key]}` : '';
    });

    return mapping;
  }, [exam.sections]);

  const onAnswerChange = (questionId: string, text: string) => {
    if (!isSubmitted) {
      setAnswers((prev) => ({ ...prev, [questionId]: text }));
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-inter">
      {/* Top Header Panel (Pharmacist Style) */}
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-outline/30 px-6 h-16 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-primary focus:outline-none"
            title="Mở menu phần thi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display-lg text-lg font-extrabold text-primary font-lexend">
            XiaoYueDict
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
            Prep Room
          </span>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-outline/40">
            <Clock className="w-4 h-4 text-[#6366F1]" />
            <span className="font-lexend font-bold text-primary text-sm">
              {timeRemaining !== null ? formatTime(timeRemaining) : `${exam.total_time_minutes}:00`}
            </span>
          </div>

          <button
            onClick={handleLeave}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold font-lexend text-xs transition-colors p-2 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Rời phòng thi</span>
          </button>
        </div>
      </header>

      {/* Main Inner Frame */}
      <div className="flex flex-1 relative min-h-0">
        {/* Center Main Area: Content Panels */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Context Badge */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-outline/85 relative overflow-hidden">
              {/* Top border strip mimicking IELTS Styling */}
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />

              <h2 className="text-2xl font-black text-primary font-lexend tracking-tight">
                {exam.exam_name}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-secondary mt-3 font-inter">
                <span>Câu hỏi: {exam.total_questions} câu</span>
                <span>•</span>
                <span>Điểm chuẩn đạt: {exam.passing_score}/{exam.total_score}</span>
              </div>
            </div>

            {/* Main Audio Player Card */}
            {mainAudioUrl && (
              <AudioPlayerCard
                audioRef={audioRef}
                audioUrl={mainAudioUrl}
                currentTime={mainAudioCurrentTime}
                setCurrentTime={setMainAudioCurrentTime}
                isPlaying={isMainAudioPlaying}
                onPlay={handlePlayMainAudio}
                onPause={handlePauseMainAudio}
                formatTime={formatTime}
                variant="en"
              />
            )}

            {/* Segment timeline audio elements */}
            <audio
              ref={segmentAudioRef as any}
              src={mainAudioUrl}
              onTimeUpdate={(e) => {
                const activeEndTime = segmentAudioRef.current
                  ? (segmentAudioRef.current as any).currentTime
                  : 0;
                const maxEndTime = (segmentAudioRef.current as any).activeSegmentEndTime || 0;
                if (maxEndTime && activeEndTime >= maxEndTime) {
                  segmentAudioRef.current?.pause();
                  stopSegmentAudio();
                }
              }}
              className="hidden"
            />

            {/* Sections container */}
            <div className="space-y-12">
              {exam.sections?.map((section) => (
                <QuestionSection
                  key={section.id}
                  section={section}
                  allQuestions={allQuestions}
                  answers={answers}
                  isSubmitted={isSubmitted}
                  activeSegmentId={activeSegmentId}
                  showExplanationAfter={exam.show_explanation_after}
                  variant="en"
                  playSegmentAudio={playSegmentAudio}
                  setLightboxImage={setLightboxImage}
                  setLightboxZoom={setLightboxZoom}
                  onSelectOption={handleOptionSelect}
                  onAnswerChange={onAnswerChange}
                  onReport={handleReportQuestion}
                  partSuffix={sectionSuffixes[section.id] || ''}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Right Aside: Navigator Sidebar (PC Only) */}
        <aside className="hidden xl:flex w-[350px] shrink-0 flex-col bg-white border-l border-outline/65 p-4 sticky top-16 h-[calc(100vh-4rem)]">
          <QuestionNavigator
            allQuestions={allQuestions}
            answers={answers}
            isSubmitted={isSubmitted}
            score={score}
            totalScore={exam.total_score}
            passingScore={exam.passing_score}
            onSubmit={handleSubmit}
          />
        </aside>
      </div>

      {/* Floating Navigator Button on Mobile */}
      <button
        onClick={() => setIsQuestionListOpen(true)}
        className="xl:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 p-3 bg-primary text-white border border-r-0 border-primary/20 rounded-l-2xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center focus:outline-none"
        title="Bản đồ câu hỏi"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer Navigator */}
      <MobileNavigatorDrawer
        isOpen={isQuestionListOpen}
        onClose={() => setIsQuestionListOpen(false)}
        allQuestions={allQuestions}
        answers={answers}
        isSubmitted={isSubmitted}
        score={score}
        totalScore={exam.total_score}
        passingScore={exam.passing_score}
        onSubmit={handleSubmit}
      />

      {/* Floating Reading Sidebar Drawer Trigger */}
      {showReadingSidebarButton && (
        <button
          onClick={() => setIsReadingDrawerOpen(true)}
          className="fixed right-0 top-[calc(50%+60px)] xl:hidden -translate-y-1/2 z-40 p-3 bg-secondary text-white border border-r-0 border-secondary/20 rounded-l-2xl shadow-xl hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
          title="Xem đoạn văn"
        >
          <BookOpen className="w-6 h-6" />
          <span className="hidden xl:inline text-[10px] font-bold [writing-mode:vertical-rl] rotate-180 py-1 font-lexend">
            ĐOẠN VĂN
          </span>
        </button>
      )}

      {/* Reading Sidebar Drawer */}
      <ReadingSidebarDrawer
        isOpen={isReadingDrawerOpen}
        onClose={() => setIsReadingDrawerOpen(false)}
        activeSection={activeSection}
        partSuffix={activeSection ? (sectionSuffixes[activeSection.id] || '') : ''}
      />

      {/* Modals & Dialogs */}
      {isGlobalReportModalOpen && reportQuestionDbId && (
        <ReportModal
          isOpen={isGlobalReportModalOpen}
          onClose={() => setIsGlobalReportModalOpen(false)}
          contentType="exam_question"
          objectId={reportQuestionDbId}
          defaultReportType="exam_question"
          title="Báo cáo lỗi câu hỏi thi"
        />
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <ImageLightbox
        image={lightboxImage}
        zoom={lightboxZoom}
        setZoom={setLightboxZoom}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
