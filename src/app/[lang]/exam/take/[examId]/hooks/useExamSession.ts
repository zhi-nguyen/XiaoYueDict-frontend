'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchExamDetails } from '@/lib/api/exams';
import { Exam, Section } from '@/types/exam';
import { saveExamState, loadExamState, clearExamState, ExamState } from '@/lib/examState';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const timeToSeconds = (timeStr: string | null | undefined): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(parseFloat);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
};

export function useExamSession() {
  const params = useParams();
  const router = useRouter();
  const examId = parseInt(params.examId as string, 10);
  const language = (params?.lang as string) || 'zh';

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const { examSpeed, examVolume } = useSettingsStore();

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeSegmentEndTimeRef = useRef<number | null>(null);

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
    onConfirm: () => {},
  });

  const [showReadingSidebarButton, setShowReadingSidebarButton] = useState(false);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [isReadingDrawerOpen, setIsReadingDrawerOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  // Sync settings to audios
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

  // Observer for showing Reading Sidebar Button
  useEffect(() => {
    if (!exam || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id')?.replace('section-', '');
            const targetSection = exam.sections?.find((s) => String(s.id) === sectionId || s.section_id === sectionId);
            const hasParagraphs = !!(targetSection?.paragraphs && targetSection.paragraphs.length > 0);
            if (hasParagraphs) {
              setShowReadingSidebarButton(true);
              setActiveSection(targetSection || null);
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

  // Load exam details and load saved state from localStorage
  useEffect(() => {
    async function loadExam() {
      try {
        const data = await fetchExamDetails(examId);
        setExam(data);
        if (typeof window !== 'undefined') {
          (window as any).__activeExam = data;
          window.dispatchEvent(new CustomEvent('exam-loaded'));
        }

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
      setTimeRemaining((prev) => {
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
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
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
      timeRemaining: timeRemaining || exam.total_time_minutes * 60,
      isSubmitted,
      lastSaved: Date.now(),
    });
  }, [answers, timeRemaining, isSubmitted, examId, exam]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    // Auto-scroll to next question
    if (exam && exam.sections) {
      const allQuestions = exam.sections.flatMap((s) => s.questions) || [];
      const currentIndex = allQuestions.findIndex((q) => q.question_id === questionId);
      if (currentIndex !== -1 && currentIndex + 1 < allQuestions.length) {
        const nextQuestion = allQuestions[currentIndex + 1];

        if (audioRef.current) {
          audioRef.current.pause();
        }

        setTimeout(() => {
          const element = document.getElementById(`mobile-question-${nextQuestion.question_id}`) || document.getElementById(`question-${nextQuestion.question_id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          if (nextQuestion.audio_start_time && nextQuestion.audio_end_time) {
            playSegmentAudio(
              nextQuestion.question_id,
              nextQuestion.audio_start_time,
              nextQuestion.audio_end_time
            );
          } else {
            if (segmentAudioRef.current) {
              segmentAudioRef.current.pause();
              setActiveSegmentId(null);
            }
          }
        }, 350);
      }
    }
  };

  const handleFinalSubmit = async () => {
    if (!exam || !exam.sections) return;

    const cleanAnswer = (str: string) => {
      return str
        .trim()
        .toLowerCase()
        .replace(/[.。!！?？]+$/, '')
        .trim();
    };

    let correctCount = 0;
    exam.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const isTextInput =
          q.question_type === 'fill_blank' ||
          (q.question_type === 'ordering' && (!q.options || q.options.length === 0));

        if (isTextInput) {
          const userAnsCleaned = cleanAnswer(answers[q.question_id] || '');
          const possibleAnswers = (q.correct_answer || '')
            .split('/')
            .map((ans) => cleanAnswer(ans));
          if (possibleAnswers.includes(userAnsCleaned)) {
            correctCount += q.points;
          }
        } else {
          if (answers[q.question_id] === q.correct_answer) {
            correctCount += q.points;
          }
        }
      });
    });

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
      score: correctCount,
    });

    const elapsedSeconds = Math.max(0, exam.total_time_minutes * 60 - (timeRemaining ?? 0));

    useGamificationStore
      .getState()
      .logActivity({
        vocabulary_learned: correctCount,
        study_duration_seconds: elapsedSeconds,
      })
      .catch((err) => {
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
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
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
        message:
          'Bài thi này KHÔNG cho phép làm lại. Nếu bạn thoát, toàn bộ kết quả sẽ bị hủy. Bạn có chắc chắn muốn thoát?',
        confirmText: 'Thoát và hủy bài',
        isDestructive: true,
        onConfirm: () => {
          clearExamState(examId);
          router.push(`/${language}/exam`);
        },
      });
      return;
    }

    if (maxAttempts === 1) {
      setModalConfig({
        isOpen: true,
        title: 'Cảnh báo thoát',
        message:
          'Bạn chỉ có 1 lượt làm bài duy nhất. Việc thoát có thể ảnh hưởng đến lượt thi của bạn. Bạn vẫn muốn thoát?',
        confirmText: 'Vẫn thoát',
        isDestructive: true,
        onConfirm: () => {
          router.push(`/${language}/exam`);
        },
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
      setIsMainAudioPlaying(true);
    }
  };

  const handlePauseMainAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsMainAudioPlaying(false);
    }
  };

  const playSegmentAudio = (questionId: string, startTime: string, endTime: string, customAudioUrl?: string) => {
    if (activeSegmentId === questionId && segmentAudioRef.current) {
      segmentAudioRef.current.pause();
      setActiveSegmentId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      setIsMainAudioPlaying(false);
    }

    if (segmentAudioRef.current) {
      segmentAudioRef.current.pause();

      const mainAudioUrl = exam?.sections?.find((s) => s.section_audio_url)?.section_audio_url || '';
      const targetSrc = customAudioUrl || mainAudioUrl;

      const currentSrc = segmentAudioRef.current.src;
      if (targetSrc && !currentSrc.endsWith(targetSrc)) {
        segmentAudioRef.current.src = targetSrc;
        segmentAudioRef.current.load();
      }

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

  // Register active exam globally and clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__activeExam;
        window.dispatchEvent(new CustomEvent('exam-loaded'));
      }
    };
  }, []);

  // Listen to sidebar triggers
  useEffect(() => {
    const handleSidebarLeave = () => {
      handleLeave();
    };
    const handleSidebarSubmit = () => {
      handleSubmit();
    };
    window.addEventListener('exam-sidebar-leave', handleSidebarLeave);
    window.addEventListener('exam-sidebar-submit', handleSidebarSubmit);
    return () => {
      window.removeEventListener('exam-sidebar-leave', handleSidebarLeave);
      window.removeEventListener('exam-sidebar-submit', handleSidebarSubmit);
    };
  }, [exam, isSubmitted, answers, timeRemaining]);

  return {
    examId,
    language,
    exam,
    loading,
    error,
    answers,
    setAnswers,
    isSubmitted,
    score,
    timeRemaining,
    audioRef,
    segmentAudioRef,
    activeSegmentEndTimeRef,
    isMainAudioPlaying,
    setIsMainAudioPlaying,
    activeSegmentId,
    setActiveSegmentId,
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
    handleFinalSubmit,
    handleReportQuestion,
    handleLeave,
    handlePlayMainAudio,
    handlePauseMainAudio,
    playSegmentAudio,
    stopSegmentAudio,
    formatTime,
  };
}
