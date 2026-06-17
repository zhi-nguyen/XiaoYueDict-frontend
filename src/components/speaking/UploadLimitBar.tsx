'use client';

import React, { useCallback } from 'react';

interface UsageData {
  tier: string;
  used_hr: number;
  limit_hr: number;
  used_min: number;
  limit_min: number;
  used_day: number;
  limit_day: number;
}

interface UploadLimitBarProps {
  usageData: UsageData;
}

const TIER_BADGE_STYLES: Record<string, string> = {
  PRO: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  PREMIUM: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  PLUS: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
};
const DEFAULT_BADGE_STYLE = 'bg-gray-500/10 text-gray-500 border-gray-500/20';

/**
 * Glassmorphic progress bar showing audio upload volume limits.
 * Displays per-minute, per-hour, and per-day usage with tier badge.
 */
export default function UploadLimitBar({ usageData }: UploadLimitBarProps) {
  const formatMB = useCallback((bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  }, []);

  const percentage = (usageData.used_hr / usageData.limit_hr) * 100;
  const badgeStyle = TIER_BADGE_STYLES[usageData.tier] || DEFAULT_BADGE_STYLE;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline bg-hover-bg/30 backdrop-blur-md p-5 shadow-sm transition-all hover:bg-hover-bg/50 animate-fade-in">
      {/* Decorative radial gradient for depth */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-500">
            <span className="material-symbols-outlined text-lg">cloud_upload</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hạn Mức Tải Lên</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeStyle}`}>
                {usageData.tier}
              </span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5">Dung lượng ghi âm đã dùng trong 1 giờ qua</p>
          </div>
        </div>

        {/* Right: Bar & Details */}
        <div className="w-full">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-primary font-bold">
              {formatMB(usageData.used_hr)} MB <span className="text-secondary/60 font-normal">/ {formatMB(usageData.limit_hr)} MB</span>
            </span>
            <span className="text-secondary">
              {percentage.toFixed(1)}%
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2 w-full rounded-full bg-outline/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>

          {/* Additional info */}
          <div className="flex items-center justify-between text-[10px] text-secondary mt-1.5 font-semibold">
            <span>Theo phút: {formatMB(usageData.used_min)} / {formatMB(usageData.limit_min)} MB</span>
            <span>Theo ngày: {formatMB(usageData.used_day)} / {formatMB(usageData.limit_day)} MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
