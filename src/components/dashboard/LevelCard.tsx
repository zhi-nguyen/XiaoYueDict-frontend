'use client';

import React from 'react';

interface LevelProgress {
  level: number;
  current_exp: number;
  exp_required: number;
  total_exp: number;
}

interface LevelCardProps {
  levels: {
    zh: LevelProgress;
    en: LevelProgress;
  } | null;
  lang: 'zh' | 'en';
  isLoading?: boolean;
}

export default function LevelCard({ levels, lang, isLoading = false }: LevelCardProps) {
  if (isLoading || !levels) {
    return (
      <div className="bg-white border border-outline rounded-2xl p-6 flex flex-col shadow-sm animate-pulse">
        <div className="w-full flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-hover-bg rounded-full" />
          <div className="h-4 w-40 bg-hover-bg rounded" />
        </div>
        <div className="w-full">
          <div className="h-32 bg-hover-bg rounded-xl" />
        </div>
      </div>
    );
  }

  const renderLanguageLevel = (langCode: 'zh' | 'en', title: string, flag: string, color: string, progressColor: string) => {
    const data = levels[langCode];
    const percentage = data.exp_required > 0 ? Math.min((data.current_exp / data.exp_required) * 100, 100) : 0;

    return (
      <div className="bg-hover-bg/30 border border-outline/40 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{flag}</span>
            <span className="font-lexend font-bold text-primary text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${color} text-white`}>
              Cấp {data.level}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-[11px] text-secondary mb-1">
            <span>Tiến độ EXP</span>
            <span className="font-bold">{data.current_exp} / {data.exp_required} EXP</span>
          </div>
          <div className="w-full h-2.5 bg-outline/30 rounded-full overflow-hidden">
            <div 
              style={{ width: `${percentage}%` }}
              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
            />
          </div>
        </div>

        <div className="text-[10px] text-secondary flex justify-between">
          <span>Tổng kinh nghiệm tích lũy:</span>
          <span className="font-semibold text-primary">{data.total_exp.toLocaleString()} EXP</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-outline rounded-2xl p-6 flex flex-col shadow-sm">
      {/* Header */}
      <div className="w-full flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-indigo-500 text-xl">workspace_premium</span>
        <h2 className="font-lexend font-semibold text-primary">Cấp độ & Kinh nghiệm (EXP)</h2>
      </div>

      {/* Levels list */}
      <div className="w-full">
        {lang === 'zh'
          ? renderLanguageLevel('zh', 'Tiếng Trung', '🇨🇳', 'bg-[#FF4D4F]', 'bg-[#FF4D4F]')
          : renderLanguageLevel('en', 'Tiếng Anh', '🇬🇧', 'bg-[#1890FF]', 'bg-[#1890FF]')}
      </div>
    </div>
  );
}
