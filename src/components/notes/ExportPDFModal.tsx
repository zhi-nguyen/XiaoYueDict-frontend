'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getErrorMessage } from '@/lib/errorHelper';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import { useAuthStore } from '@/store/useAuthStore';
import AuthModal from '@/components/auth/AuthModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useCoinStore } from '@/store/useCoinStore';

import { Word } from '@/types/note';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  notebookName: string;
  words: Word[];
  selectedWordIds: string[];
  onSelectAllWords?: () => void;
  onInvalidWordsFound?: (wordIds: string[]) => void;
}

export default function ExportPDFModal({
  isOpen,
  onClose,
  notebookId,
  notebookName,
  words,
  selectedWordIds,
  onInvalidWordsFound,
}: ExportPDFModalProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [gridColor, setGridColor] = useState('#D32F2F'); // Default: Red
  const [showPinyin, setShowPinyin] = useState(true);
  const [strokeByStroke, setStrokeByStroke] = useState(false);
  const [showMeaning, setShowMeaning] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showCover, setShowCover] = useState(true);
  const [brandingName, setBrandingName] = useState('CnenDict');
  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'mastered' | 'not_mastered'>('all');

  // Advanced customization state
  const [extraRows, setExtraRows] = useState(0);
  const [emptyPages, setEmptyPages] = useState(0);
  const [emptyPageGridSize, setEmptyPageGridSize] = useState<'auto' | '2.0' | '1.0'>('1.0');

  const [exporting, setExporting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'error'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // ConfirmModal states for deconstruction stroke errors
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [confirmBlockTitle, setConfirmBlockTitle] = useState('');
  const [confirmBlockMessage, setConfirmBlockMessage] = useState('');
  const [confirmBlockShowConfirm, setConfirmBlockShowConfirm] = useState(true);
  const [confirmBlockConfirmText, setConfirmBlockConfirmText] = useState('Xác nhận');
  const [confirmBlockCancelText, setConfirmBlockCancelText] = useState('Hủy');
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});
  const [onCancelAction, setOnCancelAction] = useState<() => void>(() => () => {});

  // Limits information from backend
  const [limitInfo, setLimitInfo] = useState<{
    tier: string;
    daily_limit: number;
    current_count: number;
    remaining_count: number;
    max_words: number;
    pdf_normal_export_cost?: number;
    pdf_stroke_export_cost?: number;
  } | null>(null);

  const { wallets, fetchWalletBalances } = useCoinStore();
  const coinBalance = wallets.zh.total; // Paid with Linh Thạch

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLimits = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await djangoClient.get(`/notes/notebooks/${notebookId}/export-pdf/limits/`);
      setLimitInfo(res.data);
      fetchWalletBalances();
    } catch (err) {
      console.error('Lỗi khi tải thông tin hạn mức PDF:', err);
    }
  }, [notebookId, isAuthenticated, fetchWalletBalances]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchLimits();
    }
  }, [isOpen, isAuthenticated, fetchLimits]);

  // Set export scope to 'selected' if user has already selected some words
  useEffect(() => {
    if (selectedWordIds.length > 0) {
      setExportScope('selected');
    } else {
      setExportScope('all');
    }
  }, [selectedWordIds, isOpen]);

  // Smooth client-side ticking countdown for estimatedWait (EWT)
  useEffect(() => {
    if (phase !== 'queued' && phase !== 'processing') return;
    if (estimatedWait <= 0) return;

    const timer = setInterval(() => {
      setEstimatedWait((prev) => {
        if (prev <= 1) return 1;
        if (prev <= 5) return Math.random() < 0.25 ? prev - 1 : prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, estimatedWait]);

  // Download PDF file when completed
  const triggerDownload = async (tid: string) => {
    try {
      const res = await djangoClient.get(`/notes/notebooks/export-pdf/download/${tid}/`, {
        responseType: 'blob',
        timeout: 90000 // 90 seconds timeout for large notebooks
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const safeName = notebookName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.setAttribute('download', `so-tay-tap-viet-${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setPhase('idle');
      setExporting(false);
      fetchLimits(); // refresh limits count and wallet balance
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi tải file PDF:', err);
      setPhase('error');
      setErrorMessage(getErrorMessage(err));
    }
  };

  // WebSocket message callback
  const handleWsMessage = useCallback((msg: any) => {
    if (!taskId) return;
    if (msg.payload?.task_id !== taskId) return;

    if (msg.type === 'pdf_complete') {
      setPhase('completed');
      triggerDownload(taskId);
    } else if (msg.type === 'pdf_failed') {
      setPhase('error');
      setErrorMessage(msg.payload?.error || 'Có lỗi xảy ra trong quá trình xuất PDF nền.');
    }
  }, [taskId]);

  // Subscribe to real-time events via WebSocket hook
  useWebSocket({
    onMessage: handleWsMessage
  });

  // Removed Polling fallback mechanism — now relying 100% on WebSockets as requested

  if (!isOpen) return null;

  if (!mounted || isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-secondary mt-3">Đang xác thực tài khoản...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">

          <div className="flex justify-between items-center mb-5 border-b border-outline/50 pb-3 shrink-0">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
              Xuất PDF Vở Tập Viết
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-2 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <h3 className="text-lg font-bold text-primary">Đăng nhập để xuất PDF</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Tính năng xuất bản Vở tập viết chữ Hán PDF chuyên nghiệp chỉ dành riêng cho thành viên đã đăng ký.
            </p>

            <div className="w-full bg-hover-bg rounded-2xl p-4 text-left border border-outline text-xs space-y-2.5">
              <p className="font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">workspace_premium</span>
                Quyền lợi thành viên:
              </p>
              <ul className="space-y-1.5 text-secondary pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Gói Free:</strong> 2 lần xuất/ngày, tối đa 10 từ/file, kèm bìa & thương hiệu mặc định.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Gói Plus/Premium/Pro:</strong> Lên đến 15 lần/ngày, 100 từ/file, được phép ẩn bìa & cá nhân hóa header.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-outline/50 mt-5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-outline rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors text-sm"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors text-sm shadow-sm"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>

          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
      </div>
    );
  }

  const isFreeTier = !limitInfo || limitInfo.tier === 'Free';

  const masteredWords = words.filter(w => w.is_mastered);
  const notMasteredWords = words.filter(w => !w.is_mastered);

  let currentWordCount = words.length;
  if (exportScope === 'selected') {
    currentWordCount = selectedWordIds.length;
  } else if (exportScope === 'mastered') {
    currentWordCount = masteredWords.length;
  } else if (exportScope === 'not_mastered') {
    currentWordCount = notMasteredWords.length;
  }

  const proceedWithExport = async (wordsToExportList: Word[]) => {
    try {
      const params: any = {
        grid_color: gridColor,
        show_pinyin: showPinyin,
        show_meaning: showMeaning,
        show_notes: showNotes,
        show_cover: isFreeTier ? true : showCover,
        branding_name: isFreeTier ? 'CnenDict' : brandingName,
        extra_rows: extraRows,
        empty_pages: emptyPages,
        empty_page_grid_size: emptyPageGridSize,
        stroke_by_stroke: strokeByStroke,
      };

      // Always pass the explicit word IDs when filtered or when scope is selected/mastered/not_mastered
      if (strokeByStroke || exportScope === 'selected' || exportScope === 'mastered' || exportScope === 'not_mastered') {
        if (wordsToExportList.length === 0) {
          setErrorMessage('Vui lòng chọn ít nhất một từ vựng để xuất.');
          setPhase('error');
          setExporting(false);
          return;
        }
        params.word_ids = wordsToExportList.map(w => w.id).join(',');
      }

      // POST to API Gateway to create the PDF background task
      const res = await djangoClient.post(`/notes/notebooks/${notebookId}/export-pdf/`, params);
      const data = res.data;

      setTaskId(data.task_id);
      setQueuePosition(data.queue_position);
      setEstimatedWait(data.estimated_wait_seconds);

      if (data.queue_position <= 1) {
        setPhase('processing');
      } else {
        setPhase('queued');
      }
    } catch (err: any) {
      console.error('Lỗi khi xuất PDF:', err);
      setPhase('error');
      setErrorMessage(getErrorMessage(err));
    }
  };

  const runStrokeCheckAndExport = async (wordsToExportList: Word[]) => {
    setExporting(true);
    setPhase('uploading');
    setErrorMessage(null);
    setTaskId(null);

    // 2. Perform client-side stroke and length checking if "Luyện từng nét" is enabled
    if (strokeByStroke) {
      try {
        // Collect invalid words based on length > 14
        const invalidByLengthWords = wordsToExportList.filter(w => {
          const hanziList = w.vocabulary.split('').filter(c => /^[\u4e00-\u9fa5]$/.test(c));
          return hanziList.length > 14;
        });

        // Collect unique characters from words with length <= 14 for stroke count checking
        const wordsToCheck = wordsToExportList.filter(w => {
          const hanziList = w.vocabulary.split('').filter(c => /^[\u4e00-\u9fa5]$/.test(c));
          return hanziList.length <= 14;
        });

        const uniqueChars = Array.from(
          new Set(
            wordsToCheck.flatMap(w =>
              w.vocabulary.split('').filter(c => /^[\u4e00-\u9fa5]$/.test(c))
            )
          )
        );

        const strokeCounts: { [char: string]: number } = {};
        const isUnsupported: { [char: string]: boolean } = {};
        const concurrencyLimit = 5;
        for (let i = 0; i < uniqueChars.length; i += concurrencyLimit) {
          const chunk = uniqueChars.slice(i, i + concurrencyLimit);
          await Promise.all(
            chunk.map(async (char) => {
              try {
                const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`);
                if (res.ok) {
                  const data = await res.json();
                  const count = data.strokes?.length || 0;
                  strokeCounts[char] = count;
                  if (count > 27) {
                    isUnsupported[char] = true;
                  }
                } else {
                  strokeCounts[char] = 0;
                  isUnsupported[char] = true;
                }
              } catch (err) {
                console.error(`Failed to fetch stroke data for ${char}:`, err);
                strokeCounts[char] = 0;
                isUnsupported[char] = true;
              }
            })
          );
        }

        const invalidByStrokesWords = wordsToCheck.filter(w =>
          w.vocabulary.split('').some(c => isUnsupported[c])
        );

        // Combined invalid words
        const allInvalidWords = Array.from(new Set([...invalidByLengthWords, ...invalidByStrokesWords]));
        const invalidWordIds = allInvalidWords.map(w => w.id);

        if (invalidWordIds.length > 0) {
          // Build error message items
          const errorTexts: string[] = [];
          if (invalidByLengthWords.length > 0) {
            errorTexts.push(`câu vượt quá 14 chữ Hán: "${invalidByLengthWords.map(w => w.vocabulary).join(', ')}"`);
          }
          if (invalidByStrokesWords.length > 0) {
            const invalidChars = Array.from(
              new Set(
                invalidByStrokesWords.flatMap(w =>
                  w.vocabulary.split('').filter(c => isUnsupported[c])
                )
              )
            );
            errorTexts.push(`từ không đúng định dạng hoặc có nét > 27: "${invalidChars.join(', ')}"`);
          }

          const combinedErrorMsg = errorTexts.join('; ');
          const validWordsLeft = wordsToExportList.filter(w => !invalidWordIds.includes(w.id));

          if (validWordsLeft.length > 0) {
            setConfirmBlockTitle('Phát hiện từ không hợp lệ');
            setConfirmBlockMessage(
              `Hệ thống phát hiện ${combinedErrorMsg}. Nếu xác nhận, hệ thống sẽ xuất file mà không có các từ lỗi này.`
            );
            setConfirmBlockShowConfirm(true);
            setConfirmBlockConfirmText('Tiếp tục xuất');
            setConfirmBlockCancelText('Hủy');
            setOnConfirmAction(() => () => {
              setConfirmBlockOpen(false);
              proceedWithExport(validWordsLeft);
            });
            setOnCancelAction(() => () => {
              setConfirmBlockOpen(false);
              onInvalidWordsFound?.(invalidWordIds);
              setExporting(false);
              setPhase('idle');
            });
            setConfirmBlockOpen(true);
            return;
          } else {
            setConfirmBlockTitle('Không thể xuất PDF');
            setConfirmBlockMessage(
              `Hệ thống phát hiện ${combinedErrorMsg}. Vui lòng loại bỏ hoặc chỉnh sửa các từ này trước khi xuất.`
            );
            setConfirmBlockShowConfirm(false);
            setConfirmBlockCancelText('Đóng');
            setOnCancelAction(() => () => {
              setConfirmBlockOpen(false);
              onInvalidWordsFound?.(invalidWordIds);
              setExporting(false);
              setPhase('idle');
            });
            setConfirmBlockOpen(true);
            return;
          }
        }
      } catch (err) {
        console.error('Error in frontend stroke and length check:', err);
      }
    }

    // If no invalid words, proceed with exporting all
    await proceedWithExport(wordsToExportList);
  };

  const handleExport = async () => {
    if (isAuthLoading) return;
    
    // 1. Determine the list of words to be exported
    let wordsToExport = words;
    if (exportScope === 'selected') {
      wordsToExport = words.filter(w => selectedWordIds.includes(w.id));
    } else if (exportScope === 'mastered') {
      wordsToExport = masteredWords;
    } else if (exportScope === 'not_mastered') {
      wordsToExport = notMasteredWords;
    }

    let finalWordCount = wordsToExport.length;
    if (limitInfo && finalWordCount > limitInfo.max_words) {
      setErrorMessage(`Số lượng từ (${finalWordCount} từ) vượt quá giới hạn tối đa (${limitInfo.max_words} từ) của gói ${limitInfo.tier}.`);
      return;
    }

    const isPaidExport = limitInfo && limitInfo.remaining_count <= 0;
    const cost = strokeByStroke ? (limitInfo?.pdf_stroke_export_cost ?? 3) : (limitInfo?.pdf_normal_export_cost ?? 2);

    if (isPaidExport) {
      if (coinBalance < cost) {
        setErrorMessage(`Đã hết lượt xuất PDF miễn phí trong ngày và số dư Linh Thạch không đủ để thanh toán phí xuất thêm (Yêu cầu ${cost} Linh Thạch, hiện có ${coinBalance} Linh Thạch).`);
        return;
      }

      setConfirmBlockTitle("Xác nhận trừ Linh Thạch");
      setConfirmBlockMessage(`Bạn đã dùng hết lượt xuất PDF miễn phí của ngày hôm nay. Xuất tiếp tục sẽ tốn ${cost} Linh Thạch. Bạn có đồng ý trừ ${cost} Linh Thạch từ tài khoản của mình không?`);
      setConfirmBlockShowConfirm(true);
      setConfirmBlockConfirmText("Đồng ý");
      setConfirmBlockCancelText("Hủy");
      setOnConfirmAction(() => () => {
        setConfirmBlockOpen(false);
        runStrokeCheckAndExport(wordsToExport);
      });
      setOnCancelAction(() => () => {
        setConfirmBlockOpen(false);
      });
      setConfirmBlockOpen(true);
    } else {
      runStrokeCheckAndExport(wordsToExport);
    }
  };

  const colorsList = [
    { value: '#D32F2F', label: 'Đỏ truyền thống', bg: 'bg-[#D32F2F]' },
    { value: '#2E7D32', label: 'Xanh lá đậm', bg: 'bg-[#2E7D32]' },
    { value: '#1565C0', label: 'Xanh dương nhã nhặn', bg: 'bg-[#1565C0]' },
    { value: '#555555', label: 'Xám trung tính', bg: 'bg-[#555555]' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">

        {/* Loading Overlay */}
        {exporting && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in">
            <div className="w-full">
              <SmartQueueStatus
                phase={phase}
                strategy={QUEUE_STRATEGIES.pdf_export}
                errorMessage={errorMessage}
                onRetry={() => {
                  setExporting(false);
                  setPhase('idle');
                  setErrorMessage(null);
                  fetchLimits(); // Refresh limits count after retry/status reset
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col mb-5 border-b border-outline/50 pb-3 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
              Xuất PDF Vở Tập Viết
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {limitInfo && (
            <p className="text-xs text-secondary mt-1.5 ml-1.5 flex items-center gap-1 font-medium">
              Còn <span className="font-bold text-primary">{limitInfo.remaining_count}</span> lần xuất PDF hôm nay • <span className="font-bold text-primary">{currentWordCount}/{limitInfo.max_words}</span> từ
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {limitInfo && currentWordCount > limitInfo.max_words && (
          <div className="mb-4 bg-orange-50 text-orange-600 text-xs font-semibold p-3 rounded-xl border border-orange-100 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
            <span>
              Số lượng từ ({currentWordCount} từ) vượt quá giới hạn tối đa của gói {limitInfo.tier} ({limitInfo.max_words} từ). Vui lòng chọn phạm vi ít từ hơn hoặc nâng cấp gói cước.
            </span>
          </div>
        )}

        {limitInfo && limitInfo.remaining_count <= 0 && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span>
              Bạn đã dùng hết {limitInfo.daily_limit} lượt xuất PDF hôm nay. Vui lòng nâng cấp gói cước để tiếp tục.
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
          {/* Scope selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-primary">Phạm vi xuất bản</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${exportScope === 'all'
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-outline hover:bg-hover-bg text-secondary'
                  }`}
              >
                <span>Tất cả từ vựng</span>
                <span className="text-xs opacity-70">({words.length} từ)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportScope('selected')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${exportScope === 'selected'
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-outline hover:bg-hover-bg text-secondary'
                  }`}
              >
                <span>Từ đã chọn</span>
                <span className="text-xs opacity-70">({selectedWordIds.length} từ)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportScope('not_mastered')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${exportScope === 'not_mastered'
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-outline hover:bg-hover-bg text-secondary'
                  }`}
              >
                <span>Từ chưa thuộc</span>
                <span className="text-xs opacity-70">({notMasteredWords.length} từ)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportScope('mastered')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-1 transition-all ${exportScope === 'mastered'
                  ? 'border-primary bg-primary/5 text-primary font-bold'
                  : 'border-outline hover:bg-hover-bg text-secondary'
                  }`}
              >
                <span>Từ đã thuộc</span>
                <span className="text-xs opacity-70">({masteredWords.length} từ)</span>
              </button>
            </div>
            {exportScope === 'selected' && selectedWordIds.length === 0 && (
              <p className="text-[11px] text-orange-600 font-medium italic mt-1.5 bg-orange-50 p-2 rounded-lg border border-orange-100">
                💡 Mẹo: Đóng Modal này lại, tích chọn các ô vuông bên cạnh từ vựng ở danh sách ngoài, sau đó bấm Xuất PDF.
              </p>
            )}
          </div>

          {/* Grid Color selection */}
          <div className="space-y-2.5">
            <label className="block text-sm font-bold text-primary">Màu đường lưới ô chữ Điền</label>
            <div className="flex flex-col gap-2">
              {colorsList.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setGridColor(c.value)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl border text-sm transition-colors ${gridColor === c.value
                    ? 'border-primary bg-primary/5 font-bold text-primary'
                    : 'border-outline hover:bg-hover-bg text-secondary'
                    }`}
                >
                  <span className={`w-5 h-5 rounded-full ${c.bg} shrink-0 border border-black/10`} />
                  <span>{c.label}</span>
                  {gridColor === c.value && (
                    <span className="material-symbols-outlined text-primary ml-auto text-lg">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Options switch */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-bold text-primary">Tùy chọn hiển thị nội dung</label>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">In trang bìa sổ tay</span>
                  <span className="text-xs text-secondary text-left">Thêm trang mở đầu thiết kế trang nhã</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFreeTier ? true : showCover}
                    disabled={isFreeTier}
                    onChange={(e) => setShowCover(e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              </label>

              {/* Branding name customization */}
              <div className="p-3 bg-surface border border-outline rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">Dòng chữ thương hiệu ở Header (Branding)</span>
                    <span className="text-xs text-secondary text-left">Tùy biến tên riêng của người học ở Header</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={isFreeTier ? 'CnenDict' : brandingName}
                  disabled={isFreeTier}
                  onChange={(e) => setBrandingName(e.target.value)}
                  placeholder="Nhập tên người học (ví dụ: Học viên Minh Anh)"
                  className="w-full mt-1 border border-outline rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary transition-colors bg-white disabled:bg-hover-bg disabled:text-secondary disabled:cursor-not-allowed text-primary"
                />
              </div>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Hiển thị bính âm (Pinyin)</span>
                  <span className="text-xs text-secondary text-left">In bính âm ở tiêu đề của từ vựng</span>
                </div>
                <input
                  type="checkbox"
                  checked={showPinyin}
                  onChange={(e) => setShowPinyin(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Luyện viết từng nét (Phân rã nét chữ)</span>
                  <span className="text-xs text-secondary text-left">Tự động phân rã nét viết của chữ (mặc định 14 ô ngang, tối đa 27 nét)</span>
                </div>
                <input
                  type="checkbox"
                  checked={strokeByStroke}
                  onChange={(e) => setStrokeByStroke(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Hiển thị ngữ nghĩa tiếng Việt</span>
                  <span className="text-xs text-secondary text-left">In nghĩa từ vựng cạnh tiêu đề chữ</span>
                </div>
                <input
                  type="checkbox"
                  checked={showMeaning}
                  onChange={(e) => setShowMeaning(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-surface border border-outline rounded-xl cursor-pointer hover:bg-hover-bg transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-primary">Hiển thị ghi chú cá nhân</span>
                  <span className="text-xs text-secondary text-left">In kèm ghi chú/ví dụ của bạn dưới dòng viết</span>
                </div>
                <input
                  type="checkbox"
                  checked={showNotes}
                  onChange={(e) => setShowNotes(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>
            </div>
          </div>

          {/* Advanced layout options */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-bold text-primary">Cấu hình lưới ô li nâng cao</label>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Số hàng ô li trống thêm dưới từng từ (0 - 5 hàng)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={extraRows}
                  onChange={(e) => setExtraRows(Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                  className="w-full border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Số trang ô li trống thêm ở cuối (0 - 10 trang)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={emptyPages}
                  onChange={(e) => setEmptyPages(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                  className="w-full border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-surface"
                />
              </div>

              {emptyPages > 0 && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    Kích thước ô của trang trống thêm
                  </label>
                  <select
                    value={emptyPageGridSize}
                    onChange={(e) => setEmptyPageGridSize(e.target.value as any)}
                    className="w-full border border-outline rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors bg-surface cursor-pointer"
                  >
                    <option value="auto">Tự động (Theo kích thước từ mẫu)</option>
                    <option value="2.0">Ô to 2.0 x 2.0 cm (Luyện từ ngắn)</option>
                    <option value="1.0">Ô nhỏ 1.0 x 1.0 cm (Luyện câu dài)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-outline/50 mt-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-outline rounded-xl font-medium text-secondary hover:bg-hover-bg transition-colors text-sm"
          >
            Đóng
          </button>
           <button
            type="button"
            onClick={handleExport}
            disabled={
              isAuthLoading ||
              (exportScope === 'selected' && selectedWordIds.length === 0) ||
              (limitInfo !== null && currentWordCount > limitInfo.max_words) ||
              (limitInfo !== null && limitInfo.remaining_count <= 0 && coinBalance < (strokeByStroke ? (limitInfo.pdf_stroke_export_cost ?? 3) : (limitInfo.pdf_normal_export_cost ?? 2)))
            }
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-40 text-sm shadow-sm flex items-center justify-center gap-1.5"
          >
            {isAuthLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Đang xác thực...
              </>
            ) : limitInfo && limitInfo.remaining_count <= 0 ? (
              <>
                <span className="material-symbols-outlined text-lg font-bold">payments</span>
                Xuất PDF ({strokeByStroke ? (limitInfo.pdf_stroke_export_cost ?? 3) : (limitInfo.pdf_normal_export_cost ?? 2)} Linh Thạch)
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">download</span>
                Tải File PDF
              </>
            )}
          </button>
        </div>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        <ConfirmModal
          isOpen={confirmBlockOpen}
          title={confirmBlockTitle}
          message={confirmBlockMessage}
          confirmText={confirmBlockConfirmText}
          cancelText={confirmBlockCancelText}
          showConfirmButton={confirmBlockShowConfirm}
          onConfirm={onConfirmAction}
          onCancel={onCancelAction}
        />
      </div>
    </div>
  );
}
