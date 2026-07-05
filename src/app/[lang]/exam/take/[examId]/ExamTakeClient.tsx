'use client';

import React from 'react';
import { useExamSession } from './hooks/useExamSession';
import ExamTakeZh from './components/ExamTakeZh';
import ExamTakeEn from './components/ExamTakeEn';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ExamTakeClient() {
  const session = useExamSession();
  const { examSpeed, examVolume } = useSettingsStore();

  if (session.loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 font-semibold text-primary text-sm font-lexend">
          Đang tải bài thi...
        </span>
      </div>
    );
  }

  if (session.error || !session.exam) {
    return (
      <div className="w-full p-8 pb-16">
        <div className="max-w-[1280px] mx-auto text-center">
          <div className="bg-red-50 text-red-500 p-6 rounded-[1.5rem] border border-red-200 inline-block font-semibold font-inter max-w-md">
            ⚠️ {session.error || 'Không tìm thấy thông tin bài thi này.'}
          </div>
        </div>
      </div>
    );
  }

  // Branch UI layout by language parameter
  if (session.language === 'zh') {
    return (
      <ExamTakeZh
        exam={session.exam}
        answers={session.answers}
        setAnswers={session.setAnswers}
        isSubmitted={session.isSubmitted}
        score={session.score}
        timeRemaining={session.timeRemaining}
        audioRef={session.audioRef}
        segmentAudioRef={session.segmentAudioRef}
        isMainAudioPlaying={session.isMainAudioPlaying}
        activeSegmentId={session.activeSegmentId}
        mainAudioCurrentTime={session.mainAudioCurrentTime}
        setMainAudioCurrentTime={session.setMainAudioCurrentTime}
        isQuestionListOpen={session.isQuestionListOpen}
        setIsQuestionListOpen={session.setIsQuestionListOpen}
        isGlobalReportModalOpen={session.isGlobalReportModalOpen}
        setIsGlobalReportModalOpen={session.setIsGlobalReportModalOpen}
        reportQuestionDbId={session.reportQuestionDbId}
        modalConfig={session.modalConfig}
        setModalConfig={session.setModalConfig}
        activeSection={session.activeSection}
        showReadingSidebarButton={session.showReadingSidebarButton}
        isReadingDrawerOpen={session.isReadingDrawerOpen}
        setIsReadingDrawerOpen={session.setIsReadingDrawerOpen}
        lightboxImage={session.lightboxImage}
        setLightboxImage={session.setLightboxImage}
        lightboxZoom={session.lightboxZoom}
        setLightboxZoom={session.setLightboxZoom}
        handleOptionSelect={session.handleOptionSelect}
        handleSubmit={session.handleSubmit}
        handleReportQuestion={session.handleReportQuestion}
        handleLeave={session.handleLeave}
        handlePlayMainAudio={session.handlePlayMainAudio}
        handlePauseMainAudio={session.handlePauseMainAudio}
        playSegmentAudio={session.playSegmentAudio}
        stopSegmentAudio={session.stopSegmentAudio}
        formatTime={session.formatTime}
      />
    );
  }

  return (
    <ExamTakeEn
      exam={session.exam}
      answers={session.answers}
      setAnswers={session.setAnswers}
      isSubmitted={session.isSubmitted}
      score={session.score}
      timeRemaining={session.timeRemaining}
      audioRef={session.audioRef}
      segmentAudioRef={session.segmentAudioRef}
      isMainAudioPlaying={session.isMainAudioPlaying}
      activeSegmentId={session.activeSegmentId}
      mainAudioCurrentTime={session.mainAudioCurrentTime}
      setMainAudioCurrentTime={session.setMainAudioCurrentTime}
      isQuestionListOpen={session.isQuestionListOpen}
      setIsQuestionListOpen={session.setIsQuestionListOpen}
      isGlobalReportModalOpen={session.isGlobalReportModalOpen}
      setIsGlobalReportModalOpen={session.setIsGlobalReportModalOpen}
      reportQuestionDbId={session.reportQuestionDbId}
      modalConfig={session.modalConfig}
      setModalConfig={session.setModalConfig}
      activeSection={session.activeSection}
      showReadingSidebarButton={session.showReadingSidebarButton}
      isReadingDrawerOpen={session.isReadingDrawerOpen}
      setIsReadingDrawerOpen={session.setIsReadingDrawerOpen}
      lightboxImage={session.lightboxImage}
      setLightboxImage={session.setLightboxImage}
      lightboxZoom={session.lightboxZoom}
      setLightboxZoom={session.setLightboxZoom}
      handleOptionSelect={session.handleOptionSelect}
      handleSubmit={session.handleSubmit}
      handleReportQuestion={session.handleReportQuestion}
      handleLeave={session.handleLeave}
      handlePlayMainAudio={session.handlePlayMainAudio}
      handlePauseMainAudio={session.handlePauseMainAudio}
      playSegmentAudio={session.playSegmentAudio}
      stopSegmentAudio={session.stopSegmentAudio}
      formatTime={session.formatTime}
    />
  );
}
