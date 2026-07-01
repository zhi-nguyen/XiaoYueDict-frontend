import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Word } from '@/types/note';
import { toggleWordMastered } from '@/lib/api/notes';
import { playTTSWithClientCache, prefetchTTS } from '@/lib/zhUtils';
import DeepPracticeModal from '@/components/notes/DeepPracticeModal';
import { useGamificationStore } from '@/store/useGamificationStore';

interface FlashcardPlayModalProps {
  isOpen: boolean;
  onClose: (masteredIds?: Set<string>) => void;
  words: Word[];
  notebookId: string;
  lang: string;
  onMasteredChange: (wordId: string, isMastered: boolean) => void;
}

type Mode = 'random' | 'unmastered' | 'review';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FlashcardPlayModal({
  isOpen,
  onClose,
  words,
  notebookId,
  lang,
  onMasteredChange,
}: FlashcardPlayModalProps) {
  // Navigation steps: 'config' | 'play' | 'completed'
  const [step, setStep] = useState<'config' | 'play' | 'completed'>('config');

  // Config States
  const [selectedMode, setSelectedMode] = useState<Mode>('random');
  const [selectedLimit, setSelectedLimit] = useState<number | 'all'>(10);

  // Play States
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeDeepPracticeWord, setActiveDeepPracticeWord] = useState<Word | null>(null);

  // Interaction feedback states
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isMarkingMastered, setIsMarkingMastered] = useState(false);

  // Batch updates & localStorage resume states
  const [interactedMasteredIds, setInteractedMasteredIds] = useState<Set<string>>(new Set());
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedSessionData, setSavedSessionData] = useState<any>(null);

  const getSessionKey = () => `xiaoyue_flashcard_session_${notebookId}`;

  const saveSessionToLocalStorage = (
    currentIndexVal: number,
    sessionWordsVal: Word[],
    masteredSet: Set<string>
  ) => {
    try {
      const sessionData = {
        notebookId,
        selectedMode,
        selectedLimit,
        sessionWords: sessionWordsVal,
        currentIndex: currentIndexVal,
        interactedMasteredIds: Array.from(masteredSet),
        timestamp: Date.now()
      };
      localStorage.setItem(getSessionKey(), JSON.stringify(sessionData));
    } catch (e) {
      console.error("Failed to save session to localStorage:", e);
    }
  };

  const clearSessionFromLocalStorage = () => {
    try {
      localStorage.removeItem(getSessionKey());
    } catch (e) {
      console.error("Failed to clear session from localStorage:", e);
    }
  };

  // Load saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getSessionKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.notebookId === notebookId && parsed.sessionWords && parsed.sessionWords.length > 0) {
          setHasSavedSession(true);
          setSavedSessionData(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load session from localStorage:", e);
    }
  }, [notebookId]);

  // Prefetch next 2 words in the background when index or queue changes
  useEffect(() => {
    if (step === 'play' && sessionWords.length > 0) {
      for (let i = 1; i <= 2; i++) {
        const nextIdx = currentIndex + i;
        if (nextIdx < sessionWords.length) {
          const nextWord = sessionWords[nextIdx];
          prefetchTTS(nextWord.vocabulary, lang === 'en' ? 'en' : 'zh');
        }
      }
    }
  }, [currentIndex, sessionWords, step, lang]);

  const handleResumeSession = () => {
    if (!savedSessionData) return;
    setSelectedMode(savedSessionData.selectedMode);
    setSelectedLimit(savedSessionData.selectedLimit);
    setSessionWords(savedSessionData.sessionWords);
    setCurrentIndex(savedSessionData.currentIndex);
    setInteractedMasteredIds(new Set(savedSessionData.interactedMasteredIds));
    setStep('play');
    setHasSavedSession(false);
  };

  const handleDiscardSavedSession = () => {
    clearSessionFromLocalStorage();
    setHasSavedSession(false);
    setSavedSessionData(null);
  };

  const handleClose = () => {
    onClose(interactedMasteredIds);
  };

  // Compute available word counts for configuration preview
  const countTotal = words.length;
  const countUnmastered = words.filter(w => !w.is_mastered).length;
  const countMastered = words.filter(w => w.is_mastered).length;

  // Initialize Speech synthesis or cache tts
  const playWordAudio = (wordText: string) => {
    setIsPlayingAudio(true);
    playTTSWithClientCache(
      wordText,
      lang === 'en' ? 'en' : 'zh',
      undefined,
      () => setIsPlayingAudio(false)
    ).catch((err) => {
      console.warn("Failed to play TTS audio:", err);
      setIsPlayingAudio(false);
    });
  };

  const handleStartSession = () => {
    setConfigError(null);
    let filtered = [...words];

    if (selectedMode === 'unmastered') {
      filtered = words.filter(w => !w.is_mastered);
    } else if (selectedMode === 'review') {
      filtered = words.filter(w => w.is_mastered);
    }

    if (filtered.length === 0) {
      if (selectedMode === 'unmastered') {
        setConfigError("Sổ tay này hiện tại không có từ vựng nào chưa thuộc.");
      } else if (selectedMode === 'review') {
        setConfigError("Sổ tay này hiện tại chưa có từ vựng nào đã thuộc để ôn tập.");
      } else {
        setConfigError("Sổ tay này trống, vui lòng thêm từ vựng trước.");
      }
      return;
    }

    // Shuffle words
    let shuffled = shuffleArray(filtered);

    // Limit words
    if (selectedLimit !== 'all') {
      shuffled = shuffled.slice(0, selectedLimit);
    }

    setSessionWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setInteractedMasteredIds(new Set());
    setStep('play');

    // Save session progress
    saveSessionToLocalStorage(0, shuffled, new Set());

    // Auto play audio of first word
    setTimeout(() => {
      if (shuffled.length > 0) {
        playWordAudio(shuffled[0].vocabulary);
      }
    }, 400);
  };

  const handleNextCard = (updatedMasteredIds?: Set<string>) => {
    const currentMastered = updatedMasteredIds || interactedMasteredIds;
    setIsFlipped(false);
    setIsPlayingAudio(false);

    // Transition effect similar to temp design
    const cardEl = document.getElementById('play-card');
    if (cardEl) {
      cardEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'translateX(50px)';
    }

    setTimeout(() => {
      if (currentIndex + 1 < sessionWords.length) {
        setCurrentIndex(prev => prev + 1);
        const nextWord = sessionWords[currentIndex + 1];
        if (cardEl) {
          cardEl.style.transform = 'translateX(-50px)';
        }

        saveSessionToLocalStorage(currentIndex + 1, sessionWords, currentMastered);

        setTimeout(() => {
          if (cardEl) {
            cardEl.style.opacity = '1';
            cardEl.style.transform = 'translateX(0)';
          }
          // Autoplay pronunciation for the next word
          playWordAudio(nextWord.vocabulary);
        }, 50);
      } else {
        clearSessionFromLocalStorage();
        setStep('completed');
      }
    }, 200);
  };

  const handleMarkMastered = async (wordId: string) => {
    if (isMarkingMastered) return;
    setIsMarkingMastered(true);
    try {
      await toggleWordMastered(notebookId, wordId, true);

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

      const updatedMastered = new Set(interactedMasteredIds);
      updatedMastered.add(wordId);
      setInteractedMasteredIds(updatedMastered);

      // Trigger success ping animation overlay
      setShowSuccessOverlay(true);
      setTimeout(() => setShowSuccessOverlay(false), 500);

      // Advance to next card
      handleNextCard(updatedMastered);
    } catch (err) {
      console.error("Lỗi khi đánh dấu từ đã thuộc:", err);
    } finally {
      setIsMarkingMastered(false);
    }
  };

  if (!isOpen) return null;

  const currentWord = sessionWords[currentIndex];

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 flashcard-glass-overlay overflow-y-auto animate-in fade-in duration-300">

      {/* Background Close Trigger */}
      <div className="absolute inset-0 cursor-pointer" onClick={handleClose} />

      {/* Success Feedback Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 pointer-events-none z-[1100] flex items-center justify-center bg-transparent animate-in fade-in duration-200">
          <div className="bg-emerald-500/10 p-12 rounded-full animate-ping border-4 border-emerald-500/20">
            <span className="material-symbols-outlined text-emerald-600 text-6xl">check_circle</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-outline/50 animate-in zoom-in-95 duration-300">

        {/* CONFIGURATION STEP */}
        {step === 'config' && (
          hasSavedSession && savedSessionData ? (
            <div className="p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto flex-1 w-full">
              <div className="flex justify-between items-center pb-4 border-b border-outline w-full text-left">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-primary">Tiếp tục học?</h2>
                  <p className="text-xs sm:text-sm text-secondary">Khôi phục phiên học trước đó của bạn</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-hover-bg text-secondary hover:text-primary transition-colors border border-transparent hover:border-outline"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-4 text-center max-w-sm mx-auto w-full my-auto">
                <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">restore</span>
                </div>
                <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                  Hệ thống phát hiện phiên học Flashcard trước đó chưa hoàn thành.
                </p>
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/40 text-xs sm:text-sm text-secondary font-medium w-full space-y-1.5 text-left">
                  <p>• Chế độ: <span className="font-bold text-primary">{savedSessionData.selectedMode === 'random' ? 'Ngẫu nhiên' : savedSessionData.selectedMode === 'unmastered' ? 'Chưa thuộc' : 'Ôn lại'}</span></p>
                  <p>• Tiến độ: <span className="font-bold text-primary">{savedSessionData.currentIndex + 1} / {savedSessionData.sessionWords.length} thẻ</span></p>
                  <p>• Số từ đã thuộc: <span className="font-bold text-primary">{savedSessionData.interactedMasteredIds?.length || 0} từ</span></p>
                </div>
                <div className="flex flex-col gap-3 justify-center w-full mt-2">
                  <button
                    onClick={handleResumeSession}
                    className="w-full py-3 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold text-sm transition-colors shadow-sm"
                  >
                    Tiếp tục học
                  </button>
                  <button
                    onClick={handleDiscardSavedSession}
                    className="w-full py-3 border border-outline text-secondary hover:bg-hover-bg rounded-xl font-bold text-sm transition-colors"
                  >
                    Học mới (Bỏ phiên cũ)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center pb-4 border-b border-outline">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-primary">Cấu hình Flashcard</h2>
                  <p className="text-xs sm:text-sm text-secondary">Tùy chỉnh chế độ ôn tập phù hợp với bạn</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-hover-bg text-secondary hover:text-primary transition-colors border border-transparent hover:border-outline"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {configError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-base">error</span>
                  <span>{configError}</span>
                </div>
              )}

              {/* Mode selection cards */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-primary block">1. Chọn chế độ ôn tập</label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('random')}
                    className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedMode === 'random'
                      ? 'border-primary bg-primary/[0.03] ring-1 ring-primary'
                      : 'border-outline hover:border-primary/50'
                      }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-primary block">Tạo Flashcard ngẫu nhiên</span>
                      <span className="text-xs text-secondary">Lấy ngẫu nhiên từ vựng trong sổ tay</span>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 text-secondary px-2.5 py-1 rounded-lg">
                      {countTotal} từ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('unmastered')}
                    className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedMode === 'unmastered'
                      ? 'border-primary bg-primary/[0.03] ring-1 ring-primary'
                      : 'border-outline hover:border-primary/50'
                      }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-primary block">Flashcard chưa thuộc</span>
                      <span className="text-xs text-secondary font-medium text-amber-600">Ôn tập các từ vựng bạn đánh dấu chưa thuộc</span>
                    </div>
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg">
                      {countUnmastered} từ
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('review')}
                    className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${selectedMode === 'review'
                      ? 'border-primary bg-primary/[0.03] ring-1 ring-primary'
                      : 'border-outline hover:border-primary/50'
                      }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-primary block">Ôn lại Flashcard</span>
                      <span className="text-xs text-secondary font-medium text-emerald-600 font-sans">Luyện tập lại các từ vựng bạn đã thuộc</span>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      {countMastered} từ
                    </span>
                  </button>
                </div>
              </div>

              {/* Word count limits */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-primary block">2. Số lượng từ vựng</label>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 20, 50, 'all'].map((limit) => {
                    const isActive = selectedLimit === limit;
                    return (
                      <button
                        key={limit}
                        type="button"
                        onClick={() => setSelectedLimit(limit as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${isActive
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-secondary border-outline hover:border-primary/50'
                          }`}
                      >
                        {limit === 'all' ? 'Tất cả' : `${limit} từ`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleStartSession}
                disabled={countTotal === 0}
                className="mt-4 w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">style</span>
                Bắt đầu học
              </button>
            </div>
          )
        )}

        {/* PLAY FLASHCARD STEP */}
        {step === 'play' && currentWord && (
          <div className="flex-1 flex flex-col p-6 sm:p-8 min-h-[460px] select-none justify-between gap-6 overflow-y-auto">

            {/* Header progress info */}
            <div className="flex justify-between items-center w-full shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-hover-bg flex items-center justify-center shadow-sm text-primary hover:bg-outline/25 transition-colors border border-outline/50"
                  title="Đóng Flashcard"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div>
                  <h2 className="font-bold text-primary text-base leading-tight">Đang học Flashcard</h2>
                  <p className="text-xs text-secondary font-medium">Còn lại {sessionWords.length - currentIndex} từ</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-bold text-primary">Tiến độ: {Math.round((currentIndex / sessionWords.length) * 100)}%</span>
                <div className="w-24 sm:w-32 h-1.5 bg-surface-container rounded-full overflow-hidden border border-outline/30">
                  <div
                    className="h-full bg-sage transition-all duration-300"
                    style={{ width: `${(currentIndex / sessionWords.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3D Flip Card Container */}
            <div className="flex-1 flex items-center justify-center my-2 min-h-[280px]">
              <div
                className={`group perspective-1000 w-full h-[280px] sm:h-[320px] cursor-pointer`}
                id="play-card"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`flip-card-inner relative w-full h-full preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>

                  {/* FRONT FACE (Word) */}
                  <div className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08)] border border-outline/50 flex flex-col items-center justify-center p-6 text-center">

                    {/* Audio pronunciation button on front */}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playWordAudio(currentWord.vocabulary);
                        }}
                        disabled={isPlayingAudio}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isPlayingAudio ? 'bg-sage/10 border-sage/35 text-sage' : 'bg-hover-bg border-outline text-secondary hover:text-primary hover:bg-outline/25'
                          }`}
                        title="Nghe phát âm"
                      >
                        {isPlayingAudio ? (
                          <Loader2 className="w-5 h-5 text-sage animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            volume_up
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <h2 className={`text-4xl sm:text-5xl font-extrabold text-primary tracking-wide select-all ${lang === 'zh' ? 'font-noto-sc' : ''}`}>
                        {currentWord.vocabulary}
                      </h2>
                      {currentWord.pinyin && (
                        <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 font-semibold text-sm rounded-full border border-emerald-100/50 tracking-wider">
                          {currentWord.pinyin}
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-5 flex items-center gap-2 text-secondary/60 text-xs font-semibold animate-pulse">
                      <span className="material-symbols-outlined text-sm">touch_app</span>
                      <span>Chạm để lật xem nghĩa</span>
                    </div>
                  </div>

                  {/* BACK FACE (Meaning) */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08)] border border-outline/50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-full flex flex-col gap-4 overflow-y-auto max-h-[240px] px-2 hide-scrollbar">
                      <div className="w-full">
                        <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest mb-1.5 text-center">Nghĩa tiếng Việt</p>
                        {(() => {
                          const meaningStr = currentWord.meaning || '';
                          const hasSemicolon = meaningStr.includes(';');
                          const wordCount = meaningStr.trim().split(/\s+/).filter(Boolean).length;

                          if (hasSemicolon || wordCount > 4) {
                            const parts = meaningStr.split(';').map(p => p.trim()).filter(Boolean);
                            return (
                              <div className="text-justify space-y-2 w-full mt-2">
                                {parts.map((part, idx) => (
                                  <p
                                    key={idx}
                                    className="text-base sm:text-lg font-semibold text-primary leading-relaxed"
                                    style={{ textIndent: '1.5rem', textAlign: 'justify' }}
                                  >
                                    {part.charAt(0).toUpperCase() + part.slice(1)}
                                  </p>
                                ))}
                              </div>
                            );
                          } else {
                            return (
                              <h3 className="text-2xl sm:text-3xl font-bold text-primary capitalize leading-tight text-center mt-2">
                                {meaningStr}
                              </h3>
                            );
                          }
                        })()}
                      </div>

                      <div className="w-12 h-0.5 bg-outline mx-auto rounded-full" />

                      {currentWord.note && (
                        <div className="text-left bg-surface-container-low p-3.5 rounded-xl border border-outline/40 text-xs sm:text-sm text-secondary font-medium select-all leading-relaxed">
                          <span className="block text-[10px] font-bold text-secondary/60 uppercase tracking-wider mb-1">Ghi chú / Ví dụ:</span>
                          {currentWord.note}
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-[2px] flex items-center gap-2 text-secondary/40 text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-xs">touch_app</span>
                      <span>Chạm để lật lại</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (Only shown when card is flipped or with transition opacity) */}
            <div className={`flex items-center gap-3 sm:gap-4 justify-center transition-all duration-300 w-full shrink-0 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-20 pointer-events-none'
              }`}>

              {/* Learning More: Opens deep practice 5tabs modal */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFlipped) return;
                  setActiveDeepPracticeWord(currentWord);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-outline text-secondary hover:text-primary rounded-2xl font-bold text-xs sm:text-sm hover:bg-hover-bg active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-orange-500 text-lg">refresh</span>
                <span>Học Thêm</span>
              </button>

              {/* Skip Card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFlipped) return;
                  handleNextCard();
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 text-secondary hover:text-primary rounded-full flex items-center justify-center hover:bg-outline/25 active:scale-90 transition-all border border-outline"
                title="Bỏ qua thẻ này"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </button>

              {/* Mastered Card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFlipped) return;
                  handleMarkMastered(currentWord.id);
                }}
                disabled={isMarkingMastered}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-sage text-white rounded-2xl font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                {isMarkingMastered ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                )}
                <span>Đã Thuộc</span>
              </button>

            </div>

          </div>
        )}

        {/* SESSION COMPLETED STEP */}
        {step === 'completed' && (
          <div className="p-6 sm:p-8 flex flex-col overflow-y-auto flex-1 w-full">
            <div className="my-auto w-full flex flex-col items-center text-center gap-5 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                <span className="material-symbols-outlined text-[36px] sm:text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  celebration
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-primary">Tuyệt vời!</h2>
                <p className="text-xs sm:text-sm text-secondary mt-1">Bạn đã hoàn thành phiên học Flashcard này.</p>
              </div>

              {/* Results Table */}
              <div className="w-full max-w-sm border border-outline/50 rounded-2xl overflow-hidden bg-surface-container-low shrink-0">
                <div className="grid grid-cols-2 border-b border-outline/40 bg-surface-container-high px-4 py-2.5 text-xs font-bold text-secondary text-left">
                  <span>Trạng thái</span>
                  <span className="text-right">Số lượng</span>
                </div>
                <div className="divide-y divide-outline/30 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 px-4 py-3 text-left">
                    <span className="font-medium text-secondary">Đã thuộc</span>
                    <span className="text-right font-bold text-emerald-600">{interactedMasteredIds.size} từ</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-3 text-left">
                    <span className="font-medium text-secondary">Bỏ qua / Chưa thuộc</span>
                    <span className="text-right font-bold text-secondary/70">{sessionWords.length - interactedMasteredIds.size} từ</span>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-3 text-left bg-surface-container-high/30 font-bold">
                    <span className="text-primary">Tổng số từ trong phiên</span>
                    <span className="text-right text-primary">{sessionWords.length} từ</span>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3 mt-2 justify-center max-w-sm shrink-0">
                <button
                  onClick={() => {
                    clearSessionFromLocalStorage();
                    setStep('config');
                    setInteractedMasteredIds(new Set());
                  }}
                  className="flex-1 py-3 px-5 border border-outline text-secondary hover:bg-hover-bg rounded-xl font-bold text-sm transition-colors"
                >
                  Học lại (Cấu hình mới)
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-5 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  Đóng (Cập nhật)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Render DeepPracticeModal inside if activeDeepPracticeWord is set */}
      {activeDeepPracticeWord && (
        <DeepPracticeModal
          isOpen={!!activeDeepPracticeWord}
          onClose={() => {
            // Once they close the deep practice modal, we return to the current word
            setActiveDeepPracticeWord(null);
          }}
          word={activeDeepPracticeWord}
          notebookId={notebookId}
          lang={lang}
          onMasteredChange={(wordId, isMastered) => {
            if (isMastered) {
              const nextMastered = new Set(interactedMasteredIds);
              nextMastered.add(wordId);
              setInteractedMasteredIds(nextMastered);

              setSessionWords(prev => prev.map(w => w.id === wordId ? { ...w, is_mastered: true } : w));

              // Trigger success ping animation overlay on Flashcard
              setShowSuccessOverlay(true);
              setTimeout(() => setShowSuccessOverlay(false), 500);

              // Close DeepPractice modal
              setActiveDeepPracticeWord(null);

              // Advance to next card and save session progress
              handleNextCard(nextMastered);
            }
          }}
        />
      )}

    </div>,
    document.body
  );
}
