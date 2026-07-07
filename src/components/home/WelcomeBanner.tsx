'use client';

import React from 'react';
import Link from 'next/link';

interface WelcomeBannerProps {
  language: string;
}

/**
 * Welcome gradient banner with CTA buttons.
 * Extensible: messaging and CTAs adapt per language service.
 */
export default function WelcomeBanner({ language }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] p-8 text-white shadow-lg">
      <div className="relative z-10">
        <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại!</h1>
        <p className="text-white/80 text-lg">
          {language === 'zh'
            ? 'Hãy tiếp tục hành trình học tiếng Trung của bạn với CnenDict'
            : 'Hãy tiếp tục hành trình học tiếng Anh của bạn với CnenDict'}
        </p>
        <div className="flex gap-3 mt-6">
          <Link
            href={`/${language}/speaking`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--accent-gradient-start)] font-bold rounded-full hover:bg-white/90 transition-colors shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-lg">mic</span>
            Luyện phát âm
          </Link>
          <Link
            href={`/${language}/study`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 text-white font-semibold rounded-full hover:bg-white/25 transition-colors border border-white/20 text-sm"
          >
            <span className="material-symbols-outlined text-lg">book</span>
            Tra từ &amp; Học
          </Link>
        </div>
      </div>
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/5" />
    </div>
  );
}
