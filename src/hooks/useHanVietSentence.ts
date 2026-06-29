'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '@/lib/apiClient';
import { useHanziCacheStore } from '@/store/useHanziCacheStore';
import { ZhWord } from '@/types/dictionary';
import {
  isChineseChar,
  COMMON_HAN_VIET,
  splitPinyin,
  removeTones,
} from '@/lib/zhUtils';

interface UseHanVietSentenceReturn {
  hanVietSentence: string;
}

/**
 * Resolves a dynamic Hán Việt reading for a Chinese sentence/phrase.
 * Uses a local mapping for common characters and falls back to API lookups.
 * Integrates with global Zustand cache store and Batch Search to minimize network calls.
 */
export function useHanVietSentence(
  exactExampleMatch: any,
  translationResult: { text: string; source: string } | null,
  searchQuery: string
): UseHanVietSentenceReturn {
  const [queryText, setQueryText] = useState('');
  const [hanVietSentence, setHanVietSentence] = useState('');

  // Resolve queryText for Hán Việt sentence generator
  useEffect(() => {
    if (exactExampleMatch) {
      setQueryText(exactExampleMatch.chinese);
    } else if (translationResult) {
      setQueryText(searchQuery);
    } else {
      setQueryText('');
    }
  }, [exactExampleMatch, translationResult, searchQuery]);

  // Resolve dynamic Hán Việt reading for sentences
  useEffect(() => {
    if (!queryText) {
      setHanVietSentence('');
      return;
    }

    const resolveSentenceHanViet = async () => {
      const chars = Array.from(queryText);
      const skipApiLookup = chars.length > 30;

      // Extract unique Chinese characters in the sentence
      const uniqueChineseChars = Array.from(new Set(chars.filter(isChineseChar)));

      // Retrieve cached words from Zustand store
      const currentCachedWords = useHanziCacheStore.getState().hanziWords;

      // Identify characters that are neither in common local dictionary nor in the Zustand cache
      const missingChars = uniqueChineseChars.filter(
        (char) => !COMMON_HAN_VIET[char] && currentCachedWords[char] === undefined
      );

      if (missingChars.length > 0 && !skipApiLookup) {
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
                  examples: []
                };
              }
            }

            newWords[char] = exactWord;
          }

          // Add newly resolved characters to Zustand cache
          useHanziCacheStore.getState().addHanziWords(newWords);
        } catch (e) {
          console.error("Failed to batch fetch Hán Việt pronunciations", e);
        }
      }

      // Read Hán Việt pronunciations from local map or Zustand cache
      const resolved = chars.map((char) => {
        if (isChineseChar(char)) {
          if (COMMON_HAN_VIET[char]) return COMMON_HAN_VIET[char];

          const cachedWord = useHanziCacheStore.getState().hanziWords[char];
          if (cachedWord && cachedWord.han_viet) {
            return cachedWord.han_viet.trim().toUpperCase().split('/')[0].split(',')[0];
          }
          return '';
        }
        return char;
      });

      let resultStr = '';
      for (let i = 0; i < resolved.length; i++) {
        const current = resolved[i];
        const prev = i > 0 ? resolved[i - 1] : '';
        const isCurrentWord = /^[A-ZĐĂÂÊÔƠƯ]+$/.test(current);
        const isPrevWord = /^[A-ZĐĂÂÊÔƠƯ]+$/.test(prev);

        if (isCurrentWord && isPrevWord) {
          resultStr += ' ' + current;
        } else {
          resultStr += current;
        }
      }
      setHanVietSentence(resultStr);
    };

    resolveSentenceHanViet();
  }, [queryText]);

  return { hanVietSentence };
}
