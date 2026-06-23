'use client';

import React, { useState, useEffect } from 'react';
import type { QueueUiStrategy } from '@/types/queueUi';

interface SmartQueueStatusProps {
  phase: 'idle' | 'uploading' | 'queued' | 'processing' | 'error' | 'success' | 'completed';
  strategy: QueueUiStrategy;
  onRetry?: () => void;
  errorMessage?: string | null;
  errorType?: 'network' | 'validation' | 'processing' | 'rate_limit' | null;
}

export default function SmartQueueStatus({
  phase,
  strategy,
  onRetry,
  errorMessage,
  errorType = null,
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

  // 4. Phân tích lỗi (Error Classification) để hiển thị tiêu đề và nội dung phù hợp
  let effectiveErrorType = errorType;
  if (!effectiveErrorType && errorMessage) {
    const msg = errorMessage.toLowerCase();
    if (msg.includes('hạn mức') || msg.includes('lượt') || msg.includes('rate limit')) {
      effectiveErrorType = 'rate_limit';
    } else if (msg.includes('giọng nói') || msg.includes('ngắn') || msg.includes('dài') || msg.includes('hợp lệ') || msg.includes('định dạng') || msg.includes('invalid') || msg.includes('chính tả')) {
      effectiveErrorType = 'validation';
    } else if (msg.includes('kết nối') || msg.includes('mạng') || msg.includes('đường truyền') || msg.includes('network') || msg.includes('fetch')) {
      effectiveErrorType = 'network';
    } else {
      effectiveErrorType = 'processing';
    }
  }

  let errorTitle = 'Gặp sự cố kết nối';
  let errorDescription = strategy?.errorText || 'Kết nối với máy chủ AI bị gián đoạn.';

  if (effectiveErrorType === 'validation') {
    errorTitle = 'Lỗi dữ liệu đầu vào';
    errorDescription = 'Bản ghi âm hoặc văn bản mẫu không đáp ứng yêu cầu phân tích.';
  } else if (effectiveErrorType === 'rate_limit') {
    errorTitle = 'Vượt quá hạn mức';
    errorDescription = 'Tài khoản của bạn đã đạt giới hạn dung lượng tải lên trong ngày/giờ.';
  } else if (effectiveErrorType === 'processing') {
    errorTitle = 'Lỗi xử lý âm thanh';
    errorDescription = 'Có sự cố xảy ra trong quá trình tính toán điểm số tại máy chủ.';
  }

  return (
    <div className="animate-slide-up w-full">
      {phase === 'error' ? (
        // XỬ LÝ NGOẠI LỆ: Báo lỗi và Kêu gọi Hành động (Graceful Degradation - Hồng/Đỏ nhạt)
        <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <span className="material-symbols-outlined text-[22px]">error</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-sm">{errorTitle}</h4>
              <p className="text-red-700 text-xs mt-1 leading-relaxed">
                {errorDescription}
              </p>
              {errorMessage && (
                <div className="mt-2.5 p-3 rounded-xl bg-white border border-red-200/60 text-red-800 text-xs leading-relaxed font-medium">
                  Chi tiết: {errorMessage}
                </div>
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
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-surface border-outline'
          }`}
        >
          {/* Hiệu ứng shimmer nền cho giai đoạn 1 và 2 */}
          {!isStage3 && (
            <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />
          )}

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm leading-snug transition-all duration-300 ${
                    isStage3 ? 'text-amber-900 font-bold' : 'text-primary'
                  }`}
                >
                  {displayMessage}
                </p>
                <p className={`text-[11px] mt-0.5 ${isStage3 ? 'text-amber-800' : 'text-secondary'}`}>
                  Thời gian đã trôi qua: <span className="font-semibold">{elapsedSeconds} giây</span>
                </p>
              </div>
            </div>

            {/* Thanh tiến trình chuyển động mượt mà */}
            <div className={`h-2 w-full rounded-full overflow-hidden relative ${
              isStage3 ? 'bg-amber-200/70' : 'bg-slate-200'
            }`}>
              <div
                className={`absolute inset-y-0 rounded-full transition-all duration-500 ${
                  isStage3
                    ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500'
                } animate-indeterminate-bar`}
              />
            </div>

            {/* GIAI ĐOẠN 2: THẺ TIPS HIỆU ỨNG FADE-IN */}
            {elapsedSeconds >= 3 && currentTip && (
              <div className="animate-fade-in flex gap-2.5 bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-xs text-amber-900 leading-relaxed font-sans">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
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
