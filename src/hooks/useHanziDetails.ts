'use client';

import { useState, useEffect, useCallback } from 'react';
import { ZhWord, ZhExample } from '@/types/dictionary';
import { djangoClient } from '@/lib/apiClient';
import {
  splitPinyin,
  removeTones,
  isChineseChar,
  COMMON_RADICALS,
} from '@/lib/zhUtils';

interface UseHanziDetailsReturn {
  selectedHanziChar: string | null;
  setSelectedHanziChar: (char: string | null) => void;
  hanziWords: Record<string, ZhWord | null>;
  resolvedRadicals: Record<string, string>;
  isLoadingHanziDetails: boolean;
}

/**
 * Resolve radical names dynamically with db lookups and caching.
 */
async function resolveRadicalName(radicalChar: string): Promise<string> {
  if (!radicalChar) return '';

  if (COMMON_RADICALS[radicalChar]) {
    return `${COMMON_RADICALS[radicalChar]} ${radicalChar}`;
  }

  try {
    const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(radicalChar)}`);
    if (res.data.results && res.data.results.length > 0) {
      const match = res.data.results.find((w: any) => w.word === radicalChar);
      if (match && match.han_viet) {
        return `${match.han_viet.trim().toUpperCase()} ${radicalChar}`;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return radicalChar;
}

/**
 * Encapsulates Hanzi character detail loading, radical resolution, and caching.
 */
export function useHanziDetails(
  activeTab: string,
  searchQuery: string
): UseHanziDetailsReturn {
  const [selectedHanziChar, setSelectedHanziChar] = useState<string | null>(null);
  const [hanziWords, setHanziWords] = useState<Record<string, ZhWord | null>>({});
  const [resolvedRadicals, setResolvedRadicals] = useState<Record<string, string>>({});
  const [isLoadingHanziDetails, setIsLoadingHanziDetails] = useState(false);

  // Auto-select first hanzi char in Hán tự tab when tab becomes active or query changes
  useEffect(() => {
    const chars = Array.from(searchQuery).filter(isChineseChar);
    if (activeTab === 'hanzi' && chars.length > 0) {
      setSelectedHanziChar(chars[0]);
    }
  }, [activeTab, searchQuery]);

  // Load Hanzi character details
  useEffect(() => {
    const fetchHanziDetails = async () => {
      if (!selectedHanziChar) return;
      if (hanziWords[selectedHanziChar]) return;

      setIsLoadingHanziDetails(true);
      try {
        const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(selectedHanziChar)}&fallback=false`);
        const results = res.data.results || [];

        let exactWord = results.find((w: ZhWord) => w.word === selectedHanziChar) || null;

        if (!exactWord) {
          const parentWord = results.find((w: ZhWord) => w.word.includes(selectedHanziChar));
          if (parentWord) {
            const i = parentWord.word.indexOf(selectedHanziChar);
            const radical = parentWord.radical?.[i] || '';
            const stroke_number = parentWord.stroke_number?.[i] || 0;
            const components = parentWord.components?.[i] || [];

            let pinyin = '';
            if (parentWord.pinyin) {
              const syllables = splitPinyin(parentWord.pinyin);
              if (syllables.length === parentWord.word.length) {
                pinyin = syllables[i];
              } else {
                pinyin = parentWord.pinyin;
              }
            }

            let han_viet = '';
            if (parentWord.han_viet) {
              const hanVietWords = parentWord.han_viet.split(/[\s,]+/);
              if (hanVietWords.length === parentWord.word.length) {
                han_viet = hanVietWords[i];
              } else {
                han_viet = parentWord.han_viet;
              }
            }

            // Collect examples containing the character from results
            const collectedExamples: ZhExample[] = [];
            const seen = new Set<string>();
            results.forEach((w: ZhWord) => {
              if (w.examples) {
                w.examples.forEach((ex) => {
                  if (ex && ex.chinese && ex.chinese.includes(selectedHanziChar) && !seen.has(ex.chinese)) {
                    seen.add(ex.chinese);
                    collectedExamples.push(ex);
                  }
                });
              }
            });

            exactWord = {
              id: parentWord.id,
              word: selectedHanziChar,
              traditional: parentWord.traditional?.[i] || '',
              pinyin: pinyin,
              toneless_pinyin: removeTones(pinyin),
              han_viet: han_viet,
              translation_vi: `Chữ ${selectedHanziChar} trong từ ghép ${parentWord.word} ("${parentWord.translation_vi}")`,
              translation_en: `The character ${selectedHanziChar} in compound word ${parentWord.word} ("${parentWord.translation_en}")`,
              part_of_speech: [],
              hsk_level: parentWord.hsk_level,
              radical: [radical],
              stroke_number: [stroke_number],
              components: [components],
              synonyms: [],
              antonyms: [],
              tags: [],
              word_frequency: parentWord.word_frequency,
              popularity_rank: parentWord.popularity_rank,
              audio_url: '',
              examples: collectedExamples
            };
          }
        }

        setHanziWords((prev) => ({
          ...prev,
          [selectedHanziChar]: exactWord
        }));

        if (exactWord && exactWord.radical && exactWord.radical.length > 0) {
          const rad = exactWord.radical[0];
          if (!resolvedRadicals[rad]) {
            const radName = await resolveRadicalName(rad);
            setResolvedRadicals((prev) => ({
              ...prev,
              [rad]: radName
            }));
          }
        }
      } catch (e) {
        console.error("Failed to load hanzi details", e);
      } finally {
        setIsLoadingHanziDetails(false);
      }
    };

    if (activeTab === 'hanzi') {
      fetchHanziDetails();
    }
  }, [selectedHanziChar, activeTab]);

  return {
    selectedHanziChar,
    setSelectedHanziChar,
    hanziWords,
    resolvedRadicals,
    isLoadingHanziDetails,
  };
}
