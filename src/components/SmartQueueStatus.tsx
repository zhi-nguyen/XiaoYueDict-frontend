'use client';

import React, { useState, useEffect } from 'react';
import type { QueuePhase } from '@/hooks/useSmartQueue';

interface SmartQueueStatusProps {
  phase: QueuePhase;
  queuePosition: number;
  estimatedWait: number;
}

const ROTATING_MESSAGES = [
  "Hệ thống đang tiếp nhận ghi âm...",
  "Đang cấu trúc phân tích phát âm...",
  "Đang điều phối dữ liệu sang cụm máy chủ AI...",
  "Đang chấm điểm từng từ trong câu của bạn...",
  "Đang phân tích chi tiết ngữ điệu và độ trôi chảy...",
  "Tiến trình sắp hoàn tất, vui lòng chờ trong giây lát...",
];

/**
 * Smart Queue Status Display.
 * Optimized for psychological Queue UX — never displays absolute queue positions.
 * Uses estimated wait time countdown and an indeterminate brand progress bar.
 */
export default function SmartQueueStatus({
  phase,
  queuePosition,
  estimatedWait,
}: SmartQueueStatusProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (phase !== 'queued' && phase !== 'processing') {
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'idle' || phase === 'completed' || phase === 'error') {
    return null;
  }

  const formatWaitTime = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `~${mins} phút ${secs} giây` : `~${mins} phút`;
    }
    return `~${seconds} giây`;
  };

  return (
    <div className="animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl border border-outline bg-surface p-6 shadow-sm">
        {/* Shimmer overlay for background */}
        <div className="absolute inset-0 animate-shimmer opacity-30 pointer-events-none" />

        <div className="relative z-10">
          {/* Uploading Phase */}
          {phase === 'uploading' && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-hover-bg flex items-center justify-center">
                <svg className="animate-spin w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-primary text-sm">Đang tải lên...</p>
                <p className="text-secondary text-xs mt-0.5">Đang gửi file âm thanh đến máy chủ</p>
              </div>
            </div>
          )}

          {/* Queued / Processing Phase (No absolute queue position displayed) */}
          {(phase === 'queued' || phase === 'processing') && (
            <div className="flex items-center gap-4">
              {/* Premium pulsing and spinning queue status icon */}
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] flex items-center justify-center shadow-md animate-pulse-ring flex-shrink-0">
                <svg className="animate-spin text-white w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ animationDuration: '3s' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm truncate animate-fade-in" key={messageIndex}>
                  {ROTATING_MESSAGES[messageIndex]}
                </p>
                <p className="text-secondary text-xs mt-0.5">
                  Thời gian xử lý dự kiến: <span className="font-medium text-primary">{formatWaitTime(estimatedWait)}</span>
                </p>
                {/* Premium Indeterminate Progress Bar with brand gradient & sliding shimmer */}
                <div className="mt-3 h-1.5 bg-hover-bg rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] opacity-80 animate-pulse" />
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
