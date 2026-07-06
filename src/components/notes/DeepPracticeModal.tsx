import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Word, FlashcardExercises } from '@/types/note';
import { fetchDeepPracticeExercises, completeDeepPracticeExercise } from '@/lib/api/deepPractice';
import { toggleWordMastered } from '@/lib/api/notes';
import { useGamificationStore } from '@/store/useGamificationStore';

import DeepPracticeVocabTab from './deepPractice/DeepPracticeVocabTab';
import DeepPracticeReadTab from './deepPractice/DeepPracticeReadTab';
import DeepPracticeListenTab from './deepPractice/DeepPracticeListenTab';
import DeepPracticeSpeakTab from './deepPractice/DeepPracticeSpeakTab';
import DeepPracticeWriteTab from './deepPractice/DeepPracticeWriteTab';
import DeepPracticeCompletion from './deepPractice/DeepPracticeCompletion';

interface DeepPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: Word;
  notebookId: string;
  lang: string;
  onMasteredChange?: (wordId: string, isMastered: boolean) => void;
}

export default function DeepPracticeModal({
  isOpen,
  onClose,
  word,
  notebookId,
  lang,
  onMasteredChange,
}: DeepPracticeModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [exercises, setExercises] = useState<FlashcardExercises | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Track completion of tabs (Tab 0 is vocab, auto completed)
  const [tabCompletion, setTabCompletion] = useState<boolean[]>([true, false, false, false, false]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadExercises = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const response = await fetchDeepPracticeExercises(word.vocabulary, lang);
        if (response.status === 'SUCCESS') {
          setExercises(response.exercises);
          setIsLoading(false);
        }
        // If status is PENDING, we wait for the WebSocket notification
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Không thể tải dữ liệu bài tập từ AI.");
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [isOpen, word.vocabulary, lang]);

  useEffect(() => {
    const handleReady = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.word === word.vocabulary && detail.lang === lang) {
        setExercises(detail.exercises);
        setIsLoading(false);
      }
    };

    const handleFailed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.word === word.vocabulary && detail.lang === lang) {
        setErrorMsg(detail.error || "Lỗi tạo bài tập từ AI.");
        setIsLoading(false);
      }
    };

    window.addEventListener('flashcard_exercises_ready', handleReady);
    window.addEventListener('flashcard_exercises_failed', handleFailed);

    return () => {
      window.removeEventListener('flashcard_exercises_ready', handleReady);
      window.removeEventListener('flashcard_exercises_failed', handleFailed);
    };
  }, [word.vocabulary, lang]);

  const handleSkipExercise = async (type: 'reading' | 'listening', exerciseId: string) => {
    try {
      const tabIndex = type === 'reading' ? 1 : 2;
      setTabCompleted(tabIndex, false);
      setIsLoading(true);
      setErrorMsg('');

      // Mark current exercise as complete/skipped so we get a different one
      await completeDeepPracticeExercise(exerciseId);

      const response = await fetchDeepPracticeExercises(word.vocabulary, lang);
      if (response.status === 'SUCCESS') {
        setExercises(response.exercises);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to skip/change exercise:", err);
      setIsLoading(false);
    }
  };

  const handleReadAnswered = (isCorrect: boolean) => {
    setTabCompleted(1, isCorrect);
    if (isCorrect && exercises?.reading?.id) {
      completeDeepPracticeExercise(exercises.reading.id).catch((err) =>
        console.error("Failed to complete reading exercise:", err)
      );
    }
  };

  const handleListenAnswered = (isCorrect: boolean) => {
    setTabCompleted(2, isCorrect);
    if (isCorrect && exercises?.listening?.id) {
      completeDeepPracticeExercise(exercises.listening.id).catch((err) =>
        console.error("Failed to complete listening exercise:", err)
      );
    }
  };

  const handleNext = () => {
    if (activeTab < 4) {
      setActiveTab((prev) => prev + 1);
    } else {
      setShowCompletion(true);
    }
  };

  const handleBack = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setActiveTab(0);
    setTabCompletion([true, false, false, false, false]);
    setShowCompletion(false);
  };

  const handleMarkMastered = async () => {
    setIsSaving(true);
    try {
      await toggleWordMastered(notebookId, word.id, true);
      
      // Update Gamification Store client-side state
      try {
        const state = useGamificationStore.getState();
        useGamificationStore.setState({
          todayWords: state.todayWords + 1,
          weeklyHistory: state.weeklyHistory.map(point =>
            point.isToday ? { ...point, words: point.words + 1 } : point
          )
        });
      } catch (storeErr) {
        console.error("Failed to update gamification store locally:", storeErr);
      }

      if (onMasteredChange) {
        onMasteredChange(word.id, true);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update word status:", err);
      setIsSaving(false);
    }
  };

  const setTabCompleted = (idx: number, isCompleted: boolean) => {
    setTabCompletion((prev) => {
      const copy = [...prev];
      copy[idx] = isCompleted;
      return copy;
    });
  };

  const tabs = [
    { name: 'Từ vựng', icon: 'style' },
    { name: 'Đọc', icon: 'menu_book' },
    { name: 'Nghe', icon: 'headset' },
    { name: 'Nói', icon: 'mic' },
    { name: 'Viết', icon: 'edit' },
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 flashcard-glass-overlay animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative border border-outline/50">
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-surface-container-low shrink-0">
          <div
            className="h-full bg-sage transition-all duration-300"
            style={{ width: `${((activeTab + 1) / 5) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex border-b border-outline px-2 sm:px-4 pt-4 overflow-x-auto hide-scrollbar shrink-0 select-none bg-surface">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            const isCompleted = tabCompletion[idx];
            return (
              <button
                key={idx}
                onClick={() => {
                  // Allow clicking already completed tabs or tab 0
                  if (idx === 0 || tabCompletion[idx - 1] || isCompleted) {
                    setActiveTab(idx);
                  }
                }}
                className={`tab-btn flex-1 min-w-[44px] sm:min-w-[80px] pb-3 text-center border-b-2 font-headline-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex flex-col items-center gap-1 ${
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-secondary/60 border-transparent hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
          
          <button
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-primary hover:bg-hover-bg transition-colors flex items-center justify-center mb-3 ml-1 sm:ml-2 shrink-0 self-center border border-transparent hover:border-outline"
            title="Đóng Luyện tập sâu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 min-h-[350px] bg-white">
          {activeTab === 0 && (
            <DeepPracticeVocabTab
              vocabulary={word.vocabulary}
              pinyin={word.pinyin}
              meaning={word.meaning}
              note={word.note}
              lang={lang}
              onMarkMastered={handleMarkMastered}
            />
          )}
          {activeTab > 0 && isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-secondary font-medium">AI đang khởi tạo bài tập đa kỹ năng...</p>
              <p className="text-xs text-secondary/60 mt-1.5">Tiến trình này chỉ thực hiện 1 lần duy nhất cho mỗi từ vựng.</p>
            </div>
          )}
          {activeTab > 0 && !isLoading && errorMsg && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
              <p className="text-red-600 font-bold mb-4">{errorMsg}</p>
              <button
                onClick={() => onClose()}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm"
              >
                Đóng
              </button>
            </div>
          )}
          {activeTab === 1 && !isLoading && exercises?.reading && (
            <DeepPracticeReadTab
              key={exercises.reading.id}
              exercise={exercises.reading.content}
              onAnswered={handleReadAnswered}
              onSkip={() => handleSkipExercise('reading', exercises.reading.id)}
            />
          )}
          {activeTab === 2 && !isLoading && exercises?.listening && (
            <DeepPracticeListenTab
              key={exercises.listening.id}
              exercise={exercises.listening.content}
              audioUrl={exercises.listening.audio_url}
              lang={lang}
              onAnswered={handleListenAnswered}
              onSkip={() => handleSkipExercise('listening', exercises.listening.id)}
            />
          )}
          {activeTab === 3 && !isLoading && (
            <DeepPracticeSpeakTab
              vocabulary={word.vocabulary}
              pinyin={word.pinyin}
              lang={lang}
              onAnswered={(isCorrect) => setTabCompleted(3, isCorrect)}
              onSkip={() => {
                setTabCompleted(3, true);
                setActiveTab(4);
              }}
            />
          )}
          {activeTab === 4 && !isLoading && (
            <DeepPracticeWriteTab
              vocabulary={word.vocabulary}
              lang={lang}
              onAnswered={(isCorrect) => setTabCompleted(4, isCorrect)}
              onSkip={() => {
                setTabCompleted(4, true);
                setShowCompletion(true);
              }}
            />
          )}
        </div>

        {/* Footer Actions */}
        {(activeTab === 0 || (!isLoading && !errorMsg)) && (
          <div className="border-t border-outline p-4 flex justify-between items-center bg-white shrink-0">
            <button
              onClick={handleBack}
              disabled={activeTab === 0}
              className="px-5 py-2.5 rounded-xl border border-outline hover:bg-hover-bg text-secondary font-semibold text-sm transition-colors disabled:opacity-40"
            >
              Quay lại
            </button>
            
            <button
              onClick={handleNext}
              disabled={!tabCompletion[activeTab]}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-1.5 ${
                tabCompletion[activeTab]
                  ? 'bg-sage text-white hover:bg-emerald-700'
                  : 'bg-surface-container-high text-secondary/40 cursor-not-allowed border border-outline'
              }`}
            >
              Tiếp theo
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Completion Overlay */}
        {showCompletion && (
          <DeepPracticeCompletion
            word={word.vocabulary}
            onReset={handleReset}
            onMastered={handleMarkMastered}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
