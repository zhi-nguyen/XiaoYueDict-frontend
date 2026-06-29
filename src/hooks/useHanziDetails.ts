'use client';

import { useState, useEffect } from 'react';
import { ZhWord, ZhExample } from '@/types/dictionary';
import { djangoClient } from '@/lib/apiClient';
import { useHanziCacheStore } from '@/store/useHanziCacheStore';
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
 * Uses global Zustand store to persist character information across tab switches.
 */
export function useHanziDetails(
  activeTab: string,
  searchQuery: string
): UseHanziDetailsReturn {
  const [selectedHanziChar, setSelectedHanziChar] = useState<string | null>(null);
  const [isLoadingHanziDetails, setIsLoadingHanziDetails] = useState(false);

  // Retrieve global cache state and actions from Zustand store
  const {
    hanziWords,
    resolvedRadicals,
    addHanziWords,
    addResolvedRadicals,
  } = useHanziCacheStore();

  // Auto-select first hanzi char in Hán tự tab when tab becomes active or query changes
  useEffect(() => {
    const chars = Array.from(searchQuery).filter(isChineseChar);
    if (activeTab === 'hanzi' && chars.length > 0) {
      setSelectedHanziChar(chars[0]);
    }
  }, [activeTab, searchQuery]);

  // Load Hanzi character details in batch to optimize network requests
  useEffect(() => {
    const fetchAllHanziDetails = async () => {
      const chars = Array.from(searchQuery).filter(isChineseChar);
      if (chars.length === 0) return;

      // Access current cache from Zustand store directly to avoid hook dependency loop
      const currentCachedWords = useHanziCacheStore.getState().hanziWords;
      const missingChars = chars.filter((char) => currentCachedWords[char] === undefined);

      if (missingChars.length === 0) return;

      setIsLoadingHanziDetails(true);
      try {
        const res = await djangoClient.get(
          `/dictionary/zh/search/batch/?q=${encodeURIComponent(missingChars.join(''))}&type=char`
        );
        const results = res.data.results || [];
        
        // Sanitize results to ensure all required fields for ZhWord interface are populated
        const sanitizedResults: ZhWord[] = results.map((w: any) => ({
          id: w.id || '0',
          word: w.word || '',
          traditional: w.traditional || '',
          pinyin: w.pinyin || '',
          toneless_pinyin: w.toneless_pinyin || '',
          han_viet: w.han_viet || '',
          translation_vi: w.translation_vi || '',
          translation_en: w.translation_en || '',
          part_of_speech: w.part_of_speech || [],
          hsk_level: w.hsk_level || '',
          radical: w.radical || [],
          stroke_number: w.stroke_number || [],
          components: w.components || [],
          synonyms: w.synonyms || [],
          antonyms: w.antonyms || [],
          tags: w.tags || [],
          word_frequency: w.word_frequency || 0,
          popularity_rank: w.popularity_rank || 9999,
          audio_url: w.audio_url || '',
          examples: w.examples || []
        }));

        const newWords: Record<string, ZhWord | null> = {};

        for (const char of missingChars) {
          let exactWord = sanitizedResults.find((w: ZhWord) => w.word === char) || null;

          if (!exactWord) {
            const parentWord = sanitizedResults.find((w: ZhWord) => w.word.includes(char));
            if (parentWord) {
              const i = parentWord.word.indexOf(char);
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
                    if (ex && ex.chinese && ex.chinese.includes(char) && !seen.has(ex.chinese)) {
                      seen.add(ex.chinese);
                      collectedExamples.push(ex);
                    }
                  });
                }
              });

              exactWord = {
                id: parentWord.id,
                word: char,
                traditional: parentWord.traditional?.[i] || '',
                pinyin: pinyin,
                toneless_pinyin: removeTones(pinyin),
                han_viet: han_viet,
                translation_vi: `Chữ ${char} trong từ ghép ${parentWord.word} ("${parentWord.translation_vi}")`,
                translation_en: `The character ${char} in compound word ${parentWord.word} ("${parentWord.translation_en}")`,
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

          newWords[char] = exactWord;
        }

        addHanziWords(newWords);
      } catch (e) {
        console.error("Failed to load batch hanzi details", e);
      } finally {
        setIsLoadingHanziDetails(false);
      }
    };

    if (activeTab === 'hanzi') {
      fetchAllHanziDetails();
    }
  }, [activeTab, searchQuery, addHanziWords]);

  // Load radical name for the currently selected Hanzi character
  useEffect(() => {
    const resolveSelectedRadical = async () => {
      if (!selectedHanziChar) return;

      const currentCachedWords = useHanziCacheStore.getState().hanziWords;
      const currentRadicals = useHanziCacheStore.getState().resolvedRadicals;

      const exactWord = currentCachedWords[selectedHanziChar];
      if (exactWord && exactWord.radical && exactWord.radical.length > 0) {
        const rad = exactWord.radical[0];
        if (!currentRadicals[rad]) {
          const radName = await resolveRadicalName(rad);
          addResolvedRadicals({ [rad]: radName });
        }
      }
    };

    if (activeTab === 'hanzi') {
      resolveSelectedRadical();
    }
  }, [selectedHanziChar, activeTab, addResolvedRadicals]);

  return {
    selectedHanziChar,
    setSelectedHanziChar,
    hanziWords,
    resolvedRadicals,
    isLoadingHanziDetails,
  };
}
