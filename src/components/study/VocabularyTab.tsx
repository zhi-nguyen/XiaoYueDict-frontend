'use client';

import React, { useRef } from 'react';
import { useParams } from 'next/navigation';
import WordCardZh from '@/components/WordCardZh';
import WordCardEn from '@/components/WordCardEn';
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
  onSelectWord?: (word: ZhWord) => void;
}

const truncateTranslation = (str: string, maxLen = 15) => {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
};

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
  onSelectWord,
}: VocabularyTabProps) {
  const params = useParams();
  const language = (params?.lang as string) === 'en' ? 'en' : 'zh';

  const isSentenceQuery = !!(exactExampleMatch || translationResult);

  // Helper to render the vocabulary list and details
  const renderVocabularyBreakdown = () => {
    if (wordResults.length === 0) return null;
    return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
        <div className="w-full">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2.5">
            {isSentenceQuery 
              ? "Từ vựng thành phần trong câu:" 
              : `Tìm thấy ${wordResults.length} kết quả khớp cho "${wordResults[0].word}":`
            }
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-outline/50">
            {wordResults.map((word) => {
              const isSelected = selectedWord?.id === word.id;
              return (
                <button
                  key={word.id}
                  onClick={() => onSelectWord?.(word)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all border-2 flex-shrink-0 cursor-pointer focus:outline-none
                    ${isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface text-secondary border-outline hover:border-primary/50 hover:bg-hover-bg'
                    }`}
                >
                  <span className="text-base">{word.word}</span>
                  <span className={`text-xs font-mono font-medium ${isSelected ? 'text-white/80' : 'text-secondary'}`}>
                    {language === 'zh' ? word.pinyin : (word as any).ipa}
                  </span>
                  {language === 'zh' && word.hsk_level && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      HSK {word.hsk_level}
                    </span>
                  )}
                  {language === 'en' && (word as any).cefr_level && (word as any).cefr_level !== '0' && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {(word as any).cefr_level}
                    </span>
                  )}
                  {word.translation_vi && (
                    <span className={`text-xs font-normal italic ${isSelected ? 'text-white/70' : 'text-secondary/70'}`}>
                      ({truncateTranslation(word.translation_vi)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="w-full">
          {language === 'zh' ? (
            <WordCardZh word={selectedWord} onPracticeClick={onPracticeClick} onCharClick={onSearch} />
          ) : (
            <WordCardEn word={selectedWord as any} onPracticeClick={onPracticeClick} />
          )}
        </div>
      </div>
    );
  };

  // Case A: Sentence Query (Sentence Translation + optional word results breakdown)
  if (isSentenceQuery) {
    const sentenceText = exactExampleMatch
      ? (exactExampleMatch.chinese || exactExampleMatch.english || searchQuery)
      : searchQuery;

    return (
      <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        <div className="space-y-6">
          <TranslationCard
            sentenceText={sentenceText}
            pinyin={exactExampleMatch?.pinyin}
            translationVi={exactExampleMatch ? exactExampleMatch.vietnamese : (translationResult?.text || '')}
            translationSource={translationResult?.source || 'database'}
            isExactMatch={!!exactExampleMatch}
            onSearch={onSearch}
            sentenceId={exactExampleMatch?.id}
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

        {/* Render segmented vocabulary sub-words right below the TranslationCard */}
        {wordResults.length > 0 && (
          <div className="border-t border-outline/50 pt-8">
            {renderVocabularyBreakdown()}
          </div>
        )}
      </div>
    );
  }

  // Case B: Normal word lookup (Dictionary word results found)
  if (wordResults.length > 0) {
    return (
      <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-300">
        {renderVocabularyBreakdown()}
      </div>
    );
  }

  // Case C: No results found
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
      <p className="text-lg font-medium">{translationError || `Không tìm thấy kết quả nào cho "${searchQuery}"`}</p>
    </div>
  );
}
