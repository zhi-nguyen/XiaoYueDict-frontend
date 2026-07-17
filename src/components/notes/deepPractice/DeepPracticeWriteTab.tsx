import React, { useState, useEffect } from 'react';
import { checkDeepPracticeWritingExercise } from '@/lib/api/deepPractice';
import { Loader2 } from 'lucide-react';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useCoinStore } from '@/store/useCoinStore';
import { getPendingWritingTask, getWritingTaskDetail } from '@/lib/api/coins';

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
  const { wallets, config: coinConfig, fetchWalletBalances, fetchCoinConfig } = useCoinStore();
  
  const targetLang = lang === 'en' ? 'en' : 'zh';
  const balance = targetLang === 'zh' ? wallets.zh.total : wallets.en.total;
  const langName = targetLang === 'zh' ? 'Linh Thạch' : 'Coin';

  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const getWordCount = (val: string) => {
    if (!val.trim()) return 0;
    if (lang === 'en') {
      return val.trim().split(/\s+/).length;
    } else {
      return val.replace(/\s+/g, '').length;
    }
  };
  const wordCount = getWordCount(text);

  useEffect(() => {
    fetchWalletBalances();
    fetchCoinConfig();
  }, [fetchWalletBalances, fetchCoinConfig]);

  // Check for pending task matching this word on mount
  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await getPendingWritingTask(targetLang, 'deep_practice');
        if (res.has_pending && res.task_id && res.target_word === vocabulary) {
          setPendingTaskId(res.task_id);
          setIsChecking(true);
          if (res.sentence) setText(res.sentence);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra tác vụ pending deep practice:", err);
      }
    };
    checkPending();
  }, [vocabulary, targetLang]);

  // Fallback Polling
  useEffect(() => {
    if (!pendingTaskId) return;
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await getWritingTaskDetail(pendingTaskId);
        if (!isMounted) return;
        if (res.status === 'SUCCESS') {
          setResult(res.result);
          onAnswered(res.result.is_correct, res.result.score);
          setIsChecking(false);
          setPendingTaskId(null);
          clearInterval(interval);
          fetchWalletBalances(true);
        } else if (res.status === 'FAILED') {
          setErrorMsg(res.error || "Kiểm tra câu viết thất bại.");
          setIsChecking(false);
          setPendingTaskId(null);
          clearInterval(interval);
          fetchWalletBalances(true);
        }
      } catch (err) {
        console.error("Error polling deep practice task:", err);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pendingTaskId, onAnswered, fetchWalletBalances]);

  // WebSocket / CustomEvents integration
  useEffect(() => {
    const handleCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.target_word === vocabulary && (detail.task_id === pendingTaskId || detail.sentence === text.trim())) {
        setResult(detail.result);
        onAnswered(detail.result.is_correct, detail.result.score);
        setIsChecking(false);
        setPendingTaskId(null);
        fetchWalletBalances(true);
      }
    };

    const handleFailed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.target_word === vocabulary && (detail.task_id === pendingTaskId)) {
        setErrorMsg(detail.error || "Kiểm tra câu viết thất bại.");
        setIsChecking(false);
        setPendingTaskId(null);
        fetchWalletBalances(true);
      }
    };

    window.addEventListener('writing_check_complete', handleCompleted);
    window.addEventListener('writing_check_failed', handleFailed);

    return () => {
      window.removeEventListener('writing_check_complete', handleCompleted);
      window.removeEventListener('writing_check_failed', handleFailed);
    };
  }, [text, vocabulary, onAnswered, pendingTaskId, fetchWalletBalances]);

  const calculateCost = () => {
    if (!text.trim()) return 0;
    if (tier && tier !== 'Free') return 0; // VIP is free

    return targetLang === 'zh'
      ? (coinConfig?.writing_base_cost_zh ?? 1)
      : (coinConfig?.writing_base_cost_en ?? 1);
  };
  const cost = calculateCost();

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
      if (response.status === 'PENDING' && response.task_id) {
        setPendingTaskId(response.task_id);
      } else if (response.status === 'SUCCESS') {
        setResult(response.result);
        onAnswered(response.result.is_correct, response.result.score);
        setIsChecking(false);
        fetchWalletBalances(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Gặp lỗi khi gửi yêu cầu chấm điểm.");
      setIsChecking(false);
    }
  };

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

      <div className="flex flex-col gap-4 mt-2">
        {cost > 0 ? (
          <div className="text-xs text-secondary flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-primary text-base">payments</span>
            Chi phí: <span className="font-bold text-primary">{cost} {langName}</span>
            <span className="opacity-60">•</span>
            Số dư: <span className={`font-bold ${balance >= cost ? 'text-emerald-600' : 'text-red-500'}`}>{balance} {langName}</span>
          </div>
        ) : tier && tier !== 'Free' ? (
          <div className="text-xs text-secondary flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-emerald-600 text-base">workspace_premium</span>
            VIP: Miễn phí chấm điểm
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          {onSkip && (
            <button
              onClick={() => {
                onAnswered(true, 100);
                onSkip();
              }}
              disabled={isChecking}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-secondary font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50"
            >
              Bỏ Qua
            </button>
          )}
          <button
            onClick={handleCheck}
            disabled={isChecking || !text.trim() || wordCount > 30 || (cost > 0 && balance < cost)}
            className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-1" />
                Đang chấm điểm...
              </>
            ) : (
              'Kiểm tra ngữ pháp (AI)'
            )}
          </button>
        </div>
      </div>

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
