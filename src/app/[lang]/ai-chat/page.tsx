'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { djangoClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

// Component Imports
import { Persona, Message } from './_components/types';
import TutorListView from './_components/TutorListView';
import TutorSetupModal from './_components/TutorSetupModal';
import ChatView from './_components/ChatView';
import { useCoinStore } from '@/store/useCoinStore';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';


export default function AIChatPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  const { user } = useAuthStore();
  const userId = user?.id;

  // Navigation states (Zalo-style 3-view layout)
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

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

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Data states
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState<boolean>(true);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Dynamic emotion levels for active persona
  const [joyLevel, setJoyLevel] = useState<number>(0.5);
  const [sadLevel, setSadLevel] = useState<number>(0.1);

  // Networking states
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [dbOffset, setDbOffset] = useState(0);

  // Audio Playback Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSentenceChunksRef = useRef<BlobPart[]>([]);
  const sentenceQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // WS Gateway Connection Ref
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  const activePersonaRef = useRef<Persona | null>(null);
  useEffect(() => {
    activePersonaRef.current = activePersona;
  }, [activePersona]);

  // Fetch all personas list
  const fetchPersonas = async () => {
    if (!user) return;
    setIsLoadingPersonas(true);
    try {
      const { data } = await djangoClient.get('/xiaoyue-chat/personas/');
      setPersonas(data || []);
    } catch (err) {
      console.error('Failed to fetch personas:', err);
    } finally {
      setIsLoadingPersonas(false);
    }
  };

  // Fetch chat history for selected persona
  const fetchChatHistory = async (isFirstLoad: boolean = false, targetPersonaId?: string) => {
    const pId = targetPersonaId || activePersona?.id;
    if (!user || isLoadingHistory || !pId) return;

    setIsLoadingHistory(true);
    try {
      const url = isFirstLoad
        ? `/xiaoyue-chat/history/?persona_id=${pId}`
        : `/xiaoyue-chat/history/?persona_id=${pId}&db_offset=${dbOffset}&limit=20`;

      const { data } = await djangoClient.get(url);
      const fetchedMessages: Message[] = data.history || [];

      if (isFirstLoad) {
        setMessages(fetchedMessages);
      } else {
        setMessages((prev) => [...fetchedMessages, ...prev]);
      }

      setDbOffset(data.db_offset || 0);
      setHasMoreHistory(data.has_more ?? false);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Play next audio sentence chunk
  const playNextSentence = useCallback(() => {
    if (isPlayingRef.current) return;
    if (sentenceQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    const blob = sentenceQueueRef.current.shift();
    if (!blob) return;

    isPlayingRef.current = true;
    
    // Detach previous event handlers before changing source to avoid abort errors
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      try {
        audioRef.current.pause();
      } catch (e) {}
    } else {
      audioRef.current = new Audio();
    }
 
    const url = URL.createObjectURL(blob);
    audioRef.current.src = url;
 
    audioRef.current.onended = () => {
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      playNextSentence();
    };
 
    audioRef.current.onerror = (e) => {
      // Only log true errors, ignore abort events when src is cleared/empty
      if (audioRef.current && audioRef.current.src && audioRef.current.src !== window.location.href) {
        console.error('Audio playback error:', e);
      }
      URL.revokeObjectURL(url);
      isPlayingRef.current = false;
      playNextSentence();
    };
 
    audioRef.current.play().catch((err) => {
      console.warn('Playback play failed:', err);
      isPlayingRef.current = false;
      playNextSentence();
    });
  }, []);
 
  const appendAudioBuffer = useCallback((buffer: ArrayBuffer) => {
    currentSentenceChunksRef.current.push(buffer);
  }, []);
 
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        // Clear event handlers first to prevent abort/empty src errors
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch (e) {}
    }
    sentenceQueueRef.current = [];
    currentSentenceChunksRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((event: MessageEvent) => {
    if (event.data instanceof ArrayBuffer) {
      appendAudioBuffer(event.data);
      return;
    }

    if (typeof event.data !== 'string') return;

    let msg: any;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    const msgType = msg.type;

    // Handle global tutor_avatar_complete event
    if (msgType === 'tutor_avatar_complete') {
      const payload = msg.payload;
      if (payload && payload.persona_id && payload.avatar_url) {
        const { persona_id, avatar_url } = payload;
        
        // 1. Update the personas list
        setPersonas((prev) =>
          prev.map((p) => (p.id === persona_id ? { ...p, avatar_url } : p))
        );
        
        // 2. Update activePersona if it matches
        if (activePersonaRef.current && activePersonaRef.current.id === persona_id) {
          setActivePersona((prev) => prev ? { ...prev, avatar_url } : null);
        }
      }
      return;
    }

    const payload = msg.payload;
    if (payload && payload.persona_id && activePersonaRef.current && payload.persona_id !== activePersonaRef.current.id) {
      return;
    }

    if (msgType === 'audio_sentence_start') {
      currentSentenceChunksRef.current = [];
      return;
    }

    if (msgType === 'audio_sentence_end') {
      if (currentSentenceChunksRef.current.length > 0) {
        const blob = new Blob(currentSentenceChunksRef.current, { type: 'audio/mpeg' });
        sentenceQueueRef.current.push(blob);
        currentSentenceChunksRef.current = [];
        playNextSentence();
      }
      return;
    }

    if (msgType === 'ai_chat_chunk') {
      const payload = msg.payload;
      if (!payload) return;

      const { text, emotion } = payload;

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.sender === 'agent' && lastMsg.isStreaming) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              text: lastMsg.text + text,
              emotion: emotion || lastMsg.emotion,
            },
          ];
        }
        return prev;
      });
    } else if (msgType === 'ai_chat_complete') {
      const payload = msg.payload;
      if (!payload || !payload.response) return;

      const response = payload.response;

      // Handle AI/server errors (like 429 rate limits or 500 exceptions)
      if (payload.error_code) {
        setIsSending(false);
        
        // Show AlertModal with error message and refund notice
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: payload.error_code === '429' ? 'Hệ thống bận (429)' : 'Lỗi hệ thống',
          message: response.translation_hint || 'Giao tiếp với hệ thống AI thất bại. Điểm của bạn đã được hoàn trả!',
        });

        // Delete the sent message and streaming placeholder from local messages list
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== 'stream-placeholder');
          if (filtered.length > 0 && filtered[filtered.length - 1].sender === 'user') {
            return filtered.slice(0, -1);
          }
          return filtered;
        });

        // Sync coin wallet balance after refund
        useCoinStore.getState().fetchWalletBalances(true);
        return;
      }

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        const baseMsg = {
          id: msg.id || Math.random().toString(),
          sender: 'agent' as const,
          text: response.target_text || response.chinese_content || lastMsg?.text || '',
          translation: response.translation_hint || response.vietnamese_display,
          pinyin: response.phonetic_guide || response.pinyin,
          emotion: response.emotion,
          thought: response.thought,
          correction: response.correction_detail,
          quizzes: response.quiz_list,
          isStreaming: false,
        };

        if (lastMsg && lastMsg.sender === 'agent' && lastMsg.isStreaming) {
          return [...prev.slice(0, -1), baseMsg];
        }
        return [...prev, baseMsg];
      });

      setIsSending(false);

      if (payload.active_joy !== undefined) {
        setJoyLevel(payload.active_joy);
      }
      if (payload.active_sad !== undefined) {
        setSadLevel(payload.active_sad);
      }
    }
  }, [playNextSentence, appendAudioBuffer]);

  // Connect to ws-gateway
  const connectSocket = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current) return;
    isConnectingRef.current = true;

    stopAudio();
    setIsConnected(false);

    if (!userId) {
      isConnectingRef.current = false;
      return;
    }

    try {
      const { data } = await djangoClient.get('/users/ws-token');

      if (wsRef.current) {
        isConnectingRef.current = false;
        return;
      }

      const wsToken = data.ws_token;
      const actualUserId = data.user_id;

      let baseWsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!baseWsUrl && process.env.NEXT_PUBLIC_API_URL) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const wsProtocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
        const host = apiUrl.replace(/^https?:\/\//, '');
        baseWsUrl = `${wsProtocol}//${host}/ws`;
      }
      if (!baseWsUrl) {
        baseWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}/ws`;
      }

      const cleanBaseWsUrl = baseWsUrl.endsWith('/') ? baseWsUrl.slice(0, -1) : baseWsUrl;
      const wsUrl = `${cleanBaseWsUrl}/${actualUserId}?token=${wsToken}`;

      const socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        isConnectingRef.current = false;
      };

      socket.onmessage = handleWsMessage;

      socket.onclose = () => {
        setIsConnected(false);
        isConnectingRef.current = false;
        wsRef.current = null;
      };

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        isConnectingRef.current = false;
        wsRef.current = null;
      };
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
      isConnectingRef.current = false;
    }
  }, [userId, stopAudio, handleWsMessage]);

  // Delete the current tutor persona and all related messages
  const executeDeletePersona = async () => {
    if (!activePersona) return;
    try {
      stopAudio();
      await djangoClient.delete('/xiaoyue-chat/persona/', {
        data: { persona_id: activePersona.id }
      });
      await fetchPersonas();
      setActivePersona(null);
      setMessages([]);
      setCurrentView('list');
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Thành công',
        message: 'Đã xoá kết nối với gia sư.',
      });
    } catch (err) {
      console.error('Failed to delete persona:', err);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xoá kết nối gia sư.',
      });
    }
  };

  const handleDeletePersona = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xoá gia sư',
      message: 'Bạn có chắc chắn muốn xoá kết nối với Gia sư này? Toàn bộ thiết lập gia sư và lịch sử tin nhắn liên quan sẽ bị xoá vĩnh viễn.',
      onConfirm: executeDeletePersona,
    });
  };


  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text || isSending || !isConnected || !activePersona) return;

    const coinLang = activePersona.learning_language === 'en' ? 'en' : 'zh';
    const cost = useCoinStore.getState().config?.chat_message_cost ?? 1;

    // 1. Snapshot state
    const walletSnapshot = structuredClone(useCoinStore.getState().wallets);

    // 2. Optimistic spend
    useCoinStore.getState().optimisticSpend(coinLang, cost);

    setIsSending(true);
    stopAudio();

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    const streamingPlaceholder: Message = {
      id: 'stream-placeholder',
      sender: 'agent',
      text: '',
      isStreaming: true,
      emotion: 'neutral',
    };
    setMessages((prev) => [...prev, streamingPlaceholder]);

    try {
      await djangoClient.post('/xiaoyue-chat/send/', {
        user_text: text,
        persona_id: activePersona.id,
      });
      // Sync balance with server
      useCoinStore.getState().fetchWalletBalances(true);
    } catch (err: any) {
      console.error('Failed to send chat request:', err);
      
      // 3. Rollback
      useCoinStore.setState({ wallets: walletSnapshot });
      
      setIsSending(false);
      setMessages((prev) => prev.filter((m) => m.id !== 'stream-placeholder'));
      
      if (err.response?.status === 403) {
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Không đủ số dư',
          message: 'Không đủ Linh thạch/Coin để gửi tin nhắn. Vui lòng học thêm Flashcard!',
        });
        useCoinStore.getState().fetchWalletBalances(true);
      } else {
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Lỗi',
          message: 'Gửi tin nhắn thất bại. Điểm của bạn đã được hoàn lại!',
        });
      }
    }
  };

  const { fetchWalletBalances, fetchCoinConfig } = useCoinStore();

  // Initialize view and websocket on mount
  useEffect(() => {
    if (userId) {
      fetchPersonas();
      connectSocket();
      fetchWalletBalances();
      fetchCoinConfig();
    }

    return () => {
      stopAudio();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [connectSocket, stopAudio, userId, fetchWalletBalances, fetchCoinConfig]);

  // Load chat history when active tutor changes
  useEffect(() => {
    if (activePersona?.id) {
      setDbOffset(0);
      setHasMoreHistory(true);
      fetchChatHistory(true, activePersona.id);
    }
  }, [activePersona?.id]);

  // If user is not authenticated
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface h-[calc(100vh-72px)] font-lexend">
        <div className="text-center p-8">
          <span className="material-symbols-outlined text-6xl text-slate-300">lock</span>
          <h3 className="font-bold text-lg text-primary mt-4">Vui lòng đăng nhập</h3>
          <p className="text-sm text-secondary max-w-sm mt-2 leading-relaxed">
            Tính năng trò chuyện với AI chỉ dành cho thành viên đã đăng nhập.
          </p>
        </div>
      </div>
    );
  }

  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    setJoyLevel(persona.joy_current ?? 0.5);
    setSadLevel(persona.sad_current ?? 0.1);
    setCurrentView('chat');
  };

  const handlePersonaCreated = (newPersona: Persona) => {
    fetchPersonas();
    setActivePersona(newPersona);
    setJoyLevel(newPersona.joy_current ?? 0.5);
    setSadLevel(newPersona.sad_current ?? 0.1);
    setMessages([]);
    setCurrentView('chat');
  };

  return (
    <div className="flex-1 flex bg-surface h-full overflow-hidden font-lexend relative ai-chat-page-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        div:has(> .ai-chat-page-container) {
            overflow: hidden !important;
            height: 100% !important;
        }
        .grid-blueprint {
            background-size: 30px 30px;
            background-image: linear-gradient(to right, #E2E8F0 1px, transparent 1px),
                              linear-gradient(to bottom, #E2E8F0 1px, transparent 1px);
        }
        .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
            background: #E2E8F0;
            border-radius: 10px;
        }
      ` }} />

      {/* Render matching view */}
      {currentView === 'list' ? (
        <TutorListView
          personas={personas}
          isLoading={isLoadingPersonas}
          onSelectPersona={handleSelectPersona}
          onOpenSetup={() => setIsSetupModalOpen(true)}
        />
      ) : activePersona ? (
        <ChatView
          persona={activePersona}
          messages={messages}
          onBack={() => setCurrentView('list')}
          onSendMessage={handleSendMessage}
          isSending={isSending}
          isConnected={isConnected}
          hasMoreHistory={hasMoreHistory}
          isLoadingHistory={isLoadingHistory}
          onLoadMoreHistory={() => fetchChatHistory(false)}
          joyLevel={joyLevel}
          sadLevel={sadLevel}
          onDeletePersona={handleDeletePersona}
          user={user}
          lang={lang}
        />
      ) : null}

      {/* Setup Tutor Modal */}
      <TutorSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onCreated={handlePersonaCreated}
        lang={lang}
        defaultName={user.first_name || user.username || ''}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={true}
        onConfirm={() => {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
          confirmConfig.onConfirm();
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
