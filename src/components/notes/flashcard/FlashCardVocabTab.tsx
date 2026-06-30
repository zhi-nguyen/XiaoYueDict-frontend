import React from 'react';
import { playTTSWithClientCache } from '@/lib/zhUtils';

interface FlashCardVocabTabProps {
  vocabulary: string;
  pinyin: string;
  meaning: string;
  note?: string;
  lang: string;
  onMarkMastered?: () => void;
}

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  const trimmed = str.trim();
  if (!trimmed) return str;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export default function FlashCardVocabTab({
  vocabulary,
  pinyin,
  meaning,
  note,
  lang,
  onMarkMastered,
}: FlashCardVocabTabProps) {
  const handlePlayTTS = () => {
    playTTSWithClientCache(vocabulary, lang === 'en' ? 'en' : 'zh');
  };

  return (
    <div className="text-center py-4 flex flex-col items-center">
      <div className="flex flex-col items-center justify-center mb-6">
        <h2 className="text-5xl sm:text-6xl font-bold text-primary mb-3 font-noto-sc select-all">
          {vocabulary}
        </h2>
        <div className="flex items-center gap-3">
          {pinyin && (
            <span className="text-lg font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100/50">
              {pinyin}
            </span>
          )}
          <button
            onClick={handlePlayTTS}
            className="p-2.5 rounded-full bg-hover-bg text-secondary hover:text-primary hover:bg-secondary-container transition-colors shadow-sm flex items-center justify-center border border-outline"
            title="Nghe phát âm"
          >
            <span className="material-symbols-outlined font-bold text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              volume_up
            </span>
          </button>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-sage mt-4 select-all">
          {capitalizeFirstLetter(meaning)}
        </p>

        {onMarkMastered && (
          <button
            onClick={onMarkMastered}
            className="mt-6 px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
            title="Đánh dấu từ này đã thuộc và đóng thẻ"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Đã thuộc (Bỏ qua học)
          </button>
        )}
      </div>

      {note && (
        <div className="w-full max-w-md text-left bg-surface-container-low p-4 rounded-xl border border-outline/50 mt-2">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Ghi chú / Ví dụ:</p>
          <p className="text-sm font-medium text-primary whitespace-pre-wrap select-all">
            {note}
          </p>
        </div>
      )}
    </div>
  );
}
