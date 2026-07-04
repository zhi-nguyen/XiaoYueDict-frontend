"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchExamDetails } from '@/lib/api/exams';
import { Exam } from '@/types/exam';
import dynamic from 'next/dynamic';
const ConfirmModal = dynamic(() => import('@/components/ConfirmModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/ReportModal'), { ssr: false });
import { saveExamState, loadExamState, clearExamState, ExamState } from '@/lib/examState';
import { Flag } from 'lucide-react';
import { getGuestId } from '@/lib/guest';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const getMediaUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
};

const timeToSeconds = (timeStr: string | null | undefined): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(parseFloat);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
};

export default function ExamTakePage() {
  const params = useParams();
  const router = useRouter();
  const examId = parseInt(params.examId as string, 10);
  const language = (params?.lang as string) || 'zh';

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // answers[question_id] = option_id
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Read exam audio settings from centralized store
  const { examSpeed, examVolume } = useSettingsStore();

  // Apply settings when audio element is rendered or settings change
  useEffect(() => {
    if (!loading && exam) {
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = examSpeed;
          audioRef.current.volume = examVolume;
        }
        if (segmentAudioRef.current) {
          segmentAudioRef.current.playbackRate = examSpeed;
          segmentAudioRef.current.volume = examVolume;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, exam, examSpeed, examVolume]);

  // New state variables for persistence and timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const segmentAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const activeSegmentEndTimeRef = React.useRef<number | null>(null);

  const [isMainAudioPlaying, setIsMainAudioPlaying] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [mainAudioCurrentTime, setMainAudioCurrentTime] = useState(0);

  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);
  const [isGlobalReportModalOpen, setIsGlobalReportModalOpen] = useState(false);
  const [reportQuestionDbId, setReportQuestionDbId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // New state variables for Reading sidebar and Image Lightbox
  const [showReadingSidebarButton, setShowReadingSidebarButton] = useState(false);
  const [isReadingDrawerOpen, setIsReadingDrawerOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  useEffect(() => {
    if (!exam || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-section-name');
            const nameLower = sectionName?.toLowerCase() || '';
            if (nameLower.includes('reading') || nameLower.includes('read') || nameLower.includes('đọc') || nameLower.includes('阅读')) {
              setShowReadingSidebarButton(true);
            } else {
              setShowReadingSidebarButton(false);
            }
          }
        });
      },
      { threshold: 0.05, rootMargin: '-10% 0px -10% 0px' }
    );

    const timer = setTimeout(() => {
      const targets = document.querySelectorAll('.section-container');
      targets.forEach((target) => observer.observe(target));
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [exam, loading]);

  useEffect(() => {
    async function loadExam() {
      try {
        const data = await fetchExamDetails(examId);
        setExam(data);

        // Load saved state
        const savedState = loadExamState(examId);
        if (savedState) {
          setAnswers(savedState.answers);
          if (savedState.isSubmitted) {
            setIsSubmitted(true);
            setScore(savedState.score !== undefined ? savedState.score : 0);
          } else {
            setTimeRemaining(savedState.timeRemaining);
            if (audioRef.current && savedState.audioTime) {
              audioRef.current.currentTime = savedState.audioTime;
            }
          }
        } else {
          setTimeRemaining(data.total_time_minutes * 60);
        }
      } catch (err) {
        setError('Không thể tải bài thi.');
      } finally {
        setLoading(false);
      }
    }
    if (examId) loadExam();
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, timeRemaining === null]);

  // Auto-submit when time hits 0
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted && exam) {
      handleFinalSubmit();
      setModalConfig({
        isOpen: true,
        title: 'Hết giờ!',
        message: 'Thời gian làm bài đã hết. Bài thi của bạn đã được tự động nộp.',
        confirmText: 'Đóng',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      });
    }
  }, [timeRemaining, isSubmitted, exam]);

  // Auto-save state
  useEffect(() => {
    if (!exam || isSubmitted) return;

    saveExamState(examId, {
      version: '0.1',
      answers,
      audioTime: audioRef.current?.currentTime || 0,
      timeRemaining: timeRemaining || (exam.total_time_minutes * 60),
      isSubmitted,
      lastSaved: Date.now()
    });
  }, [answers, timeRemaining, isSubmitted, examId, exam]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));

    // Tự động chuyển sang câu tiếp theo
    if (exam && exam.sections) {
      const allQuestions = exam.sections.flatMap(s => s.questions) || [];
      const currentIndex = allQuestions.findIndex(q => q.question_id === questionId);
      if (currentIndex !== -1 && currentIndex + 1 < allQuestions.length) {
        const nextQuestion = allQuestions[currentIndex + 1];

        // Tắt audio toàn bài thi ngay lập tức
        if (audioRef.current) {
          audioRef.current.pause();
        }

        setTimeout(() => {
          const element = document.getElementById(`question-${nextQuestion.question_id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Bật audio của câu hỏi tiếp theo dựa trên timeline (nếu có)
          if (nextQuestion.audio_start_time && nextQuestion.audio_end_time) {
            playSegmentAudio(nextQuestion.question_id, nextQuestion.audio_start_time, nextQuestion.audio_end_time);
          } else {
            // Dừng phát segment audio nếu câu tiếp theo không có timeline
            if (segmentAudioRef.current) {
              segmentAudioRef.current.pause();
              setActiveSegmentId(null);
            }
          }
        }, 350);
      }
    }
  };

  /**
   * Finalises the exam session:
   * 1. Compute the score locally (no backend exam-submit API exists yet).
   * 2. Persist UI state so the results screen can render immediately.
   * 3. Log gamification activity ONLY after step 1–2 succeed, preserving
   *    data integrity: if scoring logic throws, logActivity is never called.
   *
   * The function is async so that adding a real backend submission API in
   * the future (step 1.5) requires no structural refactoring — simply:
   *   await submitExamToBackend(examData);
   * between steps 1 and 3.
   */
  const handleFinalSubmit = async () => {
    if (!exam || !exam.sections) return;

    // ── Step 1: Local scoring (infallible — pure computation) ──────────
    let correctCount = 0;
    exam.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const userAns = (answers[q.question_id] || '').trim().toLowerCase();
        const correctAns = (q.correct_answer || '').trim().toLowerCase();
        if (q.question_type === 'fill_blank') {
          const possibleAnswers = correctAns.split('/').map(ans => ans.trim());
          if (possibleAnswers.includes(userAns)) {
            correctCount += q.points;
          }
        } else {
          if (answers[q.question_id] === q.correct_answer) {
            correctCount += q.points;
          }
        }
      });
    });

    // ── Step 2: Commit UI state ─────────────────────────────────────────
    setScore(correctCount);
    setIsSubmitted(true);
    window.scrollTo(0, 0);

    saveExamState(examId, {
      version: '0.1',
      answers,
      audioTime: audioRef.current?.currentTime || 0,
      timeRemaining: timeRemaining || 0,
      isSubmitted: true,
      lastSaved: Date.now(),
      score: correctCount
    });

    // ── Step 3: Gamification logging — sequenced AFTER successful submit ─
    // Time elapsed = total exam time minus remaining time (clamped to ≥ 0)
    const elapsedSeconds = Math.max(
      0,
      (exam.total_time_minutes * 60) - (timeRemaining ?? 0)
    );

    useGamificationStore.getState().logActivity({
      vocabulary_learned: correctCount,
      study_duration_seconds: elapsedSeconds,
    }).catch((err) => {
      // Secondary system failure — do NOT disrupt the exam result screen.
      // The exam result is already committed; this is best-effort telemetry.
      console.error('Failed to log exam activity', err);
    });
  };

  const handleSubmit = () => {
    setModalConfig({
      isOpen: true,
      title: 'Nộp bài',
      message: 'Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể thay đổi đáp án.',
      onConfirm: () => {
        handleFinalSubmit();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReportQuestion = (dbId: number | string) => {
    setReportQuestionDbId(String(dbId));
    setIsGlobalReportModalOpen(true);
  };

  const handleLeave = () => {
    if (isSubmitted) {
      router.push(`/${language}/exam`);
      return;
    }

    // @ts-ignore
    const settings = exam?.exam_settings || {};
    const allowResume = settings.allow_resume !== false;
    const maxAttempts = settings.max_attempts || -1;

    if (!allowResume) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo thoát',
        message: 'Bài thi này KHÔNG cho phép làm lại. Nếu bạn thoát, toàn bộ kết quả sẽ bị hủy. Bạn có chắc chắn muốn thoát?',
        confirmText: 'Thoát và hủy bài',
        isDestructive: true,
        onConfirm: () => {
          clearExamState(examId);
          router.push(`/${language}/exam`);
        }
      });
      return;
    }

    if (maxAttempts === 1) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo thoát',
        message: 'Bạn chỉ có 1 lượt làm bài duy nhất. Việc thoát có thể ảnh hưởng đến lượt thi của bạn. Bạn vẫn muốn thoát?',
        confirmText: 'Vẫn thoát',
        isDestructive: true,
        onConfirm: () => {
          router.push(`/${language}/exam`);
        }
      });
      return;
    }

    router.push(`/${language}/exam`);
  };

  const handlePlayMainAudio = () => {
    if (activeSegmentId && segmentAudioRef.current) {
      segmentAudioRef.current.pause();
      setActiveSegmentId(null);
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = examSpeed;
      audioRef.current.volume = examVolume;
      audioRef.current.play().catch(console.error);
    }
  };

  const handlePauseMainAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const playSegmentAudio = (questionId: string, startTime: string, endTime: string) => {
    if (isMainAudioPlaying && audioRef.current) {
      audioRef.current.pause();
    }

    if (segmentAudioRef.current) {
      segmentAudioRef.current.pause();
      segmentAudioRef.current.currentTime = timeToSeconds(startTime) || 0;
      activeSegmentEndTimeRef.current = timeToSeconds(endTime);

      segmentAudioRef.current.playbackRate = examSpeed;
      segmentAudioRef.current.volume = examVolume;

      segmentAudioRef.current.play().catch(console.error);
      setActiveSegmentId(questionId);
    }
  };

  const stopSegmentAudio = () => {
    if (segmentAudioRef.current) {
      segmentAudioRef.current.pause();
      setActiveSegmentId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="p-8 text-center">Đang tải bài thi...</div>;
  if (error || !exam) return <div className="p-8 text-center text-red-500">{error}</div>;

  const mainAudioUrl = exam.sections?.find(s => s.section_audio_url)?.section_audio_url;
  const allQuestions = exam.sections?.flatMap(s => s.questions) || [];

  return (
    <div className="w-full p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8">

        {/* Left Column: Exam Content */}
        <div className="flex-1 bg-surface rounded-[2rem] p-6 shadow-sm border border-outline">
          <button onClick={handleLeave} className="text-secondary hover:text-primary mb-6 flex items-center gap-2">
            &larr; Quay lại danh sách
          </button>

          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold text-primary">{exam.exam_name}</h1>
          </div>
          <div className="flex flex-wrap gap-4 text-secondary mb-8 pb-6 border-b">
            <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
              Thời gian: {timeRemaining !== null ? formatTime(timeRemaining) : `${exam.total_time_minutes}:00`}
            </span>
            <span>•</span>
            <span>{exam.total_questions} câu</span>
            <span>•</span>
            <span>Điểm đạt: {exam.passing_score}/{exam.total_score}</span>
          </div>

          {mainAudioUrl && (
            <div className="mb-8 p-6 bg-primary/5 rounded-2xl border border-primary/20 shadow-sm">
              <h2 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                🎧 Audio Toàn Bài Thi
              </h2>

              {/* Hidden native audio for main */}
              <audio
                ref={audioRef}
                src={getMediaUrl(mainAudioUrl)}
                onTimeUpdate={(e) => setMainAudioCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => setIsMainAudioPlaying(false)}
                onPause={() => setIsMainAudioPlaying(false)}
                onPlay={() => setIsMainAudioPlaying(true)}
                className="hidden"
              />

              {/* Hidden native audio for segments */}
              <audio
                ref={segmentAudioRef}
                src={getMediaUrl(mainAudioUrl)}
                onTimeUpdate={(e) => {
                  if (activeSegmentEndTimeRef.current && e.currentTarget.currentTime >= activeSegmentEndTimeRef.current) {
                    e.currentTarget.pause();
                    setActiveSegmentId(null);
                  }
                }}
                onEnded={() => setActiveSegmentId(null)}
                className="hidden"
              />

              {/* Custom UI for Main Audio */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-outline">
                <button
                  onClick={isMainAudioPlaying ? handlePauseMainAudio : handlePlayMainAudio}
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-hover transition-colors"
                >
                  {isMainAudioPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${(mainAudioCurrentTime / (audioRef.current?.duration || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm font-bold text-secondary font-mono w-24 text-right">
                  {formatTime(Math.floor(mainAudioCurrentTime))} / {formatTime(Math.floor(audioRef.current?.duration || 0))}
                </div>
              </div>
            </div>
          )}


          <div className="space-y-12">
            {exam.sections?.map(section => (
              <div key={section.id} id={`section-${section.id}`} className="section-container" data-section-name={section.section_name}>
                <h2 className="text-xl font-bold text-primary mb-2">{section.section_name} - Part {section.part_number}</h2>
                {section.instruction && (
                  <div
                    className={`text-secondary mb-6 whitespace-pre-line leading-relaxed text-base ${section.section_name === 'Reading' || section.section_name?.toLowerCase().includes('reading')
                        ? 'not-italic font-normal text-primary'
                        : 'italic'
                      }`}
                    style={{ textAlign: 'justify' }}
                  >
                    {section.instruction}
                  </div>
                )}

                <div className="space-y-8">
                  {section.questions.map((question, index) => {
                    const isCorrect = answers[question.question_id] === question.correct_answer;
                    const isAnswered = !!answers[question.question_id];

                    return (
                      <div id={`question-${question.question_id}`} key={question.id} className={`p-6 rounded-2xl border scroll-m-24 ${isSubmitted ? (isCorrect ? 'border-green-300 bg-green-50/30' : 'border-red-300 bg-red-50/30') : 'border-outline-variant bg-surface'}`}>
                        <div className="space-y-4">
                          {/* Hàng 1: 3 cột: số câu hỏi, nút nghe câu này và dấu chấm than báo cáo */}
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex-shrink-0 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center">
                                {allQuestions.findIndex(q => q.question_id === question.question_id) + 1}
                              </div>

                              {(section.section_name === 'Reading' || section.section_name?.toLowerCase().includes('reading')) && (
                                <button
                                  onClick={() => {
                                    document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors focus:outline-none"
                                >
                                  Về đoạn văn
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {question.audio_start_time && question.audio_end_time && (
                                <button
                                  onClick={() => playSegmentAudio(question.question_id, question.audio_start_time, question.audio_end_time)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${activeSegmentId === question.question_id
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                    }`}
                                >
                                  {activeSegmentId === question.question_id ? (
                                    <>
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>

                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>

                                    </>
                                  )}
                                </button>
                              )}

                              {/* Báo cáo câu hỏi sai (Flag icon) */}
                              <button
                                onClick={() => handleReportQuestion(question.id)}
                                className="w-8 h-8 flex items-center justify-center text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-outline hover:border-red-200 focus:outline-none"
                                title="Báo cáo câu hỏi sai"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Hàng 2: Nội dung câu hỏi (chữ + ảnh) */}
                          {(question.question_text || question.image_url || question.image_description) && (
                            <div className="space-y-4">
                              {question.question_text && (
                                <p className="font-bold text-lg text-primary">
                                  {question.question_text}
                                </p>
                              )}

                              {question.image_url && (
                                <div className="w-full flex justify-center md:justify-start">
                                  <img
                                    src={getMediaUrl(question.image_url)}
                                    alt="Question Image"
                                    loading="lazy"
                                    className="w-full max-w-[480px] h-auto object-contain rounded-2xl shadow-sm border border-outline-variant cursor-zoom-in hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                      setLightboxImage(getMediaUrl(question.image_url));
                                      setLightboxZoom(1);
                                    }}
                                  />
                                </div>
                              )}

                              {!question.image_url && question.image_description && (
                                <div className="p-4 bg-gray-100 rounded-xl italic text-gray-600 max-w-xs text-center md:text-left">
                                  [Hình ảnh: {question.image_description}]
                                </div>
                              )}
                            </div>
                          )}


                          {/* Hàng 3: Các lựa chọn câu trả lời (Options / True-False / Fill Blank / Essay) */}
                          {question.question_type === 'true_false' ? (
                            <div className={`grid ${question.options.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2'} gap-4 w-full mt-4`}>
                              {question.options.map(opt => {
                                const selected = answers[question.question_id] === opt.option_id;
                                const hasText = !!opt.text;
                                const isTrue = opt.option_id === 'opt_True' || opt.text?.toUpperCase() === 'TRUE' || opt.text?.toUpperCase() === 'YES';

                                let btnClass = "flex items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer text-lg font-bold ";
                                if (isSubmitted) {
                                  if (opt.option_id === question.correct_answer) {
                                    btnClass += "bg-green-100 border-green-500 text-green-700 shadow-sm";
                                  } else if (selected && opt.option_id !== question.correct_answer) {
                                    btnClass += "bg-red-100 border-red-500 text-red-700 shadow-sm";
                                  } else {
                                    btnClass += "border-outline-variant bg-gray-50 text-gray-300 opacity-60";
                                  }
                                  btnClass = btnClass.replace("cursor-pointer", "cursor-default");
                                } else {
                                  btnClass += selected ? "border-primary bg-primary/10 text-primary scale-105 shadow-md" : "border-outline-variant bg-gray-100 hover:bg-gray-200 text-secondary";
                                }

                                return (
                                  <div key={opt.option_id || opt.id} className={btnClass} onClick={() => handleOptionSelect(question.question_id, opt.option_id)}>
                                    {hasText ? (
                                      <span>{opt.text}</span>
                                    ) : isTrue ? (
                                      <svg className="w-8 h-8 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                      <svg className="w-8 h-8 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : question.question_type === 'fill_blank' ? (
                            <div className="mt-4 w-full">
                              <input
                                type="text"
                                className={`w-full p-4 rounded-xl border-2 transition-all text-lg focus:outline-none ${isSubmitted
                                    ? ((question.correct_answer || '').trim().toLowerCase().split('/').map(ans => ans.trim()).includes(answers[question.question_id]?.trim().toLowerCase() || '')
                                      ? "bg-green-50 border-green-500 text-green-900 shadow-sm"
                                      : "bg-red-50 border-red-400 text-red-900")
                                    : "border-outline-variant bg-surface focus:border-primary"
                                  }`}
                                placeholder="Nhập câu trả lời của bạn..."
                                value={answers[question.question_id] || ''}
                                onChange={(e) => {
                                  if (!isSubmitted) {
                                    setAnswers(prev => ({ ...prev, [question.question_id]: e.target.value }));
                                  }
                                }}
                                disabled={isSubmitted}
                              />
                            </div>
                          ) : question.question_type === 'essay' ? (
                            <div className="mt-4 w-full">
                              <textarea
                                className="w-full p-4 rounded-xl border-2 border-outline-variant bg-surface focus:border-primary text-lg focus:outline-none min-h-[200px] resize-y"
                                placeholder="Viết bài luận của bạn tại đây (đáp ứng độ dài yêu cầu)..."
                                value={answers[question.question_id] || ''}
                                onChange={(e) => {
                                  if (!isSubmitted) {
                                    setAnswers(prev => ({ ...prev, [question.question_id]: e.target.value }));
                                  }
                                }}
                                disabled={isSubmitted}
                              />
                            </div>
                          ) : (
                            <div className={`mt-6 ${question.options.every(opt => !opt.text) ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'space-y-3'}`}>
                              {question.options.map((opt, optIndex) => {
                                const selected = answers[question.question_id] === opt.option_id;
                                const isImageOnly = !opt.text;

                                let optionClass = `relative flex ${isImageOnly ? 'flex-row items-center gap-4 p-3' : 'items-center gap-4 p-4'} rounded-2xl border-2 cursor-pointer transition-all `;

                                if (isSubmitted) {
                                  if (opt.option_id === question.correct_answer) {
                                    optionClass += "bg-green-50 border-green-500 text-green-900 shadow-sm";
                                  } else if (selected && opt.option_id !== question.correct_answer) {
                                    optionClass += "bg-red-50 border-red-400 text-red-900";
                                  } else {
                                    optionClass += "border-outline-variant opacity-60 bg-surface";
                                  }
                                  optionClass = optionClass.replace("cursor-pointer", "cursor-default");
                                } else {
                                  optionClass += selected ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-outline-variant hover:border-primary/40 hover:bg-hover-bg bg-surface";
                                }

                                const letter = String.fromCharCode(65 + optIndex); // A, B, C...

                                return (
                                  <div key={opt.option_id || opt.id} className={optionClass} onClick={() => handleOptionSelect(question.question_id, opt.option_id)}>
                                    {isImageOnly ? (
                                      <>
                                        <div className="w-8 h-8 flex-shrink-0 bg-secondary/10 text-secondary font-bold rounded-full flex items-center justify-center">
                                          {letter}
                                        </div>
                                        <div className="flex-1 aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                                          {opt.image_url ? (
                                            <img
                                              src={getMediaUrl(opt.image_url)}
                                              alt="Option"
                                              loading="lazy"
                                              className="w-full h-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxImage(getMediaUrl(opt.image_url));
                                                setLightboxZoom(1);
                                              }}
                                            />
                                          ) : opt.image_description ? (
                                            <span className="italic text-gray-500 text-xs p-4 text-center">[{opt.image_description}]</span>
                                          ) : null}
                                        </div>
                                        {isSubmitted && opt.option_id === question.correct_answer && (
                                          <div className="absolute inset-[-4px] border-[4px] border-green-500 rounded-2xl pointer-events-none z-20"></div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-primary bg-primary/20' : 'border-gray-300'}`}>
                                          {selected && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                                        </div>
                                        <div className="flex-1 text-lg">
                                          {opt.text}
                                          {opt.image_url && (
                                            <div className="mt-3 flex justify-center md:justify-start">
                                              <img
                                                src={getMediaUrl(opt.image_url)}
                                                alt="Option"
                                                loading="lazy"
                                                className="w-32 h-auto object-contain rounded-xl border border-gray-200 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
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

                          {/* Hàng 4: Giải thích đáp án */}
                          {isSubmitted && exam.show_explanation_after === 'exam_submitted' && (
                            <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-sm">
                              <p className="font-bold mb-1">Giải thích:</p>
                              {question.question_type === 'fill_blank' && (
                                <p className="mb-2"><strong>Đáp án đúng:</strong> <span className="text-green-700 font-semibold">{question.correct_answer}</span></p>
                              )}
                              {question.audio_script && <p className="mb-2"><strong>Audio script:</strong> {question.audio_script}</p>}
                              <p>{question.explanation || 'Không có giải thích chi tiết.'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Navigation Sidebar */}
        <div className="w-full xl:w-96 flex-shrink-0">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col gap-6">
            <div className="bg-surface rounded-[2rem] p-6 shadow-sm border border-outline flex flex-col min-h-0">
              <h2 className="text-xl font-bold text-primary mb-4 flex-shrink-0 flex items-center justify-between">
                <span>Danh sách câu hỏi</span>
                <span className="text-sm font-normal text-secondary bg-gray-100 px-3 py-1 rounded-full">
                  {Object.keys(answers).length} / {exam.total_questions}
                </span>
              </h2>

              <div className="flex-1 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="flex flex-wrap gap-2">
                  {allQuestions.map((q, idx) => {
                    const isAnswered = !!answers[q.question_id];
                    const isCorrect = answers[q.question_id] === q.correct_answer;

                    let btnClass = "w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center border-2 transition-all duration-200 ";

                    if (isSubmitted) {
                      if (isCorrect) btnClass += " bg-green-100 text-green-700 border-green-400";
                      else btnClass += " bg-red-100 text-red-700 border-red-400";
                    } else {
                      if (isAnswered) btnClass += " bg-primary text-white border-primary shadow-sm transform hover:scale-105";
                      else btnClass += " bg-white text-secondary border-outline-variant hover:border-primary";
                    }

                    return (
                      <button
                        key={`nav-q-${q.question_id}`}
                        onClick={() => {
                          document.getElementById(`question-${q.question_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={btnClass}
                        title={isSubmitted ? (isCorrect ? 'Đúng' : 'Sai') : (isAnswered ? 'Đã làm' : 'Chưa làm')}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {!isSubmitted ? (
                  <div className="mt-8 pt-6 border-t border-outline">
                    <button
                      onClick={handleSubmit}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95"
                    >
                      Nộp Bài
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 pt-6 border-t border-outline">
                    <div className={`p-4 rounded-xl shadow-inner border ${score >= exam.passing_score ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      <h2 className="text-xl font-bold mb-2">Kết quả bài thi</h2>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-black">{score}</span>
                        <span className="text-base opacity-70">/ {exam.total_score} điểm</span>
                      </div>
                      <p className="text-sm font-medium leading-snug">{score >= exam.passing_score ? '🎉 Chúc mừng! Bạn đã đạt yêu cầu.' : 'Rất tiếc! Bạn chưa đạt điểm yêu cầu.'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer for Question List on Mobile/Tablet */}
      {isQuestionListOpen && (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsQuestionListOpen(false)} />
          {/* Content */}
          <div className="relative w-80 max-w-[90vw] h-full bg-surface border-l border-outline p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setIsQuestionListOpen(false)}
              className="absolute top-4 right-4 text-secondary hover:text-primary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-primary mb-4 pr-8 flex items-center justify-between">
              <span>Danh sách câu hỏi</span>
              <span className="text-sm font-normal text-secondary bg-gray-100 px-3 py-1 rounded-full">
                {Object.keys(answers).length} / {exam.total_questions}
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 pb-2">
              <div className="flex flex-wrap gap-2">
                {allQuestions.map((q, idx) => {
                  const isAnswered = !!answers[q.question_id];
                  const isCorrect = answers[q.question_id] === q.correct_answer;

                  let btnClass = "w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center border-2 transition-all duration-200 ";

                  if (isSubmitted) {
                    if (isCorrect) btnClass += " bg-green-100 text-green-700 border-green-400";
                    else btnClass += " bg-red-100 text-red-700 border-red-400";
                  } else {
                    if (isAnswered) btnClass += " bg-primary text-white border-primary shadow-sm";
                    else btnClass += " bg-white text-secondary border-outline-variant hover:border-primary";
                  }

                  return (
                    <button
                      key={`nav-drawer-q-${q.question_id}`}
                      onClick={() => {
                        document.getElementById(`question-${q.question_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setIsQuestionListOpen(false);
                      }}
                      className={btnClass}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {!isSubmitted ? (
                <div className="mt-8 pt-6 border-t border-outline">
                  <button
                    onClick={() => {
                      setIsQuestionListOpen(false);
                      handleSubmit();
                    }}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-md"
                  >
                    Nộp Bài
                  </button>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-outline">
                  <div className={`p-4 rounded-xl shadow-inner border ${score >= exam.passing_score ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <h2 className="text-xl font-bold mb-2">Kết quả bài thi</h2>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-black">{score}</span>
                      <span className="text-base opacity-70">/ {exam.total_score} điểm</span>
                    </div>
                    <p className="text-sm font-medium leading-snug">{score >= exam.passing_score ? '🎉 Chúc mừng! Bạn đã đạt yêu cầu.' : 'Rất tiếc! Bạn chưa đạt điểm yêu cầu.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating 9-squares button on Mobile/Tablet */}
      <button
        onClick={() => setIsQuestionListOpen(true)}
        className="xl:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 p-3 bg-primary text-white border border-r-0 border-primary/20 rounded-l-2xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center"
        title="Danh sách câu hỏi"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
        </svg>
      </button>

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
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Floating Button for Reading Sidebar */}
      {showReadingSidebarButton && (
        <button
          onClick={() => setIsReadingDrawerOpen(true)}
          className="fixed right-0 top-[calc(50%+60px)] xl:top-1/2 -translate-y-1/2 z-40 p-3 bg-secondary text-white border border-r-0 border-secondary/20 rounded-l-2xl shadow-xl hover:bg-secondary-hover active:scale-95 transition-all flex items-center justify-center gap-1.5"
          title="Danh sách câu hỏi phần Đọc"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="hidden xl:inline text-[10px] font-bold [writing-mode:vertical-rl] rotate-180 py-1">Đọc</span>
        </button>
      )}

      {/* Reading Section Sidebar Drawer (Interactive Answer Sheet) */}
      {isReadingDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsReadingDrawerOpen(false)} />
          {/* Drawer Content */}
          <div className="relative w-96 max-w-[95vw] h-full bg-surface border-l border-outline p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setIsReadingDrawerOpen(false)}
              className="absolute top-4 right-4 text-secondary hover:text-primary z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-primary mb-6 pr-8 flex items-center justify-between">
              <span>Bảng Trả Lời (Đọc)</span>
              <span className="text-sm font-normal text-secondary bg-gray-100 px-3 py-1 rounded-full">
                {Object.keys(answers).filter(k => allQuestions.find(q => q.question_id === k)?.tags?.includes('reading')).length} / {allQuestions.filter(q => q.tags?.includes('reading')).length}
              </span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full space-y-6">
              {exam.sections?.filter(s => {
                const name = s.section_name?.toLowerCase() || '';
                return name.includes('reading') || name.includes('read') || name.includes('đọc') || name.includes('阅读');
              }).map((sec) => (
                <div key={`reading-draw-sec-${sec.id}`} className="mb-6 border-b pb-6 last:border-b-0">
                  <h3 className="text-xs font-bold text-secondary mb-4 uppercase tracking-wider bg-gray-50 p-3 rounded-xl border">
                    {sec.section_name} - Part {sec.part_number}
                  </h3>
                  <div className="space-y-6">
                    {sec.questions.map((q) => {
                      const isAnswered = !!answers[q.question_id];
                      const isCorrect = answers[q.question_id] === q.correct_answer;
                      const overallIndex = allQuestions.findIndex(allQ => allQ.question_id === q.question_id) + 1;

                      return (
                        <div key={`draw-q-card-${q.question_id}`} className="p-4 bg-gray-50/50 rounded-2xl border border-outline-variant space-y-3">
                          {/* Question header with jump button */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-secondary text-sm">Câu {overallIndex}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  if (window.innerWidth < 1280) {
                                    setIsReadingDrawerOpen(false);
                                  }
                                }}
                                className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5"
                              >
                                📖 Đoạn văn
                              </button>
                              <span className="text-gray-300 text-xs">|</span>
                              <button
                                onClick={() => {
                                  document.getElementById(`question-${q.question_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  if (window.innerWidth < 1280) {
                                    setIsReadingDrawerOpen(false);
                                  }
                                }}
                                className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5"
                              >
                                Câu hỏi &darr;
                              </button>
                            </div>
                          </div>

                          {/* Question text preview */}
                          <p className="text-xs text-primary font-medium leading-relaxed whitespace-pre-line">
                            {q.question_text}
                          </p>

                          {/* Answer Choice Panel inside Drawer */}
                          {q.question_type === 'true_false' ? (
                            <div className="flex flex-wrap gap-2 w-full mt-2">
                              {q.options.map(opt => {
                                const isOptSelected = answers[q.question_id] === opt.option_id;
                                let btnClass = "flex-1 text-center py-2 px-3 rounded-lg border text-xs font-bold transition-all ";

                                if (isSubmitted) {
                                  if (opt.option_id === q.correct_answer) {
                                    btnClass += "bg-green-100 border-green-500 text-green-700";
                                  } else if (isOptSelected && opt.option_id !== q.correct_answer) {
                                    btnClass += "bg-red-100 border-red-500 text-red-700";
                                  } else {
                                    btnClass += "border-gray-200 text-gray-400 opacity-60 bg-gray-50";
                                  }
                                } else {
                                  btnClass += isOptSelected
                                    ? "border-primary bg-primary text-white shadow-sm"
                                    : "border-gray-300 bg-white hover:bg-gray-100 text-secondary";
                                }

                                return (
                                  <button
                                    key={`draw-opt-${opt.option_id}`}
                                    onClick={() => handleOptionSelect(q.question_id, opt.option_id)}
                                    className={btnClass}
                                    disabled={isSubmitted}
                                  >
                                    {opt.text}
                                  </button>
                                );
                              })}
                            </div>
                          ) : q.question_type === 'multiple_choice' ? (
                            <div className="grid grid-cols-2 gap-2 w-full mt-2">
                              {q.options.map((opt, optIdx) => {
                                const isOptSelected = answers[q.question_id] === opt.option_id;
                                const letter = String.fromCharCode(65 + optIdx);
                                let btnClass = "flex items-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all text-left ";

                                if (isSubmitted) {
                                  if (opt.option_id === q.correct_answer) {
                                    btnClass += "bg-green-100 border-green-500 text-green-700 font-bold";
                                  } else if (isOptSelected && opt.option_id !== q.correct_answer) {
                                    btnClass += "bg-red-100 border-red-500 text-red-700 font-bold";
                                  } else {
                                    btnClass += "border-gray-200 text-gray-400 opacity-60 bg-gray-50";
                                  }
                                } else {
                                  btnClass += isOptSelected
                                    ? "border-primary bg-primary text-white shadow-sm"
                                    : "border-gray-300 bg-white hover:bg-gray-100 text-secondary";
                                }

                                return (
                                  <button
                                    key={`draw-mc-opt-${opt.option_id}`}
                                    onClick={() => handleOptionSelect(q.question_id, opt.option_id)}
                                    className={btnClass}
                                    disabled={isSubmitted}
                                    title={opt.text}
                                  >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isOptSelected && !isSubmitted ? 'bg-white/20 text-white' : 'bg-gray-100 text-secondary'}`}>
                                      {letter}
                                    </span>
                                    <span className="truncate flex-1">{opt.text}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : q.question_type === 'fill_blank' ? (
                            <div className="mt-2">
                              <input
                                type="text"
                                className={`w-full p-2.5 rounded-xl border-2 transition-all text-xs focus:outline-none ${isSubmitted
                                    ? ((q.correct_answer || '').trim().toLowerCase().split('/').map(ans => ans.trim()).includes(answers[q.question_id]?.trim().toLowerCase() || '')
                                      ? "bg-green-50 border-green-500 text-green-900 shadow-sm"
                                      : "bg-red-50 border-red-400 text-red-900")
                                    : "border-outline-variant bg-surface focus:border-primary"
                                  }`}
                                placeholder="Nhập câu trả lời..."
                                value={answers[q.question_id] || ''}
                                onChange={(e) => {
                                  if (!isSubmitted) {
                                    setAnswers(prev => ({ ...prev, [q.question_id]: e.target.value }));
                                  }
                                }}
                                disabled={isSubmitted}
                              />
                              {isSubmitted && (
                                <div className="mt-1 text-[10px] font-semibold text-green-600">
                                  Đáp án đúng: {q.correct_answer}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal with Zoom */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 z-10 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Zoom controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-4 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
            <button
              onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
              className="text-white hover:text-primary-light font-bold text-xl px-2 focus:outline-none"
              title="Thu nhỏ"
            >
              ➖
            </button>
            <span className="text-white font-mono min-w-[60px] text-center flex items-center justify-center">
              {Math.round(lightboxZoom * 100)}%
            </span>
            <button
              onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
              className="text-white hover:text-primary-light font-bold text-xl px-2 focus:outline-none"
              title="Phóng to"
            >
              ➕
            </button>
            <button
              onClick={() => setLightboxZoom(1)}
              className="text-white hover:text-primary-light text-xs px-2 flex items-center focus:outline-none"
              title="Đặt lại"
            >
              Reset
            </button>
          </div>

          {/* Image container */}
          <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
            <img
              src={lightboxImage}
              alt="Zoomed Chart"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl transition-transform duration-200"
              style={{
                transform: `scale(${lightboxZoom})`,
                cursor: lightboxZoom > 1 ? 'grab' : 'zoom-in'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
