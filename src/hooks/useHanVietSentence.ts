'use client';

import { useState, useEffect } from 'react';
import { djangoClient } from '@/lib/apiClient';
import { isChineseChar, COMMON_HAN_VIET } from '@/lib/zhUtils';

interface UseHanVietSentenceReturn {
  hanVietSentence: string;
}

/**
 * Resolves a dynamic Hán Việt reading for a Chinese sentence/phrase.
 * Uses a local mapping for common characters and falls back to API lookups.
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
      const resolved = await Promise.all(
        chars.map(async (char) => {
          if (isChineseChar(char)) {
            try {
              if (COMMON_HAN_VIET[char]) return COMMON_HAN_VIET[char];

              if (skipApiLookup) return ''; // Skip API lookup for long text to avoid high volume of parallel requests

              const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(char)}`);
              if (res.data.results && res.data.results.length > 0) {
                const match = res.data.results.find((w: any) => w.word === char);
                if (match && match.han_viet) {
                  return match.han_viet.trim().toUpperCase().split('/')[0].split(',')[0];
                }
              }
            } catch (e) {
              console.error(e);
            }
            return '';
          }
          return char;
        })
      );

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
