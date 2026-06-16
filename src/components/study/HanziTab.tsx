'use client';

import React from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import WordCard from '@/components/WordCard';
import HanziStrokeBox, { HanziStrokeSequence } from '@/components/HanziStrokeBox';
import { ZhWord } from '@/types/dictionary';
import { getEtymology, speakChinese } from '@/lib/zhUtils';

interface HanziTabProps {
  hanziChars: string[];
  selectedHanziChar: string | null;
  onSelectChar: (char: string) => void;
  hanziWords: Record<string, ZhWord | null>;
  resolvedRadicals: Record<string, string>;
  isLoadingHanziDetails: boolean;
  onSearch: (query: string) => void;
  onPracticeClick: () => void;
}

/**
 * Hán tự (Chinese Character) tab panel for the Study page.
 * ZH-specific: shows stroke order, radicals, etymology, and character analysis.
 * Not applicable for EN service.
 */
export default function HanziTab({
  hanziChars,
  selectedHanziChar,
  onSelectChar,
  hanziWords,
  resolvedRadicals,
  isLoadingHanziDetails,
  onSearch,
  onPracticeClick,
}: HanziTabProps) {
  // No Chinese characters found in search query
  if (hanziChars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
        <p className="text-lg font-medium">Không tìm thấy chữ Hán tự nào trong từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hanzi selector buttons */}
      <div className="flex flex-wrap gap-2 p-3 bg-surface border border-outline rounded-2xl">
        <span className="text-sm font-semibold text-secondary flex items-center mr-2">Chữ Hán:</span>
        {hanziChars.map((char, idx) => (
          <button
            key={`${char}-${idx}`}
            onClick={() => onSelectChar(char)}
            className={`w-11 h-11 rounded-xl text-lg font-bold transition-all border ${selectedHanziChar === char
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-hover-bg hover:bg-outline/20 text-secondary border-transparent'
              }`}
          >
            {char}
          </button>
        ))}
      </div>

      {/* Hanzi details panel */}
      {selectedHanziChar && (
        isLoadingHanziDetails ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[300px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <HanziDetailsPanel
            selectedHanziChar={selectedHanziChar}
            charWord={hanziWords[selectedHanziChar] || null}
            resolvedRadicals={resolvedRadicals}
            onSearch={onSearch}
            onPracticeClick={onPracticeClick}
          />
        )
      )}
    </div>
  );
}

// ── Sub-component: Hanzi Details Panel ────────────────────────────────────────

interface HanziDetailsPanelProps {
  selectedHanziChar: string;
  charWord: ZhWord | null;
  resolvedRadicals: Record<string, string>;
  onSearch: (query: string) => void;
  onPracticeClick: () => void;
}

function HanziDetailsPanel({
  selectedHanziChar,
  charWord,
  resolvedRadicals,
  onSearch,
  onPracticeClick,
}: HanziDetailsPanelProps) {
  const radicalName = charWord?.radical?.[0]
    ? (resolvedRadicals[charWord.radical[0]] || charWord.radical[0])
    : 'Chưa rõ';

  const popularityText = charWord
    ? (charWord.popularity_rank && charWord.popularity_rank <= 1000
      ? 'Rất cao'
      : charWord.popularity_rank && charWord.popularity_rank <= 3000
        ? 'Cao'
        : 'Trung bình')
    : 'Chưa rõ';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Visual details & WordCard */}
      <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <HanziStrokeBox char={selectedHanziChar} />

          <div className="w-full space-y-4 text-base text-secondary font-medium pt-4 border-t border-outline/50">
            <div className="flex items-center gap-2">
              <span className="text-secondary/70 font-normal">Bính âm:</span>
              <span className="text-primary font-bold text-xl">{charWord?.pinyin || 'Chưa rõ'}</span>
              <button
                type="button"
                onClick={() => speakChinese(selectedHanziChar)}
                className="p-1.5 rounded-full hover:bg-hover-bg text-primary transition-colors focus:outline-none"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Thành phần:</span>
              <span className="text-primary font-semibold ml-1">
                {charWord?.components?.flat()?.join(', ') || 'Chưa rõ'}
              </span>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Lục thư:</span>
              <span className="text-primary font-semibold ml-1">
                {getEtymology(selectedHanziChar)}
              </span>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Bộ thủ:</span>
              <span className="text-primary font-bold ml-1 uppercase">{radicalName}</span>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Số nét:</span>
              <span className="text-primary font-bold ml-1">
                {charWord?.stroke_number?.[0] || 'Chưa rõ'}
              </span>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-outline/50">
            <span className="text-secondary/70 font-normal block mb-2">Sơ đồ nét viết (Nét bút):</span>
            <HanziStrokeSequence char={selectedHanziChar} />
          </div>

          <div className="w-full flex items-center gap-2 pt-2">
            <span className="text-secondary/70 font-normal">Độ phổ biến:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${popularityText === 'Rất cao'
              ? 'bg-red-50 text-red-700 border-red-200'
              : popularityText === 'Cao'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
              {popularityText}
            </span>
          </div>
        </div>
      </div>

      {/* WordCard for character details (Meaning, Hán Việt, Examples) */}
      <WordCard word={charWord} onCharClick={onSearch} onPracticeClick={onPracticeClick} />
    </div>
  );
}
