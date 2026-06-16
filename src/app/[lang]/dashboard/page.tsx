"use client";

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import DailyTargetCard from '@/components/dashboard/DailyTargetCard';
import StreakCard from '@/components/dashboard/StreakCard';
import BadgesCard from '@/components/dashboard/BadgesCard';
import WeeklyChart from '@/components/dashboard/WeeklyChart';

// Dummy data — kept as-is per user request for this phase
const CHART_DATA = [
  { name: 'T2', words: 12 },
  { name: 'T3', words: 19 },
  { name: 'T4', words: 3 },
  { name: 'T5', words: 5 },
  { name: 'T6', words: 2 },
  { name: 'T7', words: 20 },
  { name: 'CN', words: 10 },
];
const TARGET_WORDS = 10;
const CURRENT_WORDS = 7;

export default function Dashboard() {
  const { user } = useAuthStore();
  const { currentStreak, maxStreak } = useGamificationStore();

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scroll">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-lexend font-bold text-primary tracking-tight">Tổng quan học tập</h1>
            <p className="text-secondary mt-2">Theo dõi tiến độ và thành tựu của bạn, {user?.username}!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DailyTargetCard currentWords={CURRENT_WORDS} targetWords={TARGET_WORDS} />
            <StreakCard currentStreak={currentStreak} maxStreak={maxStreak} />
            <BadgesCard />
          </div>

          {/* Bar Chart Section */}
          <WeeklyChart data={CHART_DATA} />
        </div>
      </div>
    </div>
  );
}
