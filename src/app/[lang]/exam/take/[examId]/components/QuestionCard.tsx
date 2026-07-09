'use client';

import React from 'react';
import { Flag, Play, Pause, BookOpen } from 'lucide-react';
import { Question, Option } from '@/types/exam';

const getMediaUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
};

interface QuestionCardProps {
  question: Question;
  index: number;
  isSubmitted: boolean;
  userAnswer: string | undefined;
  onSelectOption: (questionId: string, optionId: string) => void;
  onAnswerChange: (questionId: string, answerText: string) => void;
  onReport: (dbId: number) => void;
  activeSegmentId: string | null;
  playSegmentAudio: (questionId: string, start: string, end: string, audioUrl?: string) => void;
  setLightboxImage: (url: string | null) => void;
  setLightboxZoom: (zoom: number) => void;
  onScrollToSection?: () => void;
  showExplanationAfter: string;
  variant: 'zh' | 'en';
  onFocus?: () => void;
  idPrefix?: string;
}

export default function QuestionCard({
  question,
  index,
  isSubmitted,
  userAnswer,
  onSelectOption,
  onAnswerChange,
  onReport,
  activeSegmentId,
  playSegmentAudio,
  setLightboxImage,
  setLightboxZoom,
  onScrollToSection,
  showExplanationAfter,
  variant,
  onFocus,
  idPrefix = '',
}: QuestionCardProps) {
  const isSegmentPlaying = activeSegmentId === question.question_id;

  const cleanAnswer = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[.。!！?？]+$/, '')
      .trim();
  };

  const correctAnswersList = (question.correct_answer || '')
    .split('/')
    .map((ans) => cleanAnswer(ans));
  const formattedUserAnswer = cleanAnswer(userAnswer || '');
  const isFillBlankCorrect = correctAnswersList.includes(formattedUserAnswer);

  const isCorrect =
    question.question_type === 'fill_blank' || (question.question_type === 'ordering' && (!question.options || question.options.length === 0))
      ? isFillBlankCorrect
      : userAnswer === question.correct_answer;

  const cardBorderColor = isSubmitted
    ? isCorrect
      ? 'border-green-300 bg-green-50/20'
      : 'border-red-300 bg-red-50/20'
    : 'border-outline/80 bg-white hover:border-primary/20';

  const badgeColor =
    variant === 'zh'
      ? 'bg-primary/10 text-primary'
      : 'bg-[#6366F1]/10 text-[#6366F1]';

  return (
    <div
      id={`${idPrefix}question-${question.question_id}`}
      onClick={onFocus}
      className={`p-5 md:p-6 rounded-2xl border transition-all duration-300 scroll-m-24 shadow-sm cursor-pointer ${cardBorderColor}`}
    >
      <div className="space-y-4">
        {/* Header: Question Number, Segment Play, Report */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-lexend ${badgeColor}`}>
              {index + 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Segment audio timeline play button */}
            {question.audio_start_time && question.audio_end_time && (
              <button
                onClick={() =>
                  playSegmentAudio(
                    question.question_id,
                    question.audio_start_time,
                    question.audio_end_time,
                    question.audio_url
                  )
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 focus:outline-none font-lexend ${
                  isSegmentPlaying
                    ? 'bg-primary text-white border-primary shadow-sm scale-95'
                    : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                }`}
              >
                {isSegmentPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Nghe</span>
                  </>
                )}
              </button>
            )}

            {/* Flag report */}
            <button
              onClick={() => onReport(question.id)}
              className="w-8 h-8 flex items-center justify-center text-on-surface-variant/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-outline hover:border-red-200 focus:outline-none"
              title="Báo cáo câu hỏi sai"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Text + Images */}
        {(question.question_text || question.image_url || question.image_description) && (
          <div className="space-y-4 font-inter">
            {question.question_text && (
              <p className="font-bold text-base md:text-lg text-primary leading-snug">
                {question.question_text}
              </p>
            )}

            {question.image_url && (
              <div className="w-full flex justify-center md:justify-start">
                <img
                  src={getMediaUrl(question.image_url)}
                  alt="Question Context"
                  loading="lazy"
                  className="w-full max-w-[480px] md:max-w-[280px] h-auto object-contain rounded-2xl shadow-sm border border-outline cursor-zoom-in hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setLightboxImage(getMediaUrl(question.image_url));
                    setLightboxZoom(1);
                  }}
                />
              </div>
            )}

            {!question.image_url && question.image_description && (
              <div className="p-4 bg-slate-100 rounded-xl italic text-xs text-on-surface-variant max-w-sm text-center md:text-left">
                [Hình ảnh: {question.image_description}]
              </div>
            )}
          </div>
        )}

        {/* Options Rendering */}
        {question.question_type === 'true_false' ? (
          <div
            className={`grid ${
              question.options.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2'
            } gap-4 w-full mt-4 font-lexend`}
          >
            {question.options.map((opt) => {
              const selected = userAnswer === opt.option_id;
              const hasText = !!opt.text;
              const isTrue =
                opt.option_id === 'opt_True' ||
                opt.text?.toUpperCase() === 'TRUE' ||
                opt.text?.toUpperCase() === 'YES';

              let btnClass =
                'flex items-center justify-center p-3.5 rounded-xl border-2 transition-all cursor-pointer text-base font-bold ';

              if (isSubmitted) {
                if (opt.option_id === question.correct_answer) {
                  btnClass += 'bg-green-100 border-green-500 text-green-700 shadow-sm';
                } else if (selected && opt.option_id !== question.correct_answer) {
                  btnClass += 'bg-red-100 border-red-500 text-red-700 shadow-sm';
                } else {
                  btnClass += 'border-outline/50 bg-slate-50 text-slate-300 opacity-60';
                }
                btnClass = btnClass.replace('cursor-pointer', 'cursor-default');
              } else {
                btnClass += selected
                  ? 'border-primary bg-primary/10 text-primary scale-102 shadow-sm'
                  : 'border-outline bg-slate-50 hover:bg-slate-100 text-on-surface-variant';
              }

              return (
                <button
                  key={opt.option_id || opt.id}
                  disabled={isSubmitted}
                  className={btnClass}
                  onClick={() => onSelectOption(question.question_id, opt.option_id)}
                >
                  {hasText ? (
                    <span>{opt.text}</span>
                  ) : isTrue ? (
                    <span className="text-xl">✔️ Đúng</span>
                  ) : (
                    <span className="text-xl">❌ Sai</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (question.question_type === 'fill_blank' || (question.question_type === 'ordering' && (!question.options || question.options.length === 0))) ? (
          <div className="mt-4 w-full font-inter">
            <input
              type="text"
              className={`w-full p-4 rounded-xl border-2 transition-all text-base focus:outline-none ${
                isSubmitted
                  ? isFillBlankCorrect
                    ? 'bg-green-50 border-green-500 text-green-900 shadow-sm'
                    : 'bg-red-50 border-red-400 text-red-900'
                  : 'border-outline bg-white focus:border-primary'
              }`}
              placeholder="Nhập câu trả lời của bạn..."
              value={userAnswer || ''}
              onChange={(e) => onAnswerChange(question.question_id, e.target.value)}
              disabled={isSubmitted}
            />
          </div>
        ) : question.question_type === 'essay' ? (
          <div className="mt-4 w-full font-inter">
            <textarea
              className="w-full p-4 rounded-xl border-2 border-outline bg-white focus:border-primary text-base focus:outline-none min-h-[180px] resize-y"
              placeholder="Viết bài tự luận tại đây..."
              value={userAnswer || ''}
              onChange={(e) => onAnswerChange(question.question_id, e.target.value)}
              disabled={isSubmitted}
            />
          </div>
        ) : (
          /* Multiple Choice Options */
          <div
            className={`mt-4 ${
              question.options.every((opt) => !opt.text)
                ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
                : 'space-y-3'
            }`}
          >
            {question.options.map((opt, optIndex) => {
              const selected = userAnswer === opt.option_id;
              const isImageOnly = !opt.text;

              let optionClass = `relative flex ${
                isImageOnly ? 'flex-row items-center gap-4 p-3' : 'items-center gap-4 p-4'
              } rounded-2xl border-2 cursor-pointer transition-all font-inter `;

              if (isSubmitted) {
                if (opt.option_id === question.correct_answer) {
                  optionClass += 'bg-green-50 border-green-500 text-green-900 shadow-sm';
                } else if (selected && opt.option_id !== question.correct_answer) {
                  optionClass += 'bg-red-50 border-red-400 text-red-900';
                } else {
                  optionClass += 'border-outline/50 opacity-60 bg-slate-50';
                }
                optionClass = optionClass.replace('cursor-pointer', 'cursor-default');
              } else {
                optionClass += selected
                  ? 'border-primary bg-primary/5 shadow-sm scale-[1.01]'
                  : 'border-outline hover:border-primary/40 hover:bg-hover-bg bg-white';
              }

              const letter = String.fromCharCode(65 + optIndex); // A, B, C...

              return (
                <div
                  key={opt.option_id || opt.id}
                  className={optionClass}
                  onClick={() => !isSubmitted && onSelectOption(question.question_id, opt.option_id)}
                >
                  {isImageOnly ? (
                    <>
                      <div className="w-8 h-8 flex-shrink-0 bg-slate-100 text-secondary font-bold rounded-full flex items-center justify-center font-lexend">
                        {letter}
                      </div>
                      <div className="flex-1 aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center relative border border-outline">
                        {opt.image_url ? (
                          <img
                            src={getMediaUrl(opt.image_url)}
                            alt="Option Context"
                            loading="lazy"
                            className="w-full h-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(getMediaUrl(opt.image_url));
                              setLightboxZoom(1);
                            }}
                          />
                        ) : opt.image_description ? (
                          <span className="italic text-on-surface-variant/70 text-xs p-4 text-center">
                            [{opt.image_description}]
                          </span>
                        ) : null}
                      </div>
                      {isSubmitted && opt.option_id === question.correct_answer && (
                        <div className="absolute inset-[-4px] border-[4px] border-green-500 rounded-2xl pointer-events-none z-20"></div>
                      )}
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                          selected ? 'border-primary bg-primary/20' : 'border-slate-300'
                        }`}
                      >
                        {selected && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                      </div>
                      <div className="flex-1 text-sm md:text-base text-primary">
                        <span className="font-bold mr-2 font-lexend">{letter}.</span>
                        {opt.text}

                        {opt.image_url && (
                          <div className="mt-3 flex justify-center md:justify-start">
                            <img
                              src={getMediaUrl(opt.image_url)}
                              alt="Option context"
                              loading="lazy"
                              className="w-32 h-auto object-contain rounded-xl border border-outline shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(getMediaUrl(opt.image_url));
                                setLightboxZoom(1);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Correct Answers & Explanation */}
        {isSubmitted && showExplanationAfter === 'exam_submitted' && (
          <div className="mt-6 p-4 bg-blue-50/60 text-blue-900 rounded-2xl border border-blue-200 text-sm font-inter">
            <p className="font-bold text-blue-950 mb-2">💡 Giải thích chi tiết:</p>
            {(question.question_type === 'fill_blank' || (question.question_type === 'ordering' && (!question.options || question.options.length === 0))) && (
              <p className="mb-2">
                <strong>Đáp án đúng:</strong>{' '}
                <span className="text-green-700 font-semibold">{question.correct_answer}</span>
              </p>
            )}
            {question.audio_script && (
              <div className="mb-3 bg-white/70 p-3 rounded-xl border border-blue-100">
                <strong className="text-blue-950 block mb-1">Audio script:</strong>
                <p className="text-xs leading-relaxed text-on-surface">{question.audio_script}</p>
              </div>
            )}
            <p className="text-on-surface-variant">
              {question.explanation || 'Không có giải thích chi tiết.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
