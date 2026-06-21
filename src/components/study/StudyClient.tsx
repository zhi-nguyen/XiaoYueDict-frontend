'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import SearchBar from '@/components/dictionary/SearchBar';
import VocabularyTab from '@/components/study/VocabularyTab';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import HanziTab from '@/components/study/HanziTab';
import ExamplesTab from '@/components/study/ExamplesTab';
import PracticeHub from '@/components/PracticeHub';
import { useStudySearch } from '@/hooks/useStudySearch';
import { useHanziDetails } from '@/hooks/useHanziDetails';
import { useHanVietSentence } from '@/hooks/useHanVietSentence';
import { isChineseChar } from '@/lib/zhUtils';
import { ZhWord, ZhExample } from '@/types/dictionary';
import { djangoClient } from '@/lib/apiClient';

type StudyTab = 'vocabulary' | 'hanzi' | 'examples';

/**
 * Study page orchestrator.
 * Composes search, tab navigation, three tab panels
 * (Vocabulary, Hán tự, Examples), and a slide-out PracticeHub sidebar
 * into a cohesive study experience.
 */
export default function StudyClient() {
  const params = useParams();
  const language = (params?.lang as string) === 'en' ? 'en' : 'zh';

  const [activeTab, setActiveTab] = useState<StudyTab>('vocabulary');
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPracticeOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsPracticeOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPracticeOpen) {
        setIsPracticeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPracticeOpen]);

  // ── Hooks ──
  const search = useStudySearch();
  const hanzi = useHanziDetails(activeTab, search.searchQuery);
  const { hanVietSentence } = useHanVietSentence(
    search.exactExampleMatch,
    search.translationResult,
    search.searchQuery
  );

  // ── Database examples & pagination ──
  const [dbExamples, setDbExamples] = useState<ZhExample[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [visibleExamplesCount, setVisibleExamplesCount] = useState(5);

  // Fetch examples containing the search query
  useEffect(() => {
    const fetchDbExamples = async () => {
      if (!search.searchQuery) {
        setDbExamples([]);
        return;
      }
      setIsLoadingExamples(true);
      try {
        const res = await djangoClient.get(`/dictionary/${language}/search/?q=${encodeURIComponent(search.searchQuery)}&fallback=false`);
        const results = res.data.results || [];
        const collected: ZhExample[] = [];
        const seen = new Set<string>();

        results.forEach((word: ZhWord) => {
          if (word.examples) {
            word.examples.forEach((ex) => {
              if (
                (ex.chinese.includes(search.searchQuery) || ex.vietnamese.includes(search.searchQuery)) &&
                !seen.has(ex.chinese)
              ) {
                seen.add(ex.chinese);
                collected.push(ex);
              }
            });
          }
        });
        setDbExamples(collected);
      } catch (e) {
        console.error("Failed to fetch database examples", e);
      } finally {
        setIsLoadingExamples(false);
      }
    };

    setVisibleExamplesCount(5);
    fetchDbExamples();
  }, [search.searchQuery, language]);

  // ── Matching examples aggregation ──
  const getMatchingExamples = (): any[] => {
    if (!search.searchQuery) return [];

    if (dbExamples.length > 0) {
      return dbExamples;
    }

    const collected: any[] = [];
    const seen = new Set<string>();

    if (search.exactExampleMatch) {
      collected.push({
        id: 'exact-match',
        chinese: search.exactExampleMatch.chinese,
        pinyin: search.exactExampleMatch.pinyin,
        vietnamese: search.exactExampleMatch.vietnamese,
      });
      seen.add(search.exactExampleMatch.chinese);
    }

    search.wordResults.forEach((word) => {
      if (word.examples) {
        word.examples.forEach((ex) => {
          if (
            (ex.chinese.includes(search.searchQuery) || ex.vietnamese.includes(search.searchQuery)) &&
            !seen.has(ex.chinese)
          ) {
            seen.add(ex.chinese);
            collected.push(ex);
          }
        });
      }
    });

    return collected;
  };

  const matchingExamples = getMatchingExamples();
  const hanziChars = Array.from(search.searchQuery).filter(isChineseChar);

  // ── Determine the current word/sentence to be practiced in PracticeHub ──
  const activePracticeWord = useMemo<ZhWord | null>(() => {
    if (!search.searchQuery) return null;

    if (activeTab === 'vocabulary') {
      if (search.wordResults.length > 0) {
        return search.selectedWord;
      }
      if (search.exactExampleMatch || search.translationResult) {
        const sentenceText = search.exactExampleMatch ? search.exactExampleMatch.chinese : search.searchQuery;
        return {
          id: '0',
          word: sentenceText,
          traditional: '',
          pinyin: search.exactExampleMatch ? search.exactExampleMatch.pinyin : '',
          toneless_pinyin: '',
          han_viet: hanVietSentence,
          translation_vi: search.exactExampleMatch ? search.exactExampleMatch.vietnamese : (search.translationResult?.text || ''),
          translation_en: '',
          part_of_speech: ['sentence'],
          hsk_level: '',
          radical: [],
          stroke_number: [],
          components: [],
          synonyms: [],
          antonyms: [],
          tags: [],
          word_frequency: 0,
          popularity_rank: 9999,
          audio_url: '',
          examples: []
        };
      }
    }

    if (activeTab === 'hanzi') {
      if (hanzi.selectedHanziChar) {
        return hanzi.hanziWords[hanzi.selectedHanziChar] || {
          id: '0',
          word: hanzi.selectedHanziChar,
          traditional: '',
          pinyin: '',
          toneless_pinyin: '',
          han_viet: '',
          translation_vi: '',
          translation_en: '',
          part_of_speech: [],
          hsk_level: '',
          radical: [],
          stroke_number: [],
          components: [],
          synonyms: [],
          antonyms: [],
          tags: [],
          word_frequency: 0,
          popularity_rank: 9999,
          audio_url: '',
          examples: []
        };
      }
    }

    // Default fallback
    return {
      id: '0',
      word: search.searchQuery,
      traditional: '',
      pinyin: '',
      toneless_pinyin: '',
      han_viet: '',
      translation_vi: '',
      translation_en: '',
      part_of_speech: [],
      hsk_level: '',
      radical: [],
      stroke_number: [],
      components: [],
      synonyms: [],
      antonyms: [],
      tags: [],
      word_frequency: 0,
      popularity_rank: 9999,
      audio_url: '',
      examples: []
    };
  }, [
    activeTab,
    search.searchQuery,
    search.wordResults,
    search.selectedWord,
    search.exactExampleMatch,
    search.translationResult,
    hanVietSentence,
    hanzi.selectedHanziChar,
    hanzi.hanziWords
  ]);

  // ── Tab definitions ──
  const tabs = useMemo(() => {
    const list: { id: StudyTab; label: string }[] = [
      { id: 'vocabulary', label: 'Từ vựng' }
    ];
    if (language === 'zh') {
      list.push({ id: 'hanzi', label: 'Hán tự' });
    }
    list.push({ id: 'examples', label: 'Ví dụ' });
    return list;
  }, [language]);

  return (
    <main className="w-full p-4 md:p-8 pb-16 bg-surface-alt relative">
      <div className="max-w-[1280px] mx-auto">

        {/* Search Bar Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-6">Tra Từ Điển &amp; Luyện Tập</h1>
          <SearchBar onSelectWord={(word) => search.handleSearch(word.word)} onSearch={search.handleSearch} />
        </div>

        {/* Tab Selection */}
        {search.searchQuery && (
          <div className="flex justify-center gap-4 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${activeTab === tab.id
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-surface text-secondary border-outline hover:border-primary/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content Panels */}
        {!search.searchQuery ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
            <div className="w-20 h-20 bg-hover-bg rounded-full flex items-center justify-center mb-4 border border-outline">
              <span className="material-symbols-outlined text-4xl opacity-50">search</span>
            </div>
            <p className="text-xl font-medium">Hãy tìm kiếm một từ vựng để bắt đầu</p>
          </div>
        ) : search.isTranslating ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px]">
            <div className="w-full max-w-md">
              <SmartQueueStatus
                phase="processing"
                strategy={QUEUE_STRATEGIES.translation_zh}
                onRetry={() => search.handleSearch(search.searchQuery)}
                errorMessage=""
              />
            </div>
          </div>
        ) : search.translationError ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px]">
            <div className="w-full max-w-md">
              <SmartQueueStatus
                phase="error"
                strategy={QUEUE_STRATEGIES.translation_zh}
                onRetry={() => search.handleSearch(search.searchQuery)}
                errorMessage={search.translationError}
              />
            </div>
          </div>
        ) : search.isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px]">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-secondary font-medium">Đang tra cứu dữ liệu...</p>
          </div>
        ) : activeTab === 'vocabulary' ? (
          <VocabularyTab
            wordResults={search.wordResults}
            selectedWord={search.selectedWord}
            searchQuery={search.searchQuery}
            exactExampleMatch={search.exactExampleMatch}
            translationResult={search.translationResult}
            translationError={search.translationError}
            onSearch={search.handleSearch}
            onPracticeClick={() => setIsPracticeOpen(true)}
          />
        ) : activeTab === 'hanzi' ? (
          <HanziTab
            hanziChars={hanziChars}
            selectedHanziChar={hanzi.selectedHanziChar}
            onSelectChar={hanzi.setSelectedHanziChar}
            hanziWords={hanzi.hanziWords}
            resolvedRadicals={hanzi.resolvedRadicals}
            isLoadingHanziDetails={hanzi.isLoadingHanziDetails}
            onSearch={search.handleSearch}
            onPracticeClick={() => setIsPracticeOpen(true)}
          />
        ) : (
          <ExamplesTab
            matchingExamples={matchingExamples}
            searchQuery={search.searchQuery}
            visibleCount={visibleExamplesCount}
            onLoadMore={() => setVisibleExamplesCount((prev) => prev + 5)}
            onSearch={search.handleSearch}
          />
        )}
      </div>

      {/* ── Slide-out Practice Sidebar ── */}
      {isPracticeOpen && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsPracticeOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[460px] h-screen bg-surface border-l border-outline shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isPracticeOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">graphic_eq</span>
            <h3 className="font-bold text-lg text-primary">Luyện phát âm</h3>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activePracticeWord ? (
            <PracticeHub word={activePracticeWord} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">mic</span>
              <p className="text-sm font-medium">Hãy chọn hoặc tra từ vựng để luyện tập</p>
            </div>
          )}
        </div>

        {/* Pulsing '>' close button sticking out of the middle left edge of the sidebar */}
        {isPracticeOpen && (
          <button
            type="button"
            onClick={() => setIsPracticeOpen(false)}
            className="absolute left-3 sm:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white shadow-2xl flex items-center justify-center cursor-pointer select-none transition-all duration-300 hover:scale-105 hover:shadow-2xl z-50 active:scale-95 group border border-white/20 animate-pulse focus:outline-none"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-white text-3xl font-bold group-hover:translate-x-0.5 transition-transform">
              keyboard_arrow_right
            </span>
          </button>
        )}
      </div>

      {/* ── Floating Half Mic Button ── */}
      {!isPracticeOpen && search.searchQuery && activeTab !== 'examples' && (
        <button
          type="button"
          onClick={() => setIsPracticeOpen(true)}
          title="Luyện phát âm"
          className="fixed right-0 top-1/2 -translate-y-1/2 w-12 h-16 rounded-l-2xl bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white shadow-2xl flex items-center justify-center cursor-pointer select-none transition-all duration-300 hover:w-14 z-40 active:scale-95 group border-y border-l border-white/20"
        >
          <span className="material-symbols-outlined text-white text-2xl group-hover:scale-110 transition-transform">
            mic
          </span>
          {activePracticeWord && (
            <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>
      )}
    </main>
  );
}
