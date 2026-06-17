'use client';

import React from 'react';
import Link from 'next/link';

interface StatsGridProps {
  language: string;
}

/**
 * Stats grid with progress, streak, and suggestion cards.
 */
export default function StatsGrid({ language }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm card-hover">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">trending_up</span>
          </div>
          <h3 className="font-bold text-lg text-primary">Tiến độ hôm nay</h3>
        </div>
        <p className="text-3xl font-black text-primary">
          15<span className="text-lg font-medium text-secondary">/20 từ</span>
        </p>
        <div className="mt-3 h-2 bg-hover-bg rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '75%' }} />
        </div>
        <p className="text-xs text-secondary mt-2">Còn 5 từ nữa là hoàn thành mục tiêu!</p>
      </div>

      <div className="bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm card-hover">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange filled text-[20px]">local_fire_department</span>
          </div>
          <h3 className="font-bold text-lg text-primary">Chuỗi học tập</h3>
        </div>
        <p className="text-3xl font-black text-primary">
          15<span className="text-lg font-medium text-secondary"> ngày</span>
        </p>
        <div className="flex gap-1 mt-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full ${i < 6 ? 'bg-orange' : 'bg-hover-bg'}`} />
          ))}
        </div>
        <p className="text-xs text-secondary mt-2">Chuỗi dài nhất: 22 ngày 🏆</p>
      </div>

      <div className="bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm card-hover">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">school</span>
          </div>
          <h3 className="font-bold text-lg text-primary">Gợi ý bài tập</h3>
        </div>
        <p className="text-secondary text-sm mb-3">
          {language === 'zh' ? 'Ôn tập HSK 3 — Phần thi nghe' : 'Ôn tập IELTS — Listening Section'}
        </p>
        <Link
          href={`/${language}/exam`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Bắt đầu ôn tập
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
