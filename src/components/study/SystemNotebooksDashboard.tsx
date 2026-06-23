'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Lock, Volume2, AlertCircle } from 'lucide-react';
import { djangoClient } from '@/lib/apiClient';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { ZhWord } from '@/types/dictionary';
import { speakChinese } from '@/lib/zhUtils';

const playAudio = (url: string | null, word: string) => {
  if (url) {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    const audio = new Audio(fullUrl);
    audio.play().catch(err => {
      console.warn('Audio playback failed, falling back to TTS:', err);
      speakChinese(word);
    });
  } else {
    speakChinese(word);
  }
};

const capitalizeFirstLetter = (text: string) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

interface SystemNotebook {
  id: string;
  name: string;
  description: string;
  type: 'hsk' | 'pos' | 'tag';
  is_premium: boolean;
  word_count?: number;
}

interface SystemNotebooksDashboardProps {
  lang: string;
  onSearchWord: (word: string) => void;
}

export function SystemNotebooksDashboard({ lang, onSearchWord }: SystemNotebooksDashboardProps) {
  const { tier, isActive, fetchSubscription } = useSubscriptionStore();
  const [notebooks, setNotebooks] = useState<{
    hsk: SystemNotebook[];
    pos: SystemNotebook[];
    tag: SystemNotebook[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view state
  const [selectedNotebook, setSelectedNotebook] = useState<SystemNotebook | null>(null);
  const [words, setWords] = useState<ZhWord[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWordsCount, setTotalWordsCount] = useState(0);

  // Premium modal state
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<'hsk' | 'pos' | 'tag'>('hsk');

  const isPremiumUser = isActive && (tier === 'Premium' || tier === 'Pro');

  // Fetch metadata on mount
  useEffect(() => {
    fetchSubscription();
    const fetchMetadata = async () => {
      try {
        const res = await djangoClient.get('/notes/system-notebooks/');
        setNotebooks(res.data);
      } catch (err) {
        console.error('Failed to load system notebooks metadata:', err);
        setError('Không thể tải danh sách sổ tay hệ thống. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetadata();
  }, [fetchSubscription]);

  // Fetch words when notebook changes or page changes
  useEffect(() => {
    if (!selectedNotebook) return;

    const fetchWords = async () => {
      setIsLoadingWords(true);
      try {
        const res = await djangoClient.get(`/notes/system-notebooks/${selectedNotebook.id}/words/?page=${page}`);
        setWords(res.data.results || []);
        setTotalWordsCount(res.data.count || 0);
        setTotalPages(Math.ceil((res.data.count || 0) / 20));
      } catch (err: any) {
        console.error('Failed to load notebook words:', err);
        if (err.response?.status === 403) {
          setShowPremiumModal(true);
          setSelectedNotebook(null);
        } else {
          setError('Không thể tải từ vựng của sổ tay. Vui lòng thử lại.');
        }
      } finally {
        setIsLoadingWords(false);
      }
    };

    fetchWords();
  }, [selectedNotebook, page]);

  const handleNotebookClick = (notebook: SystemNotebook) => {
    if (notebook.is_premium && !isPremiumUser) {
      setShowPremiumModal(true);
      return;
    }
    setPage(1);
    setSelectedNotebook(notebook);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('nb', notebook.id);
      window.history.pushState({ nb: notebook.id }, '', url.pathname + url.search);
    }
  };

  const handleBack = () => {
    setSelectedNotebook(null);
    setWords([]);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('nb');
      window.history.pushState({}, '', url.pathname + url.search);
    }
  };

  // Sync selected notebook with URL 'nb' param on popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const nbId = params.get('nb');
      if (nbId && notebooks) {
        const allBooks = [...notebooks.hsk, ...notebooks.pos, ...notebooks.tag];
        const match = allBooks.find(b => b.id === nbId);
        if (match) {
          setSelectedNotebook(match);
          return;
        }
      }
      setSelectedNotebook(null);
    };

    if (notebooks) {
      syncFromUrl();
    }
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [notebooks]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-secondary font-medium">Đang tải sổ tay hệ thống...</p>
      </div>
    );
  }

  if (error && !selectedNotebook) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-center">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button
          onClick={() => {
            setIsLoading(true);
            setError(null);
            djangoClient.get('/notes/system-notebooks/')
              .then(res => setNotebooks(res.data))
              .catch(() => setError('Không thể tải danh sách sổ tay hệ thống.'))
              .finally(() => setIsLoading(false));
          }}
          className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-md"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ─── 1. DETAIL VIEW ───
  if (selectedNotebook) {
    return (
      <div className="bg-surface border border-outline rounded-[1.5rem] p-6 md:p-8 min-h-[500px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline pb-5 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-hover-bg text-secondary hover:text-primary transition-colors flex items-center justify-center border border-outline bg-surface"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                {selectedNotebook.name}
                {selectedNotebook.is_premium && !isPremiumUser && (
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-orange/10 text-orange border border-orange/20 px-2 py-0.5 rounded-md">
                    Premium
                  </span>
                )}
              </h2>
              <p className="text-xs text-secondary mt-1">{selectedNotebook.description} • {totalWordsCount} từ vựng</p>
            </div>
          </div>
        </div>

        {isLoadingWords ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-secondary font-medium">Đang nạp từ vựng...</p>
          </div>
        ) : words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary">
            <span className="material-symbols-outlined text-5xl opacity-40 mb-3">menu_book</span>
            <p className="text-sm font-medium">Sổ tay hệ thống hiện chưa có từ vựng nào.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {words.map((w) => (
                <div
                  key={w.id}
                  className="p-4 bg-surface-alt border border-outline rounded-2xl flex items-start justify-between hover:border-primary/45 transition-all group hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        onClick={() => onSearchWord(w.word)}
                        className="text-2xl font-bold text-primary cursor-pointer hover:underline hover:text-primary-hover"
                      >
                        {w.word}
                      </span>
                      {w.traditional && (
                        <span className="text-sm text-secondary font-medium">({w.traditional})</span>
                      )}
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                        {w.pinyin}
                      </span>
                    </div>
                    {w.han_viet && (
                      <p className="text-xs text-secondary/80 font-bold">Hán Việt: {w.han_viet.toUpperCase()}</p>
                    )}
                    <p className="text-sm text-secondary font-medium line-clamp-2 leading-relaxed mt-1">
                      {capitalizeFirstLetter(w.translation_vi)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playAudio(w.audio_url, w.word)}
                      className="p-2 rounded-full hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center border border-transparent hover:border-primary/20 bg-surface"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setToastMessage(`Đã ghi nhận báo cáo sai sót cho từ "${w.word}". Cảm ơn bạn!`);
                      }}
                      className="p-2 rounded-full hover:bg-red-50 text-secondary hover:text-red-600 transition-colors flex items-center justify-center border border-transparent hover:border-red-100 bg-surface"
                      title="Báo cáo sai từ/nghĩa"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border border-outline rounded-xl text-sm font-semibold text-secondary hover:bg-hover-bg disabled:opacity-40 transition-colors"
                >
                  Trước
                </button>
                <span className="text-xs font-bold text-secondary">
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 border border-outline rounded-xl text-sm font-semibold text-secondary hover:bg-hover-bg disabled:opacity-40 transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── 2. DASHBOARD VIEW ───
  const activeList = notebooks ? notebooks[activeCategory] : [];

  return (
    <div className="space-y-8">
      {/* Category Tab Buttons */}
      <div className="flex justify-center gap-3">
        {(['hsk', 'pos', 'tag'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${
              activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-secondary border-outline hover:border-primary/45'
            }`}
          >
            {cat === 'hsk' && 'Từ vựng HSK'}
            {cat === 'pos' && (isPremiumUser ? 'Từ loại' : 'Từ loại (Premium)')}
            {cat === 'tag' && (isPremiumUser ? 'Chủ đề' : 'Chủ đề (Premium)')}
          </button>
        ))}
      </div>

      {/* Grid of Notebooks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {activeList.map((nb) => (
          <div
            key={nb.id}
            onClick={() => handleNotebookClick(nb)}
            className={`p-5 bg-surface border border-outline rounded-[1.5rem] hover:border-primary/45 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] relative hover:shadow-md ${
              nb.is_premium && !isPremiumUser ? 'hover:bg-hover-bg/30' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-primary group-hover:text-primary-hover transition-colors">
                  {nb.name}
                </h3>
                {nb.is_premium && !isPremiumUser && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange bg-orange/10 border border-orange/20 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary leading-relaxed line-clamp-3">
                {nb.description}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary/60 bg-hover-bg px-2.5 py-1 rounded-lg border border-outline/50">
                {nb.word_count !== undefined ? `${nb.word_count} từ` : '0 từ'}
              </span>
              <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Xem chi tiết
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Upgrade Promotion Callout */}
      {!isPremiumUser && activeCategory !== 'hsk' && (
        <div className="bg-gradient-to-r from-orange/10 to-orange/5 border border-orange/20 rounded-[1.5rem] p-6 text-center max-w-xl mx-auto space-y-3">
          <span className="material-symbols-outlined text-orange text-4xl">workspace_premium</span>
          <h4 className="font-bold text-lg text-primary">Mở khóa Sổ tay Từ loại &amp; Chủ đề</h4>
          <p className="text-xs text-secondary leading-relaxed max-w-md mx-auto">
            Nâng cấp gói tài khoản Premium hoặc Pro để truy cập đầy đủ hàng vạn từ vựng đã được hệ thống phân loại khoa học theo từng Từ loại và hàng trăm Thẻ chủ đề hữu ích.
          </p>
          <button
            onClick={() => setShowPremiumModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-orange to-red-500 hover:from-orange/95 hover:to-red-500/95 text-white rounded-full font-bold text-xs shadow-md transition-all"
          >
            Nâng cấp Premium
          </button>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col relative max-h-[90vh] text-center items-center justify-center space-y-4">
            <button
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors flex items-center justify-center p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center text-orange mb-2">
              <span className="material-symbols-outlined text-4xl">workspace_premium</span>
            </div>

            <h3 className="text-lg font-bold text-primary">Tính năng yêu cầu tài khoản Premium</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Bạn đang cố gắng truy cập Sổ tay hệ thống chuyên sâu (Từ loại/Tags). Tính năng này chỉ khả dụng đối với thành viên Premium hoặc Pro.
            </p>

            <div className="w-full bg-hover-bg rounded-xl p-4 text-left border border-outline text-xs space-y-2">
              <p className="font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-orange">workspace_premium</span>
                Quyền lợi khi nâng cấp:
              </p>
              <ul className="space-y-1.5 text-secondary pl-1">
                <li>• Mở khóa 100% Sổ tay Từ loại và Chủ đề chuyên sâu.</li>
                <li>• Sử dụng công cụ Dịch &amp; Đọc nói AI không giới hạn.</li>
                <li>• Xuất bản Vở tập viết PDF chữ Hán không giới hạn.</li>
              </ul>
            </div>

            <div className="flex gap-3 w-full pt-4">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 py-2.5 border border-outline rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors text-sm"
              >
                Đóng
              </button>
              <a
                href={`/${lang}/profile`}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange to-red-500 hover:from-orange/95 hover:to-red-500/95 text-white text-center rounded-xl font-bold transition-colors text-sm shadow-sm flex items-center justify-center"
              >
                Nâng cấp ngay
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-white font-semibold px-5 py-3 rounded-2xl shadow-2xl z-[1001] animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-lg">check_circle</span>
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
