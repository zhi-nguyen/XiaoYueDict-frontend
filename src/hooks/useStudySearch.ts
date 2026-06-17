'use client';

import { useState, useCallback } from 'react';
import { ZhWord } from '@/types/dictionary';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket, getGuestId } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';

interface UseStudySearchReturn {
  searchQuery: string;
  wordResults: ZhWord[];
  selectedWord: ZhWord | null;
  exactExampleMatch: any;
  translationResult: { text: string; source: string } | null;
  isLoading: boolean;
  isTranslating: boolean;
  translationError: string;
  pendingText: string;
  setSelectedWord: (word: ZhWord | null) => void;
  handleSearch: (query: string) => Promise<void>;
}

/**
 * Encapsulates the master search logic for the Study page:
 * dictionary lookup → exact example match → AI translation fallback (via WebSocket).
 */
export function useStudySearch(): UseStudySearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [wordResults, setWordResults] = useState<ZhWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<ZhWord | null>(null);
  const [exactExampleMatch, setExactExampleMatch] = useState<any>(null);

  // Translation fallback states
  const [translationResult, setTranslationResult] = useState<{ text: string; source: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuthStore();

  // Listen for WebSocket translation results
  useWebSocket({
    onMessage: (msg) => {
      if (!currentTaskId || msg.payload?.task_id !== currentTaskId) return;

      if (msg.type === 'translation_complete') {
        const payload = msg.payload as any;
        setTranslationResult({
          text: payload.translatedText,
          source: payload.source || 'ai_translation'
        });
        setIsTranslating(false);
        setCurrentTaskId(null);
      } else if (msg.type === 'translation_failed') {
        const payload = msg.payload as any;
        setTranslationError(payload.error || 'Dịch thuật thất bại.');
        setIsTranslating(false);
        setCurrentTaskId(null);
      }
    }
  });

  // Direct AI translation fallback using WebSockets
  const handleDirectTranslation = useCallback(async (text: string) => {
    setIsTranslating(true);
    setTranslationError('');
    setCurrentTaskId(null);
    setPendingText(text);

    try {
      const payload: any = { text };
      const guestId = !isAuthenticated ? getGuestId() : null;
      if (guestId) {
        payload.guest_id = guestId;
      }

      const res = await djangoClient.post('/dictionary/zh/translate/', payload);
      if (res.data.status === 'SUCCESS') {
        setTranslationResult({
          text: res.data.translatedText,
          source: res.data.source || 'ai_translation'
        });
        setIsTranslating(false);
      } else if (res.data.status === 'PENDING' && res.data.task_id) {
        setCurrentTaskId(res.data.task_id);
      } else {
        setTranslationError('Lỗi dịch thuật từ máy chủ.');
        setIsTranslating(false);
      }
    } catch (e: any) {
      setTranslationError(e.message || 'Lỗi kết nối máy chủ dịch thuật.');
      setIsTranslating(false);
    }
  }, [isAuthenticated]);

  // Master search handler
  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setIsLoading(true);
    setWordResults([]);
    setSelectedWord(null);
    setExactExampleMatch(null);
    setTranslationResult(null);
    setTranslationError('');
    setCurrentTaskId(null);
    setPendingText(trimmed);

    try {
      const guestId = !isAuthenticated ? getGuestId() : null;
      let url = `/dictionary/zh/search/?q=${encodeURIComponent(trimmed)}`;
      if (guestId) {
        url += `&guest_id=${guestId}`;
      }
      const res = await djangoClient.get(url);

      if (res.status === 202 && res.data.task_id) {
        setIsTranslating(true);
        setCurrentTaskId(res.data.task_id);
      } else if (res.data.translatedText) {
        setTranslationResult({
          text: res.data.translatedText,
          source: res.data.source || 'ai_translation'
        });
      } else {
        const results = res.data.results || [];
        const exactMatch = res.data.exact_example_match || null;

        setWordResults(results);
        setExactExampleMatch(exactMatch);

        if (results.length > 0) {
          setSelectedWord(results[0]);
        } else if (!exactMatch) {
          handleDirectTranslation(trimmed);
        }
      }
    } catch (e: any) {
      console.error("Search failed, running translation fallback", e);
      handleDirectTranslation(trimmed);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, handleDirectTranslation]);

  return {
    searchQuery,
    wordResults,
    selectedWord,
    exactExampleMatch,
    translationResult,
    isLoading,
    isTranslating,
    translationError,
    pendingText,
    setSelectedWord,
    handleSearch,
  };
}
