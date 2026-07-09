'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ZhWord } from '@/types/dictionary';
import { directVpsClient } from '@/lib/apiClient';
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

// Low-latency search fetcher querying VPS directly
const fetchSearch = async (query: string, language: string, isAuthenticated: boolean) => {
  const guestId = !isAuthenticated ? getGuestId() : null;
  let url = `/dictionary/${language}/search/?q=${encodeURIComponent(query)}`;
  if (guestId) {
    url += `&guest_id=${guestId}`;
  }
  const res = await directVpsClient.get(url);
  return {
    status: res.status,
    data: res.data,
  };
};

/**
 * Encapsulates the master search logic for the Study page:
 * dictionary lookup → exact example match → AI translation fallback (via WebSocket).
 * Uses TanStack Query for memory caching & direct VPS endpoints for minimum latency.
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

  const { isAuthenticated } = useAuthStore();

  const isChinese = language === 'zh';
  const isTooLongForSearch = searchQuery.trim()
    ? (isChinese ? searchQuery.trim().length > 100 : searchQuery.trim().split(/\s+/).length > 30)
    : false;

  // Listen for WebSocket translation results
  useWebSocket({
    onMessage: (msg) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useStudySearch] onMessage received:', msg.type, 'payload task_id:', msg.payload?.task_id, 'currentTaskId:', currentTaskId);
      }
      if (!currentTaskId || msg.payload?.task_id !== currentTaskId) {
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

  // Direct AI translation fallback via VPS direct connection
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

      const res = await directVpsClient.post(`/dictionary/${language}/translate/`, payload);
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

  // TanStack Query for searching (Cached dynamically on client-side)
  const { data: searchResponse, isLoading: isSearchLoading } = useQuery({
    queryKey: ['studySearch', language, searchQuery],
    queryFn: () => fetchSearch(searchQuery, language, isAuthenticated),
    enabled: searchQuery.trim().length > 0 && !isTooLongForSearch,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Handle updates when search query results arrive
  useEffect(() => {
    if (!searchResponse) return;

    const { status, data } = searchResponse;

    if (status === 202 && data.task_id) {
      setIsTranslating(true);
      setCurrentTaskId(data.task_id);
    } else if (data.translatedText) {
      setTranslationResult({
        text: data.translatedText,
        source: data.source || 'ai_translation'
      });
    } else {
      const results = data.results || [];
      const exactMatch = data.exact_example_match || null;

      setWordResults(results);
      setExactExampleMatch(exactMatch);

      if (results.length > 0) {
        setSelectedWord(results[0]);
      } else if (!exactMatch) {
        handleDirectTranslation(searchQuery);
      }
    }
  }, [searchResponse, searchQuery, handleDirectTranslation]);

  // Handle direct translation trigger for long sentences
  useEffect(() => {
    if (searchQuery.trim() && isTooLongForSearch) {
      handleDirectTranslation(searchQuery.trim());
    }
  }, [searchQuery, isTooLongForSearch, handleDirectTranslation]);

  // Master handler for trigger search
  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    setSearchQuery(trimmed);

    // Always reset previous search details to prevent stale UI states
    setWordResults([]);
    setSelectedWord(null);
    setExactExampleMatch(null);
    setTranslationResult(null);
    setTranslationError('');
    setCurrentTaskId(null);

    if (!trimmed) {
      return;
    }

    setPendingText(trimmed);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', trimmed);
      window.history.pushState({ q: trimmed }, '', url.pathname + url.search);
    }
  }, []);

  // Directly set an exact example match without re-searching
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
        setSearchQuery(query.trim());
        setPendingText(query.trim());
        setWordResults([]);
        setSelectedWord(null);
        setExactExampleMatch(null);
        setTranslationResult(null);
        setTranslationError('');
        setCurrentTaskId(null);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [searchQuery]);

  const isLoading = isSearchLoading && searchQuery.trim().length > 0 && !isTooLongForSearch;

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
