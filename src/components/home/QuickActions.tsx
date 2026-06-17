'use client';

import React from 'react';
import Link from 'next/link';

interface QuickActionsProps {
  language: string;
}

/**
 * Quick action cards linking to Speaking and Writing pages.
 * Extensible: en service can show different actions (IELTS writing, listening, etc.)
 */
export default function QuickActions({ language }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link
        href={`/${language}/speaking`}
        className="group bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm card-hover flex items-center gap-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-[28px]">record_voice_over</span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-primary">Luyện Phát Âm</h3>
          <p className="text-secondary text-sm mt-0.5">
            {language === 'zh'
              ? 'Ghi âm và nhận điểm từng từ/ký tự trong 5 giây'
              : 'Ghi âm và nhận điểm từng từ trong 5 giây'}
          </p>
        </div>
      </Link>

      <Link
        href={`/${language}/writing`}
        className="group bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm card-hover flex items-center gap-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-[28px]">edit_note</span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-primary">Luyện Viết</h3>
          <p className="text-secondary text-sm mt-0.5">
            {language === 'zh'
              ? 'Viết văn tiếng Trung và nhờ hệ thống chấm chữa ngữ pháp'
              : 'Viết văn tiếng Anh và nhờ hệ thống chấm chữa ngữ pháp'}
          </p>
        </div>
      </Link>
    </div>
  );
}
