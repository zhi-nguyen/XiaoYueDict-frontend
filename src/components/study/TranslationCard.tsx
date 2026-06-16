'use client';

import React from 'react';
import { Volume2, Bookmark, ArrowUpDown } from 'lucide-react';
import { renderClickableHanzi, speakChinese } from '@/lib/zhUtils';

interface TranslationCardProps {
  sentenceText: string;
  pinyin?: string;
  translationVi: string;
  translationSource: 'database' | 'ai_translation' | string;
  isExactMatch: boolean;
  onSearch: (query: string) => void;
}

/**
 * Displays a sentence/translation result card with:
 * - Clickable hanzi characters
 * - Pinyin reading
 * - Vietnamese translation
 * - Source badge (system vs AI)
 */
export default function TranslationCard({
  sentenceText,
  pinyin,
  translationVi,
  translationSource,
  isExactMatch,
  onSearch,
}: TranslationCardProps) {
  const isSystemTranslation = isExactMatch || translationSource === 'database';

  return (
    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-3xl font-bold text-red-600 leading-relaxed tracking-wide flex-1 break-words">
          {renderClickableHanzi(sentenceText, isExactMatch ? undefined : onSearch)}
        </h2>
        <div className="flex gap-3 flex-shrink-0 ml-4">
          <button
            onClick={() => speakChinese(sentenceText)}
            title="Phát âm"
            className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <button
            title="Lưu vào sổ tay"
            className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none"
          >
            <Bookmark className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bracketed Readings */}
      <div className="text-secondary font-medium text-lg leading-relaxed flex flex-wrap gap-2 mb-6">
        {pinyin && (
          <span className="text-blue-600">[ {pinyin} ]</span>
        )}
      </div>

      {/* Swap indicator */}
      <div className="relative my-6">
        <hr className="border-outline/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-outline flex items-center justify-center shadow-sm">
          <ArrowUpDown className="w-4 h-4 text-secondary/60" />
        </div>
      </div>

      {/* Translation Text */}
      <div className="mb-6">
        <p className="text-xl text-primary font-medium leading-relaxed">
          {translationVi}
        </p>
      </div>

      {/* Card Footer Buttons */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-outline/30">
        <button className="px-4 py-2 bg-hover-bg border border-outline rounded-full text-secondary hover:text-primary transition-all text-xs font-bold shadow-sm">
          Đóng góp bản dịch
        </button>
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
            isSystemTranslation
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-purple-50 text-purple-700 border border-purple-200'
          }`}>
            {isSystemTranslation ? 'Dịch hệ thống' : 'Dịch AI'}
          </span>
        </div>
      </div>
    </div>
  );
}
