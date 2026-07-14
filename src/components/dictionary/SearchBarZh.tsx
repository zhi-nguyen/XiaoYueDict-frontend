import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Quote, Grid, PenTool } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { djangoClient } from '@/lib/apiClient';
import { ZhWord } from '@/types/dictionary';
import RadicalLookupPanel from './RadicalLookupPanel';
import HandwritingPanel from './HandwritingPanel';

interface SearchBarProps {
  onSelectWord: (word: ZhWord) => void;
  onSearch?: (query: string) => void;
  onSelectExample?: (example: { chinese: string; pinyin: string; vietnamese: string }) => void;
}

interface ExactExample {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const truncateByWords = (str: string, maxWords: number = 8): string => {
  if (!str) return '';
  const words = str.trim().split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...';
  }
  return str;
};

const translatePartOfSpeech = (pos: string): string => {
  if (!pos) return '';
  const mapping: Record<string, string> = {
    noun: 'Danh từ',
    verb: 'Động từ',
    adjective: 'Tính từ',
    adverb: 'Phó từ',
    pronoun: 'Đại từ',
    number: 'Số từ',
    numeral: 'Số từ',
    classifier: 'Lượng từ',
    preposition: 'Giới từ',
    conjunction: 'Liên từ',
    particle: 'Trợ từ',
    auxiliary: 'Trợ động từ',
    interjection: 'Thán từ',
    onomatopoeia: 'Từ tượng thanh',
    suffix: 'Hậu tố',
    prefix: 'Tiền tố',
    idiom: 'Thành ngữ',
    phrase: 'Cụm từ',
    sentence: 'Câu',
    punctuation: 'Dấu câu',
  };
  const normalized = pos.trim().toLowerCase();
  return mapping[normalized] || pos;
};

export default function SearchBarZh({ onSelectWord, onSearch, onSelectExample }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 800);

  const [results, setResults] = useState<ZhWord[]>([]);
  const [exactExample, setExactExample] = useState<ExactExample | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'radical' | 'handwriting' | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastSubmittedQuery = useRef('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function searchWords() {
      const trimmedQuery = debouncedQuery.trim();
      const isTooLongForSearch = trimmedQuery.length > 100;

      if (!trimmedQuery || trimmedQuery === lastSubmittedQuery.current || isTooLongForSearch) {
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
    lastSubmittedQuery.current = '';
    onSelectWord(word);
    if (onSearch) {
      onSearch(word.word);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8 z-30" ref={wrapperRef}>
      <div className={`relative flex items-center w-full h-14 rounded-full bg-surface border-2 transition-all duration-300 shadow-sm overflow-hidden
        ${isOpen && (results.length > 0 || exactExample) ? 'border-primary shadow-md' : 'border-outline hover:border-primary/50'}`}>

        <div className="pl-5 pr-2 text-secondary shrink-0">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Search className="w-5 h-5" />}
        </div>

        <input
          type="text"
          className="flex-1 min-w-0 h-full bg-transparent outline-none text-lg text-primary placeholder:text-secondary font-medium"
          placeholder="Tra từ tiếng Trung..."
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.trim() !== lastSubmittedQuery.current) {
              lastSubmittedQuery.current = '';
            }
            if (val.trim()) {
              setActivePanel(null); // Close active panels when starting to type
            }
          }}
          onFocus={() => {
            if ((results.length > 0 || exactExample) && query.trim() !== lastSubmittedQuery.current) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              lastSubmittedQuery.current = query.trim();
              if (onSearch) {
                onSearch(query.trim());
              }
              setIsOpen(false);
              setActivePanel(null);
            }
          }}
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setExactExample(null);
              lastSubmittedQuery.current = '';
            }}
            className="px-2 text-secondary hover:text-primary transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Radical & Handwriting activation buttons */}
        <div className="flex items-center gap-0.5 pr-2 pl-1.5 border-l border-outline/50 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActivePanel(activePanel === 'radical' ? null : 'radical');
              setIsOpen(false);
            }}
            className={`p-2 rounded-full transition-all focus:outline-none hover:bg-hover-bg cursor-pointer
              ${activePanel === 'radical' ? 'text-primary bg-primary/10' : 'text-secondary/70 hover:text-primary'}`}
            title="Tra cứu bộ thủ"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel(activePanel === 'handwriting' ? null : 'handwriting');
              setIsOpen(false);
            }}
            className={`p-2 rounded-full transition-all focus:outline-none hover:bg-hover-bg cursor-pointer
              ${activePanel === 'handwriting' ? 'text-primary bg-primary/10' : 'text-secondary/70 hover:text-primary'}`}
            title="Nhận dạng nét vẽ"
          >
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Radical lookup panel */}
      {activePanel === 'radical' && (
        <div className="mt-3 relative z-40">
          <RadicalLookupPanel
            onSelectChar={(char) => {
              setQuery(char);
              setActivePanel(null);
              if (onSearch) {
                onSearch(char);
              }
            }}
            onClose={() => setActivePanel(null)}
          />
        </div>
      )}

      {/* Handwriting panel */}
      {activePanel === 'handwriting' && (
        <div className="mt-3 relative z-40">
          <HandwritingPanel
            onSelectChar={(char) => {
              setQuery(char);
              setActivePanel(null);
              if (onSearch) {
                onSearch(char);
              }
            }}
            onClose={() => setActivePanel(null)}
          />
        </div>
      )}

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
                    onClick={() => {
                      // Use dedicated callback to directly set example data
                      // instead of re-searching the full sentence
                      if (onSelectExample && exactExample.chinese) {
                        onSelectExample({
                          chinese: exactExample.chinese,
                          pinyin: exactExample.pinyin,
                          vietnamese: exactExample.vietnamese,
                        });
                      } else {
                        handleSelect({
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
                        } as ZhWord);
                      }
                      setIsOpen(false);
                      setQuery('');
                    }}
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
                      {capitalizeFirstLetter(exactExample.vietnamese)}
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
                      className="w-full text-left px-5 py-3 hover:bg-hover-bg transition-colors flex flex-col border-b border-outline/30 last:border-0 cursor-pointer"
                    >
                      {/* Hàng 1: Từ, Hán Việt (nếu có) và Pinyin */}
                      <div className="flex justify-between items-baseline w-full gap-4">
                        <div className="flex items-baseline gap-2 min-w-0 flex-1">
                          <span className="text-xl font-bold text-primary truncate flex-shrink-0">
                            {word.word.length > 8 ? `${word.word.slice(0, 8)}...` : word.word}
                          </span>
                          {word.han_viet && word.word.length <= 3 && (
                            <span className="text-xs text-secondary font-medium truncate">
                              ({truncateByWords(word.han_viet.toUpperCase(), 8)})
                            </span>
                          )}
                        </div>
                        {word.pinyin && (
                          <span className="text-sm font-semibold text-primary/80 font-mono truncate max-w-[50%] ml-2 flex-shrink-0">
                            {truncateByWords(word.pinyin, 8)}
                          </span>
                        )}
                      </div>

                      {/* Hàng 2: Nghĩa tiếng Việt và Từ loại + HSK */}
                      <div className="flex justify-between items-center w-full mt-1.5 pb-0.5">
                        {/* Cột 1: Nghĩa */}
                        <div className="text-sm font-medium text-secondary truncate text-left flex-1 pr-4">
                          {capitalizeFirstLetter(word.translation_vi)}
                        </div>

                        {/* Cột 2: Từ loại & HSK */}
                        <div className="flex gap-1.5 items-center flex-shrink-0 text-right">
                          {word.part_of_speech && word.part_of_speech.length > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary inline-block truncate max-w-[120px]">
                              {word.part_of_speech.map(translatePartOfSpeech).join(', ')}
                            </span>
                          )}
                          {word.hsk_level && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-block flex-shrink-0">
                              HSK {word.hsk_level}
                            </span>
                          )}
                        </div>
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
