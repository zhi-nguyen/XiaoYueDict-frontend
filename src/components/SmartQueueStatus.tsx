'use client';

import React, { useState, useEffect } from 'react';
import type { QueueUiStrategy } from '@/types/queueUi';

interface SmartQueueStatusProps {
  phase: 'idle' | 'uploading' | 'queued' | 'processing' | 'error' | 'success' | 'completed';
  strategy: QueueUiStrategy;
  onRetry?: () => void;
  errorMessage?: string | null;
}

export default function SmartQueueStatus({
  phase,
  strategy,
  onRetry,
  errorMessage,
}: SmartQueueStatusProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTip, setCurrentTip] = useState('');

  // 1. Kích hoạt tự động bộ đếm thời gian dựa trên Phase của tiến trình
  useEffect(() => {
    if (['uploading', 'queued', 'processing'].includes(phase)) {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [phase]);

  // 2. Trích xuất ngẫu nhiên nội dung Tips khi tiến trình bước sang Giai đoạn 2 (giây thứ 3)
  useEffect(() => {
    if (elapsedSeconds === 3 && strategy?.tips?.length > 0) {
      const randomTip = strategy.tips[Math.floor(Math.random() * strategy.tips.length)];
      setCurrentTip(randomTip);
    }
  }, [elapsedSeconds, strategy?.tips]);

  if (phase === 'idle' || phase === 'success' || phase === 'completed') {
    return null;
  }

  // 3. Logic phân phối nội dung thông báo động theo các mốc thời gian
  let displayMessage = '';
  const { stage1 = [], stage2 = [], stage3 = [] } = strategy?.messages || {};

  if (elapsedSeconds < 3) {
    displayMessage = stage1.length > 0 ? stage1[elapsedSeconds % stage1.length] : 'Đang khởi tạo...';
  } else if (elapsedSeconds < 7) {
    displayMessage = stage2.length > 0 ? stage2[(elapsedSeconds - 3) % stage2.length] : 'Đang xử lý...';
  } else {
    displayMessage = stage3[0] || 'Vui lòng chờ trong giây lát...';
  }

  const isStage2 = elapsedSeconds >= 3 && elapsedSeconds < 7;
  const isStage3 = elapsedSeconds >= 7;

  return (
    <div className="animate-slide-up w-full">
      {phase === 'error' ? (
        // XỬ LÝ NGOẠI LỆ: Báo lỗi và Kêu gọi Hành động (Graceful Degradation - Hồng/Đỏ nhạt)
        <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-red-50/90 dark:bg-red-950/20 dark:border-red-900/30 p-6 shadow-sm transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <span className="material-symbols-outlined text-[22px]">error</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Gặp sự cố kết nối</h4>
              <p className="text-red-700 dark:text-red-400 text-xs mt-1 leading-relaxed">
                {strategy?.errorText || 'Kết nối với máy chủ AI bị gián đoạn.'}
              </p>
              {errorMessage && (
                <p className="text-red-500/80 dark:text-red-400/70 text-[11px] mt-1.5 font-mono italic bg-red-100/50 dark:bg-red-950/40 px-2 py-1 rounded border border-red-200/40">
                  Chi tiết: {errorMessage}
                </p>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] focus:outline-none"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Thử lại ngay
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // TRẠNG THÁI LOADING ĐA GIAI ĐOẠN (STAGE 1, 2, 3)
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-6 shadow-sm ${
            isStage3
              ? 'bg-amber-50/70 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/20 text-amber-900 dark:text-amber-300'
              : 'bg-surface border-outline'
          }`}
        >
          {/* Hiệu ứng shimmer nền cho giai đoạn 1 và 2 */}
          {!isStage3 && (
            <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />
          )}

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4">
              {/* Spinner xoay với hiệu ứng giảm sáng nhẹ ở Giai đoạn 2 */}
              <div
                className={`relative w-10 h-10 rounded-full bg-hover-bg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isStage2 ? 'opacity-65 blur-[0.3px]' : ''
                }`}
              >
                <svg
                  className={`animate-spin w-5 h-5 ${
                    isStage3 ? 'text-amber-500' : 'text-primary'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm leading-snug transition-all duration-300 ${
                    isStage3 ? 'text-amber-800 dark:text-amber-300 font-bold' : 'text-primary'
                  }`}
                >
                  {displayMessage}
                </p>
                <p className={`text-[11px] mt-0.5 ${isStage3 ? 'text-amber-700/80 dark:text-amber-400/70' : 'text-secondary'}`}>
                  Thời gian đã trôi qua: <span className="font-semibold">{elapsedSeconds} giây</span>
                </p>
              </div>
            </div>

            {/* Thanh tiến trình chuyển động mượt mà */}
            <div className="h-1.5 w-full bg-hover-bg dark:bg-outline/20 rounded-full overflow-hidden relative">
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  isStage3
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]'
                } ${isStage2 ? 'opacity-70 blur-[0.2px]' : ''} animate-pulse`}
              />
              <div className="absolute inset-0 animate-shimmer opacity-30" />
            </div>

            {/* GIAI ĐOẠN 2: THẺ TIPS HIỆU ỨNG FADE-IN */}
            {elapsedSeconds >= 3 && currentTip && (
              <div className="animate-fade-in flex gap-2.5 bg-amber-50/50 border border-amber-100/80 dark:bg-amber-950/20 dark:border-amber-900/30 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-sans">
                <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  lightbulb
                </span>
                <div>
                  <span className="font-bold block mb-0.5">Mẹo học thuật:</span>
                  {currentTip}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
