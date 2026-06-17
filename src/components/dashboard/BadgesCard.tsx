'use client';

import React from 'react';

const BADGE_CONFIG = [
  { icon: 'workspace_premium', unlocked: true },
  { icon: 'school', unlocked: true },
  { icon: 'star', unlocked: true },
  { icon: 'lock', unlocked: false },
  { icon: 'lock', unlocked: false },
  { icon: 'lock', unlocked: false },
];

/**
 * Badges/achievements grid showing earned and locked badges.
 */
export default function BadgesCard() {
  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm">
      <h2 className="font-lexend font-semibold text-primary mb-4">Huy hiệu đạt được</h2>
      <div className="grid grid-cols-3 gap-4">
        {BADGE_CONFIG.map((badge, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              badge.unlocked
                ? 'bg-yellow-100 border-2 border-yellow-300'
                : 'bg-hover-bg border border-outline border-dashed'
            }`}>
              <span className={`material-symbols-outlined text-2xl ${
                badge.unlocked ? 'text-yellow-600 filled' : 'text-secondary/30'
              }`}>
                {badge.icon}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
