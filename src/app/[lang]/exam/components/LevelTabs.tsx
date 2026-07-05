'use client';

import React from 'react';

interface LevelTabsProps {
  levels: string[];
  activeLevel: string;
  onSelect: (level: string) => void;
}

export default function LevelTabs({ levels, activeLevel, onSelect }: LevelTabsProps) {
  if (levels.length <= 1) return null;

  return (
    <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 scrollbar-none select-none">
      {levels.map((level) => {
        const isActive = activeLevel === level;
        return (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
              isActive
                ? 'bg-primary text-white shadow-sm scale-[1.02]'
                : 'text-on-surface-variant hover:text-primary hover:bg-hover-bg'
            }`}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
