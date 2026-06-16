'use client';

import React, { useRef } from 'react';
import WordCard from '@/components/WordCard';
import PracticeHub from '@/components/PracticeHub';
import TranslationCard from '@/components/study/TranslationCard';
import { ZhWord } from '@/types/dictionary';

interface VocabularyTabProps {
  wordResults: ZhWord[];
  selectedWord: ZhWord | null;
  searchQuery: string;
  exactExampleMatch: any;
  translationResult: { text: string; source: string } | null;
  translationError: string;
  onSearch: (query: string) => void;
  onPracticeClick: () => void;
}

/**
 * Vocabulary tab panel for the Study page.
 * Renders either:
 *  1. Word results → WordCard
 *  2. Sentence/translation card → TranslationCard + Practice CTA
 *  3. No results message
 */
export default function VocabularyTab({
  wordResults,
  selectedWord,
  searchQuery,
  exactExampleMatch,
  translationResult,
  translationError,
  onSearch,
  onPracticeClick,
}: VocabularyTabProps) {
  // Case 1: Dictionary word results found
  if (wordResults.length > 0) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div className="max-w-3xl mx-auto w-full">
          <WordCard word={selectedWord} onPracticeClick={onPracticeClick} onCharClick={onSearch} />
        </div>
      </div>
    );
  }

  // Case 2: Exact example match or AI translation result
  if (exactExampleMatch || translationResult) {
    const sentenceText = exactExampleMatch ? exactExampleMatch.chinese : searchQuery;

    return (
      <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        <TranslationCard
          sentenceText={sentenceText}
          pinyin={exactExampleMatch?.pinyin}
          translationVi={exactExampleMatch ? exactExampleMatch.vietnamese : (translationResult?.text || '')}
          translationSource={translationResult?.source || 'database'}
          isExactMatch={!!exactExampleMatch}
          onSearch={onSearch}
        />

        <button
          type="button"
          onClick={onPracticeClick}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:opacity-95 active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-lg">mic</span>
          Luyện phát âm câu dịch này
        </button>
      </div>
    );
  }

  // Case 3: No results
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
      <p className="text-lg font-medium">{translationError || `Không tìm thấy kết quả nào cho "${searchQuery}"`}</p>
    </div>
  );
}
