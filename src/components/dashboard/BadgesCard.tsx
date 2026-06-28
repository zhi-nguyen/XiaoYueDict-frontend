'use client';

import React, { useMemo } from 'react';
import { computeBadges } from '@/lib/dashboardUtils';

interface BadgesCardProps {
  /** User's all-time maximum streak (days). Used to compute unlock conditions. */
  maxStreak: number;
  /**
   * Total vocabulary words learned across all time.
   * Computed from raw study history in the parent / store.
   */
  totalWords: number;
}

/**
 * Badges/achievements grid.
 *
 * Badge unlock status is derived entirely client-side from streak and word count
 * data already held in the Zustand store. No backend table required for MVP.
 *
 * Performance: badge list is memoized via useMemo — only re-computed when
 * maxStreak or totalWords actually change, preventing unnecessary array
 * allocations on every render cycle.
 */
export default function BadgesCard({ maxStreak, totalWords }: BadgesCardProps) {
  const badges = useMemo(
    () => computeBadges({ maxStreak, totalWords }),
    [maxStreak, totalWords]
  );

  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm">
      <h2 className="font-lexend font-semibold text-primary mb-4">Huy hiệu đạt được</h2>
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center gap-2"
            title={badge.label}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${
                badge.unlocked
                  ? 'bg-yellow-100 border-2 border-yellow-300'
                  : 'bg-hover-bg border border-outline border-dashed'
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl transition-colors duration-300 ${
                  badge.unlocked ? 'text-yellow-600 filled' : 'text-secondary/30'
                }`}
              >
                {badge.icon}
              </span>
            </div>
            <span
              className={`text-[10px] text-center leading-tight font-medium ${
                badge.unlocked ? 'text-primary' : 'text-secondary/40'
              }`}
            >
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
