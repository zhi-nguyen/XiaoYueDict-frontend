'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ZhWord } from '@/types/dictionary';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getGuestId } from '@/lib/guest';
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
  setExactExampleDirectly: (example: any, displayQuery: string) => void;
}

/**
 * Encapsulates the master search logic for the Study page:
 * dictionary lookup → exact example match → AI translation fallback (via WebSocket).
 */
export function useStudySearch(): UseStudySearchReturn {
  const params = useParams();
  const language = (params?.lang as string) === 'en' ? 'en' : 'zh';

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
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useStudySearch] onMessage received:', msg.type, 'payload task_id:', msg.payload?.task_id, 'currentTaskId:', currentTaskId);
      }
      if (!currentTaskId || msg.payload?.task_id !== currentTaskId) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useStudySearch] Ignored message (task ID mismatch or no active task)');
        }
        return;
      }

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

      const res = await djangoClient.post(`/dictionary/${language}/translate/`, payload);
      if (res.data.status === 'SUCCESS') {
        setTranslationResult({
          text: res.data.translatedText,
          source: res.data.source || 'ai_translation'
        });
        setIsTranslating(false);
      } else if (res.data.task_id) {
        setCurrentTaskId(res.data.task_id);
      } else {
        setTranslationError('Lỗi dịch thuật từ máy chủ.');
        setIsTranslating(false);
      }
    } catch (e: any) {
      setTranslationError(e.message || 'Lỗi kết nối máy chủ dịch thuật.');
      setIsTranslating(false);
    }
  }, [isAuthenticated, language]);

  const performSearch = useCallback(async (query: string, pushHistory = true) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchQuery('');
      setWordResults([]);
      setSelectedWord(null);
      setExactExampleMatch(null);
      setTranslationResult(null);
      setTranslationError('');
      setCurrentTaskId(null);
      return;
    }

    setSearchQuery(trimmed);
    setIsLoading(true);
    setWordResults([]);
    setSelectedWord(null);
    setExactExampleMatch(null);
    setTranslationResult(null);
    setTranslationError('');
    setCurrentTaskId(null);
    setPendingText(trimmed);

    if (pushHistory && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', trimmed);
      window.history.pushState({ q: trimmed }, '', url.pathname + url.search);
    }

    const isChinese = language === 'zh';
    const isTooLongForSearch = isChinese ? trimmed.length > 100 : trimmed.split(/\s+/).length > 30;

    if (isTooLongForSearch) {
      handleDirectTranslation(trimmed);
      setIsLoading(false);
      return;
    }

    try {
      const guestId = !isAuthenticated ? getGuestId() : null;
      let url = `/dictionary/${language}/search/?q=${encodeURIComponent(trimmed)}`;
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
  }, [isAuthenticated, handleDirectTranslation, language]);

  const handleSearch = useCallback((query: string) => {
    return performSearch(query, true);
  }, [performSearch]);

  // Directly set an exact example match without re-searching.
  // Used when user clicks an example in the search bar dropdown.
  const setExactExampleDirectly = useCallback((example: any, displayQuery: string) => {
    const trimmed = displayQuery.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setWordResults([]);
    setSelectedWord(null);
    setExactExampleMatch(example);
    setTranslationResult(null);
    setTranslationError('');
    setCurrentTaskId(null);
    setIsLoading(false);
    setIsTranslating(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', trimmed);
      window.history.pushState({ q: trimmed }, '', url.pathname + url.search);
    }
  }, []);

  // Sync state with URL query search params on popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q') || '';
      if (query !== searchQuery) {
        performSearch(query, false);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [performSearch, searchQuery]);

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
    setExactExampleDirectly,
  };
}
