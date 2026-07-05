'use client';

import React from 'react';
import { Menu, BookOpen, Clock } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { Exam, Question, Section } from '@/types/exam';
import { ExamState } from '@/lib/examState';
import QuestionSection from './QuestionSection';
import AudioPlayerCard from './AudioPlayerCard';
import QuestionNavigator from './QuestionNavigator';
import MobileNavigatorDrawer from './MobileNavigatorDrawer';
import ReadingSidebarDrawer from './ReadingSidebarDrawer';
import ImageLightbox from './ImageLightbox';
import dynamic from 'next/dynamic';

const ConfirmModal = dynamic(() => import('@/components/ConfirmModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });

interface ExamTakeZhProps {
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

export default function ExamTakeZh({
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
}: ExamTakeZhProps) {
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
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-lexend">
      {/* Top Sticky Header */}
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
            Phòng Thi
          </span>
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-outline/40">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-lexend font-bold text-primary text-sm">
            {timeRemaining !== null ? formatTime(timeRemaining) : `${exam.total_time_minutes}:00`}
          </span>
        </div>
      </header>

      {/* Main Inner Frame */}
      <div className="w-full p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8">
          {/* Left Column: Main Exam Content */}
          <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-outline/80 relative overflow-hidden">
            {/* Top border strip mimicking HSK styling */}
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

            {/* Exam Title & Meta */}
            <div className="flex flex-col mb-4">
              <span className="text-xs font-bold text-sage uppercase tracking-widest font-lexend mb-1">
                Phòng Thi Tiếng Trung
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary font-lexend leading-tight">
                {exam.exam_name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 text-xs md:text-sm text-secondary mb-8 pb-6 border-b border-outline/35 font-inter font-semibold items-center">
              <span>{exam.total_questions} câu hỏi</span>
              <span>•</span>
              <span>
                Yêu cầu đạt: {exam.passing_score}/{exam.total_score} điểm
              </span>
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
              variant="zh"
            />
          )}

          {/* Segment Audio element for timelines */}
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

          {/* Render Sections */}
          <div className="space-y-12 mt-6">
            {exam.sections?.map((section) => (
              <QuestionSection
                key={section.id}
                section={section}
                allQuestions={allQuestions}
                answers={answers}
                isSubmitted={isSubmitted}
                activeSegmentId={activeSegmentId}
                showExplanationAfter={exam.show_explanation_after}
                variant="zh"
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

        {/* Right Column: Navigator Panel for PC */}
        <div className="w-full xl:w-80 shrink-0 hidden xl:block">
          <div className="sticky top-6">
            <QuestionNavigator
              allQuestions={allQuestions}
              answers={answers}
              isSubmitted={isSubmitted}
              score={score}
              totalScore={exam.total_score}
              passingScore={exam.passing_score}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
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
          className="fixed right-0 top-[calc(50%+60px)] xl:top-[calc(50%+60px)] -translate-y-1/2 z-40 p-3 bg-sage text-white border border-r-0 border-sage/20 rounded-l-2xl shadow-xl hover:bg-sage/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
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
    </div>
  );
}
