'use client';

import React from 'react';

interface DailyTargetCardProps {
  currentWords: number;
  targetWords: number;
}

/**
 * Daily target progress card with SVG ring indicator.
 */
export default function DailyTargetCard({ currentWords, targetWords }: DailyTargetCardProps) {
  const progressPercentage = Math.min((currentWords / targetWords) * 100, 100);

  return (
    <div className="bg-white border border-outline rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
      <h2 className="font-lexend font-semibold text-primary mb-6 w-full text-left">Mục tiêu hôm nay</h2>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r="70" className="stroke-hover-bg" strokeWidth="12" fill="none" />
          <circle
            cx="80" cy="80" r="70"
            className="stroke-sage transition-all duration-1000 ease-in-out"
            strokeWidth="12" fill="none"
            strokeDasharray="440"
            strokeDashoffset={440 - (440 * progressPercentage) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-primary">{currentWords}</span>
          <span className="text-xs text-secondary uppercase tracking-wider font-semibold">/ {targetWords} Từ</span>
        </div>
      </div>
      <p className="mt-6 text-sm text-secondary text-center">
        Bạn đã hoàn thành <span className="font-bold text-primary">{progressPercentage}%</span> mục tiêu
      </p>
    </div>
  );
}
