'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import SpeakerIcon from '@/components/dictionary/SpeakerIcon';
import { djangoClient } from '@/lib/apiClient';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { ZhWord } from '@/types/dictionary';
import { speakBrowserFallback, playTTSWithClientCache } from '@/lib/zhUtils';
import { cloneSystemNotebook, fetchNotebooks } from '@/lib/api/notes';
import { useAuthStore } from '@/store/useAuthStore';
import ConfirmModal from '@/components/ConfirmModal';

const playAudio = (word: string, lang: string) => {
  const langCode = lang === 'en' ? 'en' : 'zh';
  playTTSWithClientCache(word, langCode);
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
  const { isAuthenticated } = useAuthStore();
  const { tier, isActive, fetchSubscription } = useSubscriptionStore();
  const [selectedNotebook, setSelectedNotebook] = useState<SystemNotebook | null>(null);
  const [page, setPage] = useState(1);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'hsk' | 'pos' | 'tag'>('hsk');
  const [isCloning, setIsCloning] = useState(false);

  const executeClone = async () => {
    if (!selectedNotebook) return;
    setIsCloning(true);
    try {
      await cloneSystemNotebook(selectedNotebook.id, lang);
      setToastMessage(`Đã lưu "${selectedNotebook.name}" thành sổ tay cá nhân của bạn!`);
    } catch (err) {
      console.error("Failed to clone notebook:", err);
      setToastMessage("Có lỗi xảy ra khi lưu sổ tay.");
    } finally {
      setIsCloning(false);
      setShowConfirmModal(false);
    }
  };

  const handleClone = async () => {
    if (!selectedNotebook) return;
    setIsCloning(true);
    try {
      const personalNotebooks = await fetchNotebooks(lang);
      const expectedName = `${selectedNotebook.name} (Sổ cá nhân)`;
      const alreadyExists = personalNotebooks.some((nb: any) => nb.name === expectedName);

      if (alreadyExists) {
        setShowConfirmModal(true);
        setIsCloning(false);
      } else {
        await executeClone();
      }
    } catch (err) {
      console.error("Failed to check existing notebooks:", err);
      await executeClone();
    }
  };

  const isPremiumUser = isActive && (tier === 'Premium' || tier === 'Pro');

  // Trigger subscription fetch on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Auto-reset active category if lang changes to en and we are on tag
  useEffect(() => {
    if (lang === 'en' && activeCategory === 'tag') {
      setActiveCategory('hsk');
    }
  }, [lang, activeCategory]);

  // Fetch metadata using TanStack Query
  const { data: notebooks, isLoading: isLoadingMetadata, error: metadataError, refetch: refetchMetadata } = useQuery({
    queryKey: ['systemNotebooks', lang],
    queryFn: async () => {
      const res = await djangoClient.get(`/notes/system-notebooks/?lang=${lang}`);
      return res.data as {
        hsk: SystemNotebook[];
        pos: SystemNotebook[];
        tag: SystemNotebook[];
      };
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours caching
  });

  // Fetch words using TanStack Query
  const { data: wordsData, isLoading: isLoadingWords, error: wordsError } = useQuery({
    queryKey: ['systemNotebookWords', selectedNotebook?.id, page, lang],
    queryFn: async () => {
      if (!selectedNotebook?.id) return { results: [], count: 0 };
      const res = await djangoClient.get(`/notes/system-notebooks/${selectedNotebook.id}/words/?page=${page}&lang=${lang}`);
      return res.data;
    },
    enabled: !!selectedNotebook?.id,
    staleTime: 1000 * 60 * 60, // 1 hour caching
  });

  // Redirect to premium if words fetch returns 403 Forbidden
  useEffect(() => {
    if (wordsError) {
      const axiosError = wordsError as any;
      if (axiosError.response?.status === 403) {
        setShowPremiumModal(true);
        setSelectedNotebook(null);
      }
    }
  }, [wordsError]);

  const words = wordsData?.results || [];
  const totalWordsCount = wordsData?.count || 0;
  const totalPages = Math.ceil(totalWordsCount / 20);

  const isLoading = isLoadingMetadata;
  const error = metadataError
    ? 'Không thể tải danh sách sổ tay hệ thống. Vui lòng thử lại sau.'
    : wordsError
      ? 'Không thể tải từ vựng của sổ tay. Vui lòng thử lại.'
      : null;

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
            refetchMetadata();
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
      <>
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
            {isAuthenticated && (
              <button
                onClick={handleClone}
                disabled={isCloning}
                className="px-4 py-2 bg-sage text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isCloning ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_add</span>
                )}
                Lưu làm sổ cá nhân
              </button>
            )}
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
                {words.map((w: any) => (
                  <div
                    key={w.id}
                    className="p-4 bg-surface-alt border border-outline rounded-2xl flex flex-col gap-2 hover:border-primary/45 transition-all group hover:shadow-sm"
                  >
                    {/* Row 1: Word + Actions */}
                    <div className="grid grid-cols-[1fr_80px] items-center gap-3 w-full">
                      {/* Col 1: Word */}
                      <div className="min-w-0 flex items-center gap-2">
                        <span
                          onClick={() => onSearchWord(w.word)}
                          className="text-2xl font-bold text-primary cursor-pointer hover:underline hover:text-primary-hover truncate block"
                          title={w.word}
                        >
                          {w.word}
                        </span>
                        {w.traditional && (
                          <span className="text-sm text-secondary font-medium truncate" title={w.traditional}>
                            ({w.traditional})
                          </span>
                        )}
                      </div>

                      {/* Col 2: Actions */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <SpeakerIcon
                          text={w.word}
                          lang={lang === 'en' ? 'en' : 'zh'}
                          size={16}
                          className="p-2 rounded-full hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center border border-transparent hover:border-primary/20 bg-surface shrink-0"
                        />
                        <button
                          onClick={() => {
                            setToastMessage(`Đã ghi nhận báo cáo sai sót cho từ "${w.word}". Cảm ơn bạn!`);
                          }}
                          className="p-2 rounded-full hover:bg-red-50 text-secondary hover:text-red-600 transition-colors flex items-center justify-center border border-transparent hover:border-red-100 bg-surface shrink-0"
                          title="Báo cáo sai từ/nghĩa"
                        >
                          <AlertCircle className="w-4 h-4 text-secondary hover:text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: IPA / Pinyin */}
                    {(w.pinyin || w.ipa) && (
                      <div className="w-full min-w-0">
                        <span 
                          className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50 truncate max-w-full"
                          title={w.pinyin || w.ipa}
                        >
                          {w.pinyin || w.ipa}
                        </span>
                      </div>
                    )}

                    {/* Row 3: Translation */}
                    <div className="w-full min-w-0">
                      {w.han_viet && lang !== 'en' && (
                        <p className="text-xs text-secondary/80 font-bold mb-0.5 truncate" title={`Hán Việt: ${w.han_viet.toUpperCase()}`}>
                          Hán Việt: {w.han_viet.toUpperCase()}
                        </p>
                      )}
                      <p 
                        className="text-sm text-secondary font-medium leading-relaxed truncate"
                        title={capitalizeFirstLetter(w.translation_vi)}
                      >
                        {capitalizeFirstLetter(w.translation_vi)}
                      </p>
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

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-primary text-white font-semibold px-5 py-3 rounded-2xl shadow-2xl z-[1001] animate-in slide-in-from-bottom-5 duration-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-lg">check_circle</span>
            <span className="text-sm">{toastMessage}</span>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Xác nhận lưu lại"
          message={`Bạn đã lưu sổ tay "${selectedNotebook?.name}" làm sổ cá nhân trước đây. Bạn có muốn tiếp tục lưu thêm một bản sao khác không?`}
          onConfirm={executeClone}
          onCancel={() => setShowConfirmModal(false)}
        />
      </>
    );
  }

  // ─── 2. DASHBOARD VIEW ───
  const activeList = notebooks ? notebooks[activeCategory] : [];

  return (
    <div className="space-y-8">
      {/* Category Tab Buttons */}
      <div className="flex justify-center gap-3">
        {(lang === 'en' ? ['hsk', 'pos'] : ['hsk', 'pos', 'tag'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-secondary border-outline hover:border-primary/45'
              }`}
          >
            {cat === 'hsk' && (lang === 'en' ? 'Cấp độ CEFR' : 'Từ vựng HSK')}
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
            className={`p-5 bg-surface border border-outline rounded-[1.5rem] hover:border-primary/45 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] relative hover:shadow-md ${nb.is_premium && !isPremiumUser ? 'hover:bg-hover-bg/30' : ''
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
