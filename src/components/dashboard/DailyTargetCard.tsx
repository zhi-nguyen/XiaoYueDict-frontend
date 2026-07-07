'use client';

import React from 'react';

interface DailyTargetCardProps {
  /** Current progress value (words count OR minutes studied, depending on targetType). */
  currentValue: number;
  /** User's configured daily target value. */
  targetValue: number;
  /** Determines the display unit and icon. Defaults to "words". */
  targetType?: 'words' | 'duration';
  /** When true, renders a loading skeleton instead of real data. */
  isLoading?: boolean;
}

const TARGET_CONFIG = {
  words: {
    unit: 'Từ',
    icon: 'menu_book',
    subtitle: 'Từ vựng hôm nay',
  },
  duration: {
    unit: 'Phút',
    icon: 'timer',
    subtitle: 'Thời gian học hôm nay',
  },
} as const;

/**
 * Daily target progress card with SVG ring indicator.
 * Supports both "words" and "duration" target types driven by the backend DailyTarget config.
 */
export default function DailyTargetCard({
  currentValue,
  targetValue,
  targetType = 'words',
  isLoading = false,
}: DailyTargetCardProps) {
  const progressPercentage =
    targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;

  const config = TARGET_CONFIG[targetType];

  if (isLoading) {
    return (
      <div className="bg-white border border-outline rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-hover-bg rounded mb-6 self-start" />
        <div className="w-40 h-40 rounded-full bg-hover-bg" />
        <div className="mt-6 h-3 w-40 bg-hover-bg rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
      {/* Header */}
      <div className="w-full flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-sage text-xl">{config.icon}</span>
        <h2 className="font-lexend font-semibold text-primary">{config.subtitle}</h2>
      </div>

      {/* SVG Progress Ring */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="block w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" className="stroke-hover-bg" strokeWidth="12" fill="none" />
          <circle
            cx="80"
            cy="80"
            r="70"
            className="stroke-sage transition-all duration-1000 ease-in-out"
            strokeWidth="12"
            fill="none"
            strokeDasharray="440"
            strokeDashoffset={440 - (440 * progressPercentage) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-primary leading-none mb-1">{currentValue}</span>
          <span className="text-xs text-secondary uppercase tracking-wider font-semibold leading-none">
            / {targetValue}{targetType === 'duration' ? ` ${config.unit}` : ''}
          </span>
        </div>
      </div>

      {/* Footer text */}
      <p className="mt-6 text-sm text-secondary text-center">
        Bạn đã hoàn thành{' '}
        <span className="font-bold text-primary">{Math.round(progressPercentage)}%</span> mục tiêu
      </p>
    </div>
  );
}
