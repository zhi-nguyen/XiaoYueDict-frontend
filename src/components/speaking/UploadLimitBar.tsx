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
  PRO: 'bg-surface text-amber-600 border-amber-500/35',
  PREMIUM: 'bg-surface text-purple-600 border-purple-500/35',
  PLUS: 'bg-surface text-cyan-600 border-cyan-500/35',
};
const DEFAULT_BADGE_STYLE = 'bg-surface text-gray-500 border-gray-500/35';

/**
 * Glassmorphic progress bar showing audio upload volume limits (UsageHub).
 * Displays per-minute, per-hour, and per-day usage with tier badge.
 * Formats sizes dynamically in KB or MB for polished precision.
 */
export default function UploadLimitBar({ usageData }: UploadLimitBarProps) {
  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const percentage = usageData.limit_hr > 0 ? (usageData.used_hr / usageData.limit_hr) * 100 : 0;
  const badgeStyle = TIER_BADGE_STYLES[usageData.tier] || DEFAULT_BADGE_STYLE;

  return (
    <div className="relative rounded-2xl border border-outline bg-hover-bg/30 backdrop-blur-md p-5 shadow-sm transition-all hover:bg-hover-bg/50 animate-fade-in font-sans">
      {/* Dynamic Tier Tag positioned at the top-middle of the border */}
      <span className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shadow-sm ${badgeStyle}`}>
        {usageData.tier}
      </span>

      {/* Decorative radial gradient for depth */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Left: Info */}
        <div className="flex flex-col items-center text-center w-full">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hạn Mức Tải Lên</span>
          <p className="text-[11px] text-secondary mt-0.5">Dung lượng ghi âm đã dùng trong 1 giờ qua</p>
        </div>

        {/* Right: Bar & Details */}
        <div className="w-full">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-primary font-bold">
              {formatSize(usageData.used_hr)} <span className="text-secondary/60 font-normal">/ {formatSize(usageData.limit_hr)}</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-secondary mt-1.5 font-semibold gap-1">
            <span>Theo phút: {formatSize(usageData.used_min)} / {formatSize(usageData.limit_min)}</span>
            <span>Theo ngày: {formatSize(usageData.used_day)} / {formatSize(usageData.limit_day)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
