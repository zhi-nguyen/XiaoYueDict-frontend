'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { djangoClient } from '@/lib/apiClient';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getGuestId } from '@/lib/guest';
import { useAuthStore } from '@/store/useAuthStore';
import { playTTSWithClientCache } from '@/lib/zhUtils';

interface TranslationRecord {
  original: string;
  translated: string;
  source: string;
  timestamp: number;
}

const capitalizeSentences = (text: string): string => {
  if (!text) return '';
  return text.replace(/(^\s*|[.!?\n]\s*)(\S)/g, (match, separator, letter) => {
    return separator + letter.toUpperCase();
  });
};

export default function TranslateClient() {
  const params = useParams();
  const language = (params?.lang as string) === 'en' ? 'en' : 'zh';

  const defaultDirection = language === 'en' ? 'en_vi' : 'zh_vi';
  const [direction, setDirection] = useState<'zh_vi' | 'vi_zh' | 'en_vi' | 'vi_en'>(defaultDirection);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translationSource, setTranslationSource] = useState('');
  const [history, setHistory] = useState<TranslationRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [translationPhase, setTranslationPhase] = useState<'idle' | 'processing' | 'error' | 'success'>('idle');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState('');

  // Update direction default when language URL param changes
  useEffect(() => {
    setDirection(language === 'en' ? 'en_vi' : 'zh_vi');
    handleClear();
  }, [language]);

  const handleSwapDirection = () => {
    const nextDirection = 
      direction === 'zh_vi' ? 'vi_zh' :
      direction === 'vi_zh' ? 'zh_vi' :
      direction === 'en_vi' ? 'vi_en' : 'en_vi';
    
    setDirection(nextDirection);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setErrorMsg('');
    setTranslationPhase('idle');
  };

  const { isAuthenticated } = useAuthStore();

  // Listen for WS translation results
  useWebSocket({
    onMessage: (msg) => {
      console.log('[TranslateClient] onMessage received:', msg.type, 'payload task_id:', msg.payload?.task_id, 'currentTaskId:', currentTaskId);
      if (!currentTaskId || msg.payload?.task_id !== currentTaskId) {
        console.log('[TranslateClient] Ignored message (task ID mismatch or no active task)');
        return;
      }

      if (msg.type === 'translation_complete') {
        const payload = msg.payload as any;
        setTranslationResult(payload, pendingText);
        setIsLoading(false);
        setTranslationPhase('success');
        setCurrentTaskId(null);
      } else if (msg.type === 'translation_failed') {
        const payload = msg.payload as any;
        setErrorMsg(payload.error || 'Dịch thuật thất bại');
        setIsLoading(false);
        setTranslationPhase('error');
        setCurrentTaskId(null);
      }
    }
  });

  // UseEffect for Hydration safe LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse translation history', e);
      }
    }
  }, []);

  const handleTranslate = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    setIsLoading(true);
    setTranslationPhase('processing');
    setTranslatedText('');
    setTranslationSource('');
    setErrorMsg('');
    setCurrentTaskId(null);
    setPendingText(trimmedInput);

    try {
      const payload: any = { 
        text: trimmedInput,
        direction: direction
      };
      const guestId = !isAuthenticated ? getGuestId() : null;
      if (guestId) {
        payload.guest_id = guestId;
      }

      const response = await djangoClient.post(`/dictionary/${language}/translate/`, payload);
      const data = response.data;

      if (data.status === 'SUCCESS') {
        // Fallback or immediate return
        setTranslationResult(data, trimmedInput);
        setIsLoading(false);
        setTranslationPhase('success');
      } else if (data.task_id) {
        setCurrentTaskId(data.task_id);
      } else {
        throw new Error('Định dạng phản hồi không hợp lệ');
      }
      
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || error.message || 'Lỗi kết nối máy chủ');
      setIsLoading(false);
      setTranslationPhase('error');
    }
  };

  const setTranslationResult = (data: any, originalText: string) => {
    const formattedText = capitalizeSentences(data.translatedText);
    setTranslatedText(formattedText);
    setTranslationSource(data.source);

    // Save to history
    const newRecord: TranslationRecord = {
      original: originalText,
      translated: formattedText,
      source: data.source,
      timestamp: Date.now()
    };
    
    setHistory((prevHistory) => {
      const newHistory = [newRecord, ...prevHistory].slice(0, 50); // Keep last 50
      localStorage.setItem('translationHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setTranslationSource('');
    setErrorMsg('');
    setTranslationPhase('idle');
  };

  const sourceLangLabel = direction === 'zh_vi' ? 'Tiếng Trung' : direction === 'en_vi' ? 'Tiếng Anh' : 'Tiếng Việt';
  const targetLangLabel = direction === 'zh_vi' || direction === 'en_vi' ? 'Tiếng Việt' : direction === 'vi_zh' ? 'Tiếng Trung' : 'Tiếng Anh';
  const textPlaceholder = direction === 'zh_vi' ? 'Nhập văn bản tiếng Trung cần dịch...' : direction === 'en_vi' ? 'Nhập văn bản tiếng Anh cần dịch...' : 'Nhập văn bản tiếng Việt cần dịch...';

  return (
    <div className="flex flex-col min-h-full gap-6">
      {/* Direction Selector bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-surface px-6 py-2.5 rounded-2xl border border-outline shadow-sm w-full max-w-[360px] mx-auto">
        <span className="font-bold text-primary text-[15px] text-left truncate">{sourceLangLabel}</span>
        <button
          onClick={handleSwapDirection}
          className="p-1.5 rounded-full hover:bg-hover-bg text-secondary hover:text-primary transition-all border border-outline hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Đổi chiều dịch"
        >
          <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
        </button>
        <span className="font-bold text-primary text-[15px] text-left truncate pl-2">{targetLangLabel}</span>
      </div>

      {/* Translation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-shrink-0">
        
        {/* Left Column - Input */}
        <div className="flex flex-col bg-surface rounded-2xl border border-outline shadow-sm overflow-hidden min-h-[240px]">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline">
            <span className="font-semibold text-secondary">{sourceLangLabel}</span>
            <div className="flex items-center gap-2">
              {direction !== 'vi_zh' && direction !== 'vi_en' && inputText.trim() && (
                <button
                  onClick={() => playTTSWithClientCache(inputText, direction === 'zh_vi' ? 'zh' : 'en')}
                  className="text-secondary/60 hover:text-primary transition-colors p-1 flex items-center"
                  title="Nghe phát âm"
                >
                  <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </button>
              )}
              {inputText && (
                <button 
                  onClick={handleClear}
                  className="text-secondary/60 hover:text-error transition-colors p-1 flex items-center"
                  title="Xóa văn bản"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={textPlaceholder}
            className="flex-1 w-full resize-none p-4 bg-transparent outline-none text-[16px] text-primary min-h-[140px]"
            spellCheck="false"
          />
          <div className="px-4 py-3 flex justify-end border-t border-outline/50 bg-background/50">
            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${
                isLoading || !inputText.trim() 
                  ? 'bg-outline text-secondary/50 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Đang dịch...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">translate</span>
                  <span>Dịch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="flex flex-col bg-surface rounded-2xl border border-outline shadow-sm overflow-hidden min-h-[240px]">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline">
            <span className="font-semibold text-secondary">{targetLangLabel}</span>
            <div className="flex items-center gap-2">
              {(direction === 'vi_zh' || direction === 'vi_en') && translatedText.trim() && (
                <button
                  onClick={() => playTTSWithClientCache(translatedText, direction === 'vi_zh' ? 'zh' : 'en')}
                  className="text-secondary/60 hover:text-primary transition-colors p-1 flex items-center"
                  title="Nghe phát âm"
                >
                  <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </button>
              )}
              <button 
                onClick={handleCopy}
                disabled={!translatedText}
                className={`p-1 transition-colors ${translatedText ? 'text-secondary hover:text-primary' : 'text-outline cursor-not-allowed'} flex items-center`}
                title="Sao chép"
              >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
            </div>
          </div>
          <div className={`flex-1 w-full p-4 overflow-y-auto ${(!translatedText || (translationPhase !== 'idle' && translationPhase !== 'success')) ? 'flex flex-col justify-center items-center' : ''}`}>
            {translationPhase !== 'idle' && translationPhase !== 'success' ? (
              <div className="w-full max-w-md">
                <SmartQueueStatus
                  phase={translationPhase}
                  strategy={language === 'en' ? QUEUE_STRATEGIES.translation_en : QUEUE_STRATEGIES.translation_zh}
                  onRetry={handleTranslate}
                  errorMessage={errorMsg}
                />
              </div>
            ) : translatedText ? (
              <p className="text-[16px] text-primary whitespace-pre-wrap w-full">{translatedText}</p>
            ) : (
              <p className="text-secondary/40 italic">Kết quả bản dịch sẽ hiển thị ở đây...</p>
            )}
          </div>
          
          {/* Badge */}
          {translationSource && (
            <div className="px-4 py-3 flex justify-end border-t border-outline/50 bg-background/50">
              {translationSource === 'database' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-green-100 text-green-700 border border-green-200">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Dịch chuẩn từ hệ thống
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Dịch tham khảo
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-outline shadow-sm overflow-hidden min-h-[300px]">
          <div className="px-5 py-4 border-b border-outline">
            <h2 className="font-semibold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">history</span>
              Lịch sử dịch thuật
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex flex-col gap-2">
              {history.map((item, idx) => (
                <div key={idx} className="flex flex-col p-4 hover:bg-hover-bg rounded-xl transition-colors cursor-pointer border border-transparent hover:border-outline/50" onClick={() => {
                  setInputText(item.original);
                  setTranslatedText(item.translated);
                  setTranslationSource(item.source);
                }}>
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-primary font-medium line-clamp-1 flex-1">{item.original}</p>
                    {item.source === 'database' ? (
                      <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                        Hệ thống
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                        Dịch tham khảo
                      </span>
                    )}
                  </div>
                  <p className="text-secondary text-[14px] mt-1 line-clamp-2">{item.translated}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
