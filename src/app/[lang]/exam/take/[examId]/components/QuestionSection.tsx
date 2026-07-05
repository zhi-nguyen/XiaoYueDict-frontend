'use client';

import React, { useState } from 'react';
import { Section, Question } from '@/types/exam';
import QuestionCard from './QuestionCard';
import { BookOpen, Highlighter, Type, ZoomIn, ZoomOut } from 'lucide-react';

interface QuestionSectionProps {
  section: Section;
  allQuestions: Question[];
  answers: Record<string, string>;
  isSubmitted: boolean;
  activeSegmentId: string | null;
  showExplanationAfter: string;
  variant: 'zh' | 'en';
  playSegmentAudio: (questionId: string, start: string, end: string, audioUrl?: string) => void;
  setLightboxImage: (url: string | null) => void;
  setLightboxZoom: (zoom: number) => void;
  onSelectOption: (questionId: string, optionId: string) => void;
  onAnswerChange: (questionId: string, answerText: string) => void;
  onReport: (dbId: number) => void;
  partSuffix?: string;
}

type TextSize = 'text-sm' | 'text-base' | 'text-lg' | 'text-xl';

export default function QuestionSection({
  section,
  allQuestions,
  answers,
  isSubmitted,
  activeSegmentId,
  showExplanationAfter,
  variant,
  playSegmentAudio,
  setLightboxImage,
  setLightboxZoom,
  onSelectOption,
  onAnswerChange,
  onReport,
  partSuffix = '',
}: QuestionSectionProps) {
  const [textSize, setTextSize] = useState<TextSize>('text-base');
  const paragraphs = section.paragraphs || [];


  const isReading = paragraphs.length > 0;

  const increaseTextSize = () => {
    if (textSize === 'text-sm') setTextSize('text-base');
    else if (textSize === 'text-base') setTextSize('text-lg');
    else if (textSize === 'text-lg') setTextSize('text-xl');
  };

  const decreaseTextSize = () => {
    if (textSize === 'text-xl') setTextSize('text-lg');
    else if (textSize === 'text-lg') setTextSize('text-base');
    else if (textSize === 'text-base') setTextSize('text-sm');
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const passageContent = document.getElementById(`passage-content-${section.id}`);

    if (passageContent && passageContent.contains(range.commonAncestorContainer)) {
      const span = document.createElement('span');
      span.className = 'highlight-yellow';
      try {
        range.surroundContents(span);
      } catch (e) {
        console.warn("Complex selection spans multiple nodes. Highlight cannot wrap cleanly.");
      }
      selection.removeAllRanges();
    }
  };

  const onScrollToSection = () => {
    document.getElementById(`section-${section.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (isReading) {
    /* Split Screen Layout for Reading Section on PC */
    return (
      <div
        id={`section-${section.id}`}
        className="section-container border-t-2 border-outline/50 pt-8 first:border-0"
        data-section-name={section.section_name}
      >
        <div className="hidden lg:grid grid-cols-12 gap-8 h-[75vh]">
          {/* Left Column: Scrollable Reading Passage */}
          <div className="col-span-6 bg-white border border-outline/80 rounded-[2rem] shadow-sm flex flex-col min-h-0">
            {/* Left Column Toolbar */}
            <div className="bg-slate-50 border-b border-outline/50 flex flex-col rounded-t-[2rem]">
              {/* Toolbar Actions Row */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-outline/30">
                <h3 className="text-base font-bold text-primary font-lexend flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Đoạn Văn - P.{section.part_number}{partSuffix}</span>
                </h3>

                <div className="flex items-center gap-3">
                  {/* Highlight text button */}
                  <button
                    onClick={handleHighlight}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-outline hover:bg-yellow-50 hover:border-yellow-300 text-xs font-bold rounded-full transition-all text-secondary focus:outline-none font-lexend"
                    title="Bôi đen văn bản rồi bấm để tô sáng"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Tô sáng</span>
                  </button>

                  {/* Text size controls */}
                  <div className="flex items-center bg-white border border-outline rounded-full p-0.5">
                    <button
                      onClick={decreaseTextSize}
                      disabled={textSize === 'text-sm'}
                      className="p-1 text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-secondary focus:outline-none"
                      title="Giảm cỡ chữ"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-secondary font-mono px-2 select-none">
                      Cỡ chữ
                    </span>
                    <button
                      onClick={increaseTextSize}
                      disabled={textSize === 'text-xl'}
                      className="p-1 text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-secondary focus:outline-none"
                      title="Tăng cỡ chữ"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Left Column Scrollable Body */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div
                id={`passage-content-${section.id}`}
                className={`text-primary leading-relaxed text-justify font-inter space-y-6 ${textSize}`}
                style={{ textAlign: 'justify' }}
              >
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => (
                    <p key={p.id || idx} className="whitespace-pre-line">
                      {p.content}
                    </p>
                  ))
                ) : (
                  <p className="whitespace-pre-line">{section.instruction}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Scrollable Questions list */}
          <div className="col-span-6 flex flex-col min-h-0">
            <div className="px-2 py-3 mb-2 flex items-center justify-between border-b border-outline/30 flex-shrink-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-lexend">
                Bảng Câu Hỏi
              </span>
              <span className="text-xs font-bold text-on-surface-variant bg-slate-100 px-3 py-1 rounded-full font-inter">
                {section.questions.length} câu
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6 custom-scrollbar">
              {section.questions.map((question) => {
                const overallIndex = allQuestions.findIndex(
                  (q) => q.question_id === question.question_id
                );

                return (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={overallIndex >= 0 ? overallIndex : 0}
                    isSubmitted={isSubmitted}
                    userAnswer={answers[question.question_id]}
                    onSelectOption={onSelectOption}
                    onAnswerChange={onAnswerChange}
                    onReport={onReport}
                    activeSegmentId={activeSegmentId}
                    playSegmentAudio={playSegmentAudio}
                    setLightboxImage={setLightboxImage}
                    setLightboxZoom={setLightboxZoom}
                    onScrollToSection={onScrollToSection}
                    showExplanationAfter={showExplanationAfter}
                    variant={variant}
                    onFocus={() => {}}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile View: Standard Stacked Layout */}
        <div className="lg:hidden space-y-6">
          <div className="border-l-4 border-primary pl-4 py-1">
            <h2 className="text-xl font-bold text-primary font-lexend">
              {section.section_name} - Phần {section.part_number}{partSuffix}
            </h2>

            {/* Mobile toolbar for Reading */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                onClick={handleHighlight}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-outline hover:bg-yellow-50 text-xs font-bold rounded-full transition-all text-secondary focus:outline-none"
              >
                <Highlighter className="w-3.5 h-3.5 text-yellow-500" />
                <span>Tô sáng</span>
              </button>

              <div className="flex items-center bg-white border border-outline rounded-full p-0.5">
                <button
                  onClick={decreaseTextSize}
                  disabled={textSize === 'text-sm'}
                  className="p-1 text-secondary focus:outline-none"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-secondary font-mono px-2 select-none">
                  Cỡ chữ
                </span>
                <button
                  onClick={increaseTextSize}
                  disabled={textSize === 'text-xl'}
                  className="p-1 text-secondary focus:outline-none"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>



          <div
            id={`passage-content-mobile-${section.id}`}
            className={`bg-slate-50 border border-outline rounded-2xl p-5 text-primary leading-relaxed text-justify font-inter space-y-6 ${textSize}`}
            style={{ textAlign: 'justify' }}
          >
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => (
                <p key={p.id || idx} className="whitespace-pre-line">
                  {p.content}
                </p>
              ))
            ) : (
              <p className="whitespace-pre-line">{section.instruction}</p>
            )}
          </div>

          <div className="space-y-6">
            {section.questions.map((question) => {
              const overallIndex = allQuestions.findIndex(
                (q) => q.question_id === question.question_id
              );

              return (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={overallIndex >= 0 ? overallIndex : 0}
                  isSubmitted={isSubmitted}
                  userAnswer={answers[question.question_id]}
                  onSelectOption={onSelectOption}
                  onAnswerChange={onAnswerChange}
                  onReport={onReport}
                  activeSegmentId={activeSegmentId}
                  playSegmentAudio={playSegmentAudio}
                  setLightboxImage={setLightboxImage}
                  setLightboxZoom={setLightboxZoom}
                  onScrollToSection={onScrollToSection}
                  showExplanationAfter={showExplanationAfter}
                  variant={variant}
                  onFocus={() => {}}
                  idPrefix="mobile-"
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* Default Stacked layout for Listening / Writing etc. */
  return (
    <div
      id={`section-${section.id}`}
      className="section-container border-t border-outline/40 pt-8 first:border-0 space-y-6"
      data-section-name={section.section_name}
    >
      <div className="border-l-4 border-primary pl-4 py-1">
        <h2 className="text-xl md:text-2xl font-bold text-primary font-lexend">
          {section.section_name} - Phần {section.part_number}{partSuffix}
        </h2>
        {section.instruction && (
          <p className="text-on-surface-variant/80 text-sm mt-2 leading-relaxed italic font-inter">
            {section.instruction}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {section.questions.map((question) => {
          const overallIndex = allQuestions.findIndex(
            (q) => q.question_id === question.question_id
          );

          return (
            <QuestionCard
              key={question.id}
              question={question}
              index={overallIndex >= 0 ? overallIndex : 0}
              isSubmitted={isSubmitted}
              userAnswer={answers[question.question_id]}
              onSelectOption={onSelectOption}
              onAnswerChange={onAnswerChange}
              onReport={onReport}
              activeSegmentId={activeSegmentId}
              playSegmentAudio={playSegmentAudio}
              setLightboxImage={setLightboxImage}
              setLightboxZoom={setLightboxZoom}
              showExplanationAfter={showExplanationAfter}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
}
