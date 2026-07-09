import React, { useState, useEffect } from 'react';
import { checkDeepPracticeWritingExercise } from '@/lib/api/deepPractice';
import { Loader2 } from 'lucide-react';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

interface DeepPracticeWriteTabProps {
  vocabulary: string;
  lang: string;
  onAnswered: (isCorrect: boolean, score: number) => void;
  onSkip?: () => void;
}

export default function DeepPracticeWriteTab({
  vocabulary,
  lang,
  onAnswered,
  onSkip,
}: DeepPracticeWriteTabProps) {
  const tier = useSubscriptionStore((state) => state.tier);
  const isFree = !tier || tier === 'Free';

  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const getWordCount = (val: string) => {
    if (!val.trim()) return 0;
    if (lang === 'en') {
      return val.trim().split(/\s+/).length;
    } else {
      return val.replace(/\s+/g, '').length;
    }
  };
  const wordCount = getWordCount(text);

  const targetLang = lang === 'en' ? 'en' : 'zh';

  const handleCheck = async () => {
    if (!text.trim()) return;
    setIsChecking(true);
    setErrorMsg('');
    setResult(null);

    // Basic client side validation: Check if sentence contains the vocabulary word
    const cleanedText = text.toLowerCase();
    const cleanedVocab = vocabulary.toLowerCase();
    if (!cleanedText.includes(cleanedVocab)) {
      setErrorMsg(`Câu viết của bạn phải chứa từ vựng mục tiêu: "${vocabulary}".`);
      setIsChecking(false);
      return;
    }

    // Language validation
    if (lang === 'zh') {
      if (!/[\u4e00-\u9fa5]/.test(text)) {
        setErrorMsg("Vui lòng viết câu bằng tiếng Trung (chữ Hán).");
        setIsChecking(false);
        return;
      }
      if (/[a-zA-Z]/.test(text)) {
        setErrorMsg("Câu viết tiếng Trung không được chứa các từ không phải tiếng Trung (chữ Latin).");
        setIsChecking(false);
        return;
      }
    } else if (lang === 'en') {
      if (!/[a-zA-Z]/.test(text)) {
        setErrorMsg("Vui lòng viết câu bằng tiếng Anh.");
        setIsChecking(false);
        return;
      }
      if (/[\u4e00-\u9fa5]/.test(text)) {
        setErrorMsg("Câu viết tiếng Anh không được chứa chữ Trung Quốc.");
        setIsChecking(false);
        return;
      }
    }

    const currentWordCount = getWordCount(text);
    if (currentWordCount > 30) {
      setErrorMsg(lang === 'en' 
        ? "Câu viết của bạn không được vượt quá 30 từ." 
        : "Câu viết của bạn không được vượt quá 30 chữ."
      );
      setIsChecking(false);
      return;
    }

    try {
      const response = await checkDeepPracticeWritingExercise(text.trim(), vocabulary, targetLang);
      if (response.status === 'SUCCESS') {
        setResult(response.result);
        onAnswered(response.result.is_correct, response.result.score);
        setIsChecking(false);
      }
      // If status is PENDING, we wait for WebSocket notification
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gặp lỗi khi gửi yêu cầu chấm điểm.");
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Match by word
      if (detail && detail.target_word === vocabulary && detail.sentence === text.trim()) {
        setResult(detail.result);
        onAnswered(detail.result.is_correct, detail.result.score);
        setIsChecking(false);
      }
    };

    const handleFailed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.target_word === vocabulary) {
        setErrorMsg(detail.error || "Kiểm tra câu viết thất bại.");
        setIsChecking(false);
      }
    };

    window.addEventListener('writing_check_complete', handleCompleted);
    window.addEventListener('writing_check_failed', handleFailed);

    return () => {
      window.removeEventListener('writing_check_complete', handleCompleted);
      window.removeEventListener('writing_check_failed', handleFailed);
    };
  }, [text, vocabulary, onAnswered]);

  if (isFree) {
    return (
      <div className="py-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <span className="material-symbols-outlined text-primary text-3xl font-bold">lock</span>
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Tính năng dành cho thành viên VIP</h3>
        <p className="text-sm text-secondary max-w-sm mb-6 leading-relaxed">
          Tính năng Đặt câu và Nhận xét ngữ pháp chi tiết bằng AI chỉ dành cho tài khoản VIP. Hãy nâng cấp để trải nghiệm!
        </p>

        <button
          onClick={() => {
            onAnswered(true, 100);
            onSkip?.();
          }}
          className="px-6 py-3.5 bg-secondary hover:bg-secondary/90 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none"
        >
          Bỏ Qua
        </button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">
        Đặt câu với từ "{vocabulary}":
      </h3>
      <p className="text-xs sm:text-sm text-secondary mb-4">
        Viết một câu có chứa từ vựng trên và nhấn nút kiểm tra để AI đánh giá ngữ pháp.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isChecking}
        rows={4}
        className="w-full p-4 rounded-xl border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-body-md text-body-md text-primary mb-1 shadow-sm transition-colors"
        placeholder={lang === 'en' ? "VD: I want to learn Chinese." : "VD: 我想学习汉语。"}
      />
      <div className="flex justify-end text-xs text-secondary mb-4 select-none">
        <span className={wordCount > 30 ? 'text-red-500 font-bold animate-pulse' : ''}>
          {wordCount}/30 {lang === 'en' ? 'từ' : 'chữ'}
        </span>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 mb-4">
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleCheck}
        disabled={isChecking || !text.trim() || wordCount > 30}
        className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isChecking ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang chấm điểm câu viết...
          </>
        ) : (
          'Kiểm tra ngữ pháp (AI)'
        )}
      </button>

      {result && (
        <div className="mt-6 p-5 bg-surface-container-low border border-outline rounded-xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between border-b border-outline/50 pb-3 mb-3">
            <span className="text-sm font-bold text-primary">Kết quả AI đánh giá:</span>
            <span className={`text-base font-bold px-2.5 py-0.5 rounded-full ${result.score >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
              }`}>
              {result.score}/100 Điểm
            </span>
          </div>

          <p className="text-sm text-primary mb-3 select-all">
            <strong>Nhận xét:</strong> {result.feedback}
          </p>

          {result.suggestion && (
            <div className="bg-white p-3 rounded-lg border border-outline/50 text-sm">
              <span className="font-bold text-emerald-700 block mb-0.5">💡 Câu gợi ý chuẩn:</span>
              <p className="text-primary italic select-all">"{result.suggestion}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
