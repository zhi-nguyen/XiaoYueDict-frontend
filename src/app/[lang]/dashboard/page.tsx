"use client";

import React, { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import DailyTargetCard from '@/components/dashboard/DailyTargetCard';
import StreakCard from '@/components/dashboard/StreakCard';
import BadgesCard from '@/components/dashboard/BadgesCard';
import WeeklyChart from '@/components/dashboard/WeeklyChart';

export default function Dashboard() {
  const { user } = useAuthStore();
  const {
    currentStreak,
    maxStreak,
    dailyTarget,
    todayWords,
    todayDuration,
    weeklyHistory,
    rawHistory,
    isLoadingDashboard,
    fetchDashboardData,
  } = useGamificationStore();

  // Fetch all dashboard data once on mount.
  // fetchDashboardData is stable (defined inside Zustand store), so the
  // dependency array is safe — this runs exactly once per mount.
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Compute total words across entire history for badge unlock logic.
  // Memoized to avoid summation on every render; only recalculates when
  // rawHistory reference changes (i.e., after a fetch or logActivity call).
  const totalWords = useMemo(
    () => rawHistory.reduce((sum, h) => sum + h.vocabulary_learned, 0),
    [rawHistory]
  );

  // Narrow target_type to the component's union literal type.
  // The backend contract guarantees only 'words' | 'duration' values.
  const targetType = (dailyTarget.target_type === 'duration' ? 'duration' : 'words') as
    | 'words'
    | 'duration';

  // Select the correct progress values based on the user's target type.
  const currentTargetValue = targetType === 'duration' ? todayDuration : todayWords;
  const targetValue =
    targetType === 'duration' ? dailyTarget.target_duration : dailyTarget.target_words;

  return (
    <div className="flex flex-col bg-surface w-full">
      <div className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-lexend font-bold text-primary tracking-tight">
              Tổng quan học tập
            </h1>
            <p className="text-secondary mt-2">
              Theo dõi tiến độ và thành tựu của bạn, {user?.username}!
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DailyTargetCard
              currentValue={currentTargetValue}
              targetValue={targetValue}
              targetType={targetType}
              isLoading={isLoadingDashboard}
            />
            <StreakCard currentStreak={currentStreak} maxStreak={maxStreak} />
            <BadgesCard maxStreak={maxStreak} totalWords={totalWords} />
          </div>

          {/* Weekly bar chart */}
          <WeeklyChart data={weeklyHistory} isLoading={isLoadingDashboard} />

        </div>
      </div>
    </div>
  );
}
