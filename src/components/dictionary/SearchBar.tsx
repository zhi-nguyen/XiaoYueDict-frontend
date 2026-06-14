import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Quote } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { djangoClient } from '@/lib/apiClient';
import { ZhWord } from '@/types/dictionary';

interface SearchBarProps {
  onSelectWord: (word: ZhWord) => void;
  onSearch?: (query: string) => void;
}

interface ExactExample {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export default function SearchBar({ onSelectWord, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 800);

  const [results, setResults] = useState<ZhWord[]>([]);
  const [exactExample, setExactExample] = useState<ExactExample | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function searchWords() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setExactExample(null);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(debouncedQuery)}`);
        const data = res.data;
        setResults(data.results || []);
        setExactExample(data.exact_example_match || null);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    searchWords();
  }, [debouncedQuery]);

  const handleSelect = (word: ZhWord) => {
    onSelectWord(word);
    if (onSearch) {
      onSearch(word.word);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8 z-30" ref={wrapperRef}>
      <div className={`relative flex items-center w-full h-14 rounded-full bg-surface border-2 transition-all duration-300 shadow-sm
        ${isOpen && (results.length > 0 || exactExample) ? 'border-primary shadow-md' : 'border-outline hover:border-primary/50'}`}>

        <div className="pl-5 pr-2 text-secondary">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Search className="w-5 h-5" />}
        </div>

        <input
          type="text"
          className="flex-1 h-full bg-transparent outline-none text-lg text-primary placeholder:text-secondary font-medium"
          placeholder="Tra từ điển (Chữ Hán, Pinyin, Tiếng Việt)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || exactExample) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              if (onSearch) {
                onSearch(query.trim());
              }
              setIsOpen(false);
            }
          }}
        />

        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setExactExample(null); }}
            className="px-4 text-secondary hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (debouncedQuery.trim() !== '') && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-outline rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">

          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-3 text-secondary animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-sm font-medium">Đang tìm kiếm dữ liệu...</p>
            </div>
          ) : results.length === 0 && !exactExample ? (
            <div className="p-6 text-center text-secondary">
              Không tìm thấy kết quả nào cho "{debouncedQuery}".
            </div>
          ) : (
            <div className="py-2">
              {/* Exact Example Block */}
              {exactExample && (
                <div className="mx-2 mb-2 animate-in slide-in-from-top-2">
                  <button
                    onClick={() => handleSelect({
                      id: 'exact-example-match',
                      word: exactExample.chinese,
                      traditional: '',
                      pinyin: exactExample.pinyin,
                      toneless_pinyin: '',
                      han_viet: '',
                      translation_vi: exactExample.vietnamese,
                      translation_en: '',
                      part_of_speech: ['sentence'],
                      hsk_level: '',
                      radical: [],
                      stroke_number: [],
                      components: [],
                      synonyms: [],
                      antonyms: [],
                      tags: ['Câu ví dụ'],
                      word_frequency: 0,
                      popularity_rank: 0,
                      audio_url: '',
                      examples: []
                    } as unknown as ZhWord)}
                    className="w-full text-left p-4 bg-primary/5 hover:bg-primary/10 transition-colors rounded-xl border border-primary/10 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Quote className="w-4 h-4 text-primary opacity-60" />
                      <span className="text-xs font-bold uppercase tracking-wider text-primary opacity-80">Ví dụ khớp</span>
                    </div>
                    <div className="text-xl font-bold text-primary tracking-wide">
                      {exactExample.chinese}
                    </div>
                    <div className="text-sm font-semibold text-primary/80 font-mono">
                      {exactExample.pinyin}
                    </div>
                    <div className="text-sm font-medium text-secondary mt-0.5">
                      {exactExample.vietnamese}
                    </div>
                  </button>
                </div>
              )}

              {/* Words List */}
              <ul className="">
                {results.map((word) => (
                  <li key={word.id}>
                    <button
                      onClick={() => handleSelect(word)}
                      className="w-full text-left px-5 py-3 hover:bg-hover-bg transition-colors flex items-center justify-between group border-b border-outline/30 last:border-0"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">{word.word}</span>
                          {word.traditional && <span className="text-sm text-secondary">({word.traditional})</span>}
                        </div>
                        <span className="text-sm font-medium text-secondary truncate max-w-sm mt-1">
                          {word.translation_vi}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-primary">{word.pinyin}</span>
                        {word.hsk_level && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1">
                            HSK {word.hsk_level}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
