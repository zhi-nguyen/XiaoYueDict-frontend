"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useAuthStore } from '@/store/useAuthStore';
import AuthModal from '@/components/auth/AuthModal';
import { checkGeneralWriting } from '@/lib/api/deepPractice';
import { Loader2 } from 'lucide-react';
import { useCoinStore } from '@/store/useCoinStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getPendingWritingTask, getWritingTaskDetail } from '@/lib/api/coins';

export default function WritingPage() {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const tier = useSubscriptionStore((state) => state.tier);
  const { wallets, config: coinConfig, fetchWalletBalances, fetchCoinConfig } = useCoinStore();
  const balance = language === 'zh' ? wallets.zh.total : wallets.en.total;
  const langName = language === 'zh' ? 'Linh Thạch' : 'Coin';

  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletBalances();
      fetchCoinConfig();
    }
  }, [isAuthenticated, fetchWalletBalances, fetchCoinConfig]);

  // State recovery on mount: check if there's an active pending task
  useEffect(() => {
    if (!isAuthenticated) return;
    const checkPending = async () => {
      try {
        const res = await getPendingWritingTask(language, 'general');
        if (res.has_pending && res.task_id) {
          setPendingTaskId(res.task_id);
          setIsChecking(true);
          if (res.sentence) setText(res.sentence);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra tác vụ pending:", err);
      }
    };
    checkPending();
  }, [isAuthenticated, language]);

  // Polling fallback to check status periodically if we have a pending task
  useEffect(() => {
    if (!pendingTaskId) return;
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await getWritingTaskDetail(pendingTaskId);
        if (!isMounted) return;
        if (res.status === 'SUCCESS') {
          setResult(res.result);
          setIsChecking(false);
          setPendingTaskId(null);
          clearInterval(interval);
          fetchWalletBalances(true);
        } else if (res.status === 'FAILED') {
          setErrorMsg(res.error || "Gặp lỗi khi chấm điểm bài viết.");
          setIsChecking(false);
          setPendingTaskId(null);
          clearInterval(interval);
          fetchWalletBalances(true);
        }
      } catch (err) {
        console.error("Error polling writing task:", err);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pendingTaskId, fetchWalletBalances]);

  // WebSocket message receiver
  useWebSocket({
    onMessage: (msg) => {
      if (msg.type === 'general_writing_check_complete') {
        const payload = msg.payload as any;
        if (payload && (payload.task_id === pendingTaskId || payload.sentence === text.trim())) {
          setResult(payload.result);
          setIsChecking(false);
          setPendingTaskId(null);
          fetchWalletBalances(true);
        }
      } else if (msg.type === 'general_writing_check_failed') {
        const payload = msg.payload as any;
        if (payload && (payload.task_id === pendingTaskId)) {
          setErrorMsg(payload.error || "Gặp lỗi khi gửi yêu cầu chấm điểm.");
          setIsChecking(false);
          setPendingTaskId(null);
          fetchWalletBalances(true);
        }
      }
    }
  });

  const getLength = (val: string) => {
    if (language === 'zh') {
      return val.replace(/\s/g, '').length;
    } else {
      return val.trim().split(/\s+/).filter(Boolean).length;
    }
  };
  const currentLength = getLength(text);

  const calculateCost = () => {
    if (currentLength === 0) return 0;
    if (tier && tier !== 'Free') return 0; // VIP is free

    const baseCost = language === 'zh'
      ? (coinConfig?.writing_base_cost_zh ?? 1)
      : (coinConfig?.writing_base_cost_en ?? 1);
    const incrementCost = language === 'zh'
      ? (coinConfig?.writing_increment_cost_zh ?? 1)
      : (coinConfig?.writing_increment_cost_en ?? 1);

    if (currentLength < 50) return baseCost;
    return baseCost + (Math.floor((currentLength - 50) / 50) + 1) * incrementCost;
  };
  const cost = calculateCost();

  const handleCheck = async () => {
    if (!text.trim()) return;
    setIsChecking(true);
    setErrorMsg('');
    setResult(null);

    // Language validation
    if (language === 'zh') {
      if (!/[\u4e00-\u9fa5]/.test(text)) {
        setErrorMsg("Vui lòng viết đoạn văn bằng tiếng Trung (chữ Hán).");
        setIsChecking(false);
        return;
      }
      if (/[a-zA-Z]/.test(text)) {
        setErrorMsg("Đoạn văn viết tiếng Trung không được chứa các từ không phải tiếng Trung (chữ Latin).");
        setIsChecking(false);
        return;
      }
    } else if (language === 'en') {
      if (!/[a-zA-Z]/.test(text)) {
        setErrorMsg("Vui lòng viết đoạn văn bằng tiếng Anh.");
        setIsChecking(false);
        return;
      }
      if (/[\u4e00-\u9fa5]/.test(text)) {
        setErrorMsg("Đoạn văn viết tiếng Anh không được chứa chữ Trung Quốc.");
        setIsChecking(false);
        return;
      }
    }

    try {
      const response = await checkGeneralWriting(text.trim(), language);
      if (response.status === 'PENDING' && response.task_id) {
        setPendingTaskId(response.task_id);
      } else if (response.status === 'SUCCESS') {
        setResult(response.result);
        setIsChecking(false);
        fetchWalletBalances(true);
      } else {
        setErrorMsg("Không thể nhận diện kết quả từ hệ thống.");
        setIsChecking(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Gặp lỗi khi gửi yêu cầu chấm điểm.");
      }
      setIsChecking(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 pb-16">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-surface border border-outline rounded-[1.5rem] p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden bg-white">
          {/* Top border strip */}
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-sage to-secondary" />

          {!isAuthenticated ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <span className="material-symbols-outlined text-primary text-4xl font-bold">account_circle</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
                {language === 'zh' ? 'Luyện Viết Tiếng Trung' : 'Luyện Viết Tiếng Anh'}
              </h1>
              <p className="text-secondary text-sm max-w-md mb-8 leading-relaxed">
                Tính năng Luyện viết đoạn văn tự do và Nhận xét ngữ pháp chi tiết bằng AI chỉ dành cho thành viên của hệ thống. Vui lòng đăng nhập hoặc đăng ký tài khoản để bắt đầu học tập!
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Đăng nhập / Đăng ký
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-[32px] font-bold">edit_note</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                  {language === 'zh' ? 'Luyện Viết Tiếng Trung' : 'Luyện Viết Tiếng Anh'}
                </h1>
                <p className="text-secondary text-xs sm:text-sm max-w-md">
                  {language === 'zh'
                    ? 'Luyện tập viết các đoạn văn tiếng Trung tự do. AI sẽ nhận xét ngữ pháp, sửa lỗi và gợi ý cách viết tự nhiên hơn.'
                    : 'Luyện tập viết các đoạn văn tiếng Anh tự do. AI sẽ nhận xét ngữ pháp, sửa lỗi và gợi ý cách viết tự nhiên hơn.'}
                </p>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isChecking}
                className="w-full h-48 p-4 bg-slate-50 border border-outline rounded-xl mb-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none text-primary leading-relaxed text-sm transition-colors"
                placeholder={
                  language === 'zh'
                    ? "Nhập đoạn văn tiếng Trung của bạn vào đây..."
                    : "Nhập đoạn văn tiếng Anh của bạn vào đây..."
                }
              />

              {errorMsg && (
                <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
                {cost > 0 ? (
                  <div className="text-xs text-secondary flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-primary text-base">payments</span>
                    Chi phí: <span className="font-bold text-primary">{cost} {langName}</span>
                    <span className="opacity-60">•</span>
                    Số dư: <span className={`font-bold ${balance >= cost ? 'text-emerald-600' : 'text-red-500'}`}>{balance} {langName}</span>
                  </div>
                ) : (
                  <div className="text-xs text-secondary flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-emerald-600 text-base">workspace_premium</span>
                    VIP: Miễn phí chấm điểm
                  </div>
                )}
                
                <button
                  onClick={handleCheck}
                  disabled={isChecking || !text.trim() || (cost > 0 && balance < cost)}
                  className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Đang chấm điểm bài viết...
                    </>
                  ) : (
                    'Gửi để chấm điểm'
                  )}
                </button>
              </div>

              {result && (
                <div className="mt-8 p-6 bg-surface-container-low border border-outline rounded-2xl animate-in fade-in slide-in-from-top-3">
                  <div className="flex items-center justify-between border-b border-outline/50 pb-4 mb-4">
                    <span className="text-base font-bold text-primary">Kết quả AI đánh giá:</span>
                    <span
                      className={`text-lg font-bold px-3 py-1 rounded-full ${result.score >= 70
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}
                    >
                      {result.score}/100 Điểm
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <strong className="text-sm text-primary block mb-1">Nhận xét ngữ pháp:</strong>
                      <p className="text-sm text-primary leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-outline/40 select-all">
                        {result.feedback}
                      </p>
                    </div>

                    {result.suggestion && (
                      <div>
                        <strong className="text-sm text-emerald-700 block mb-1">💡 Gợi ý đoạn văn viết chuẩn:</strong>
                        <p className="text-sm text-emerald-950 font-medium italic bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 select-all whitespace-pre-line">
                          "{result.suggestion}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
