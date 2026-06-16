'use client';

import React from 'react';

interface StreakCardProps {
  currentStreak: number;
  maxStreak: number;
}

/**
 * Streak cards showing current and max learning streaks.
 */
export default function StreakCard({ currentStreak, maxStreak }: StreakCardProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Current Streak */}
      <div className="bg-white border border-outline rounded-2xl p-6 flex items-center justify-between shadow-sm flex-1">
        <div>
          <h2 className="font-lexend font-semibold text-primary mb-1">Chuỗi ngày học</h2>
          <p className="text-sm text-secondary mb-4">Duy trì ngọn lửa!</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-orange">{currentStreak}</span>
            <span className="text-sm font-semibold text-secondary uppercase">Ngày</span>
          </div>
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${currentStreak > 0 ? 'bg-orange/10' : 'bg-hover-bg'}`}>
          <span className={`material-symbols-outlined text-4xl ${currentStreak > 0 ? 'text-orange filled' : 'text-secondary/30'}`}>local_fire_department</span>
        </div>
      </div>

      {/* Max Streak */}
      <div className="bg-white border border-outline rounded-2xl p-6 flex items-center justify-between shadow-sm flex-1">
        <div>
          <h2 className="font-lexend font-semibold text-primary mb-1">Kỷ lục Chuỗi</h2>
          <p className="text-sm text-secondary mb-4">Thành tích cao nhất</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{maxStreak}</span>
            <span className="text-sm font-semibold text-secondary uppercase">Ngày</span>
          </div>
        </div>
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-blue-500 filled">emoji_events</span>
        </div>
      </div>
    </div>
  );
}
