'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Persona, Message, EMOTION_MAP } from './types';
import ChatDrawer from './ChatDrawer';
import AlertModal from '@/components/AlertModal';
import { useCoinStore } from '@/store/useCoinStore';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/mediaUtils';
import { useAzureSpeech } from '@/hooks/useAzureSpeech';


interface ChatViewProps {
  persona: Persona;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text: string) => void;
  isSending: boolean;
  isConnected: boolean;
  hasMoreHistory: boolean;
  isLoadingHistory: boolean;
  onLoadMoreHistory: () => void;
  joyLevel: number;
  sadLevel: number;
  onDeletePersona: () => void;
  user: any;
  lang: string;
}

export default function ChatView({
  persona,
  messages,
  onBack,
  onSendMessage,
  isSending,
  isConnected,
  hasMoreHistory,
  isLoadingHistory,
  onLoadMoreHistory,
  joyLevel,
  sadLevel,
  onDeletePersona,
  user,
  lang,
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const { wallets, config: coinConfig } = useCoinStore();
  const currentLang = lang === 'en' ? 'en' : 'zh';
  const balance = wallets[currentLang as 'zh' | 'en']?.total ?? 0;
  const chatCost = coinConfig?.chat_message_cost ?? 1;

  const {
    transcript,
    interimTranscript,
    isListening: isSpeechListening,
    hasPermission: hasSpeechPermission,
    error: speechError,
    checkMicrophonePermission,
    startListening: startSpeechListening,
    stopListening: stopSpeechListening,
  } = useAzureSpeech();

  const wasListeningRef = useRef(false);
  const latestTranscriptRef = useRef('');

  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (speechError) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi ghi âm',
        message: speechError,
      });
    }
  }, [speechError]);

  useEffect(() => {
    if (wasListeningRef.current && !isSpeechListening) {
      const text = latestTranscriptRef.current.trim();
      if (text) {
        shouldScrollToBottomRef.current = true;
        onSendMessage(text);
      }
    }
    wasListeningRef.current = isSpeechListening;
  }, [isSpeechListening, onSendMessage]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAdjustmentRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const shouldScrollToBottomRef = useRef<boolean>(true);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Adjust scroll after messages change (for infinite scroll stability)
  useEffect(() => {
    if (scrollAdjustmentRef.current && chatContainerRef.current) {
      const target = chatContainerRef.current;
      const newScrollHeight = target.scrollHeight;
      const difference = newScrollHeight - scrollAdjustmentRef.current.scrollHeight;
      target.scrollTop = scrollAdjustmentRef.current.scrollTop + difference;
      scrollAdjustmentRef.current = null;
    } else if (shouldScrollToBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Keep tracking stream changes to force scroll to bottom
  const streamingMsg = messages.find(m => m.isStreaming);
  useEffect(() => {
    if (streamingMsg && shouldScrollToBottomRef.current) {
      scrollToBottom();
    }
  }, [streamingMsg?.text]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 5 && hasMoreHistory && !isLoadingHistory) {
      const previousScrollHeight = target.scrollHeight;
      scrollAdjustmentRef.current = {
        scrollHeight: previousScrollHeight,
        scrollTop: target.scrollTop,
      };
      shouldScrollToBottomRef.current = false;
      onLoadMoreHistory();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isSending || !isConnected) return;

    shouldScrollToBottomRef.current = true;
    onSendMessage(text);
    setInputValue('');
  };

  const handleAnswerQuiz = (quizId: number, selectedOption: string, correctAnswer: string) => {
    const isCorrect = selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setQuizResults((prev) => ({ ...prev, [quizId]: isCorrect }));
    setActiveQuizAnswers((prev) => ({ ...prev, [quizId]: selectedOption }));
  };

  const currentEmotionPreset = EMOTION_MAP[messages[messages.length - 1]?.emotion || 'neutral'] || EMOTION_MAP.neutral;

  const chineseFontStyle: React.CSSProperties = {
    fontFamily: '"Noto Serif SC", serif',
    fontOpticalSizing: 'auto',
    fontStyle: 'normal',
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-content-bg relative font-lexend">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200..900&display=swap" rel="stylesheet" />
      {/* Chat Header */}
      <div className="h-16 px-4 md:px-6 border-b border-outline flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-1 rounded-xl text-secondary hover:bg-hover-bg hover:text-primary transition-all focus:outline-none flex items-center justify-center"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>

          {/* Avatar & Info */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold overflow-hidden">
              {persona.avatar_url ? (
                <img
                  src={getMediaUrl(persona.avatar_url) || ''}
                  alt={persona.agent_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                persona.avatar_emoji || persona.agent_name.charAt(0) || '👩‍🏫'
              )}
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}></span>
          </div>

          <div>
            <h2 className="font-bold text-[15px] md:text-[16px] text-primary" style={chineseFontStyle}>{persona.agent_name}</h2>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-[10px] md:text-[11px] text-secondary font-medium">
                {isConnected ? 'Đang trực tuyến' : 'Đang kết nối lại...'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            title="Thông tin gia sư & Cấu hình"
            className={`p-2 rounded-xl text-secondary hover:bg-hover-bg hover:text-primary transition-all flex items-center justify-center focus:outline-none ${isRightSidebarOpen ? 'bg-hover-bg text-primary' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 md:p-6 overflow-y-auto sidebar-scroll space-y-6 bg-content-bg grid-blueprint"
      >
        {isLoadingHistory && (
          <div className="flex justify-center p-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-primary">psychology</span>
            </div>
            <h3 className="font-bold text-xl text-primary mt-2">Chưa có tin nhắn nào</h3>
            <p className="text-sm text-secondary max-w-[280px] mt-2 leading-relaxed">
              Hãy cùng bắt đầu trò chuyện để luyện phát âm và trau dồi ngôn ngữ nhé.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex gap-3 items-start justify-end animate-slide-up">
                  <div className="bg-primary text-white shadow-lg rounded-2xl rounded-tr-none p-4 md:p-5 max-w-[80%]">
                    <p className="font-body-base text-body-base leading-relaxed break-words" style={chineseFontStyle}>{msg.text}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md text-white font-bold text-sm overflow-hidden">
                    {user && user.avatar ? (
                      <Image
                        src={getMediaUrl(user.avatar) || ''}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user ? (
                        user.first_name && user.last_name
                          ? (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase()
                          : (user.first_name || user.username).substring(0, 2).toUpperCase()
                      ) : (persona.user_gender === 'female' ? 'Tỷ' : 'Huynh')
                    )}
                  </div>
                </div>
              );
            }

            // Agent Message
            const emotionPreset = EMOTION_MAP[msg.emotion || 'neutral'] || EMOTION_MAP.neutral;
            return (
              <div key={msg.id} className="flex gap-3 items-start animate-slide-up">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md text-white relative overflow-visible">
                  <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-primary/10">
                    {persona.avatar_url ? (
                      <img
                        src={getMediaUrl(persona.avatar_url) || ''}
                        alt={persona.agent_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">{persona.avatar_emoji || '👩‍🏫'}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 border border-outline flex items-center justify-center shadow-sm">
                    {emotionPreset.emoji}
                  </span>
                </div>
                <div className="bg-white shadow-sm rounded-2xl rounded-tl-none p-4 md:p-5 max-w-[85%] border border-outline/30 flex flex-col gap-3">
                  {/* Word card comparison 1x3 Grid layout without borders */}
                  <div className="grid grid-cols-1 gap-1 min-w-[200px] max-w-full">
                    <div>
                      <span className="font-bold text-blue-600 text-lg md:text-xl font-headline-sm select-all" style={chineseFontStyle}>{msg.text || '...'}</span>
                    </div>
                    {msg.pinyin && (
                      <div>
                        <span className="text-slate-600 text-sm italic select-all">/{msg.pinyin}/</span>
                      </div>
                    )}
                    {msg.translation && (
                      <div>
                        <p className="text-slate-800 text-sm leading-relaxed select-all">{msg.translation}</p>
                      </div>
                    )}
                  </div>

                  {/* Correction Details if exists */}
                  {msg.correction && (
                    <div className="p-4 bg-score-poor-bg border border-score-poor/20 rounded-xl flex gap-3 items-start">
                      <span className="material-symbols-outlined text-score-poor text-[20px] shrink-0 mt-0.5">school</span>
                      <div>
                        <div className="font-bold text-score-poor text-sm flex items-center gap-1.5">
                          <span>{persona.agent_name} sửa lỗi:</span>
                        </div>
                        <p className="text-[13px] text-slate-800 mt-1 leading-relaxed">
                          Chỗ chưa chuẩn: <span className="font-bold text-score-poor bg-rose-100 px-1 rounded" style={chineseFontStyle}>{msg.correction.mistake_highlight}</span>
                        </p>
                        <p className="text-[13px] text-secondary mt-1 leading-relaxed italic">
                          {msg.correction.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quizzes if exists */}
                  {msg.quizzes && msg.quizzes.length > 0 && (
                    <div className="p-4 bg-score-moderate-bg border border-score-moderate/20 rounded-xl space-y-4">
                      <div className="flex items-center gap-2 text-score-moderate font-bold">
                        <span className="material-symbols-outlined text-[18px]">star</span>
                        <span>Thử thách dành cho bạn:</span>
                      </div>

                      {msg.quizzes.map((quiz) => {
                        const hasAnswered = activeQuizAnswers[quiz.id] !== undefined;
                        const isCorrect = quizResults[quiz.id];

                        return (
                          <div key={quiz.id} className="border-t border-amber-200/30 pt-3 first:border-0 first:pt-0 space-y-2">
                            <p className="font-bold text-slate-800 leading-relaxed" style={chineseFontStyle}>{quiz.question}</p>

                            {quiz.options && quiz.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {quiz.options.map((opt) => {
                                  const isSelected = activeQuizAnswers[quiz.id] === opt;
                                  let btnClass = 'bg-white border-outline text-secondary hover:bg-amber-100/50';
                                  if (hasAnswered) {
                                    if (isSelected) {
                                      btnClass = isCorrect ? 'bg-emerald-500 border-emerald-500 text-white font-bold' : 'bg-rose-500 border-rose-500 text-white font-bold';
                                    } else if (opt.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                                      btnClass = 'bg-emerald-100 border-emerald-300 text-emerald-700 font-bold';
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      disabled={hasAnswered}
                                      onClick={() => handleAnswerQuiz(quiz.id, opt, quiz.answer)}
                                      className={`px-3 py-2 border rounded-xl text-left text-[13px] transition-all focus:outline-none ${btnClass}`}
                                      style={chineseFontStyle}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {hasAnswered && (
                              <p className={`text-[12px] font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isCorrect ? '✓ Hoàn toàn chính xác!' : <>✗ Chưa chính xác. Đáp án là: <span style={chineseFontStyle}>{quiz.answer}</span></>}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Footer Form */}
      <footer className="p-4 md:p-6 pb-8 bg-gradient-to-t from-content-bg via-content-bg/95 to-transparent shrink-0">
        {balance < chatCost && (
          <div className="max-w-4xl mx-auto mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-700 font-semibold shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-rose-500 text-base">error</span>
              Hết {currentLang === 'zh' ? 'Linh Thạch' : 'Coin'}! Nạp thêm hoặc học Flashcard để tiếp tục.
            </span>
            <Link href={`/${lang}/profile?tab=subs&subtab=coins`} className="text-primary hover:underline font-bold flex items-center gap-0.5">
              Nạp điểm <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          {isSpeechListening && (
            <div className="absolute left-1/2 -translate-x-1/2 -top-16 bg-slate-900/90 backdrop-blur text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-slate-700/50 z-50 text-xs md:text-sm max-w-[90%] whitespace-nowrap overflow-hidden">
              <div className="flex gap-0.5 items-end h-3 w-4 shrink-0">
                <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1"></div>
                <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-3"></div>
                <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2"></div>
                <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1.5"></div>
              </div>
              <div className="truncate font-medium max-w-[240px]">
                {interimTranscript || transcript || 'Đang nghe...'}
              </div>
            </div>
          )}

          <div className="absolute -inset-1 bg-gradient-to-r from-premium-start/20 to-premium-end/20 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl border border-outline/50 p-1.5 md:p-2 pl-3 md:pl-4 pr-2 flex items-center gap-2 md:gap-3">
            {/* Mic button */}
            {!hasSpeechPermission ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await checkMicrophonePermission();
                  if (ok) {
                    setAlertConfig({
                      isOpen: true,
                      type: 'success',
                      title: 'Đã cấp quyền',
                      message: 'Đã kích hoạt micro thành công! Bây giờ bạn có thể nhấn giữ nút để nói.',
                    });
                  }
                }}
                title="Nhấp để kích hoạt micro"
                className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-rose-50 group shrink-0 focus:outline-none"
              >
                <span className="material-symbols-outlined text-rose-500 text-[20px] md:text-[24px]">mic</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (balance < chatCost) {
                    setAlertConfig({
                      isOpen: true,
                      type: 'error',
                      title: 'Không đủ số dư',
                      message: 'Không đủ Linh thạch/Coin để gửi tin nhắn.',
                    });
                    return;
                  }
                  startSpeechListening(persona.learning_language);
                }}
                onMouseUp={() => stopSpeechListening()}
                onMouseLeave={() => stopSpeechListening()}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (balance < chatCost) {
                    setAlertConfig({
                      isOpen: true,
                      type: 'error',
                      title: 'Không đủ số dư',
                      message: 'Không đủ Linh thạch/Coin để gửi tin nhắn.',
                    });
                    return;
                  }
                  startSpeechListening(persona.learning_language);
                }}
                onTouchEnd={() => stopSpeechListening()}
                className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 group shrink-0 focus:outline-none select-none touch-none ${
                  isSpeechListening 
                    ? 'bg-emerald-500 text-white shadow-lg scale-110' 
                    : 'hover:bg-hover-bg text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] md:text-[24px] ${isSpeechListening ? 'text-white' : 'text-on-surface-variant group-hover:text-primary'}`}>
                  {isSpeechListening ? 'graphic_eq' : 'mic'}
                </span>
              </button>
            )}

            <div className="h-6 w-[1px] bg-outline shrink-0"></div>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isSending || !isConnected || balance < chatCost}
              placeholder={balance < chatCost ? `Vui lòng nạp thêm ${currentLang === 'zh' ? 'Linh Thạch' : 'Coin'}...` : isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
              className="flex-1 border-none focus:ring-0 bg-transparent text-sm md:text-body-base py-3 px-1 md:px-2 placeholder:text-on-surface-variant/40 outline-none focus:outline-none text-slate-800 disabled:opacity-50"
              style={chineseFontStyle}
            />

            <div className="shrink-0">
              <button
                type="submit"
                disabled={isSending || !inputValue.trim() || !isConnected || balance < chatCost}
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary text-white hover:bg-[#334155] active:scale-95 flex items-center justify-center shadow-lg transition-all disabled:opacity-50 focus:outline-none shrink-0"
                title="Gửi"
              >
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">send</span>
              </button>
            </div>
          </div>
          
          {/* Cost Indicator & Balance details */}
          <div className="flex justify-between items-center px-4 mt-2 text-[10px] text-secondary font-bold">
            <span>Chi phí: {currentLang === 'zh' ? '💎' : '🪙'} {chatCost} / tin nhắn</span>
            <span>Số dư: {balance}</span>
          </div>
        </form>
      </footer>

      {/* Slide-in Sidebar Drawer */}
      <ChatDrawer
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
        activePersona={persona}
        joyLevel={joyLevel}
        sadLevel={sadLevel}
        onDeletePersona={onDeletePersona}
        currentEmotionEmoji={currentEmotionPreset.emoji}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
