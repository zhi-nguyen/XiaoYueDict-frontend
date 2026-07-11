'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { djangoClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

// Preset values for Wuxia roles
// Preset values for contexts, roles and topics based on learning language
const CONTEXT_SETTINGS = [
  { value: 'wuxia', label: 'Cổ trang / Giang hồ', langs: ['zh'] },
  { value: 'modern', label: 'Hiện đại / Công sở', langs: ['zh', 'en'] },
  { value: 'academic', label: 'Học đường / Học thuật', langs: ['zh', 'en'] },
];

const ROLE_MAP: Record<string, { value: string; label: string }[]> = {
  wuxia: [
    { value: 'Sư huynh', label: 'Sư huynh (Vai Nam)' },
    { value: 'Sư tỷ', label: 'Sư tỷ (Vai Nữ)' },
    { value: 'Đệ đệ', label: 'Đệ đệ' },
    { value: 'Tỷ tỷ', label: 'Tỷ tỷ' },
  ],
  modern: [
    { value: 'Đồng nghiệp', label: 'Đồng nghiệp (Colleagues)' },
    { value: 'Bạn thân', label: 'Bạn thân (Friends)' },
    { value: 'Người yêu', label: 'Người yêu / Crush' },
    { value: 'Phỏng vấn', label: 'Phỏng vấn xin việc (Job Interview)' },
  ],
  academic: [
    { value: 'Nghiên cứu sinh', label: 'Giáo sư (Oxford/PKU)' },
    { value: 'Bạn cùng lớp', label: 'Bạn cùng phòng / Học nhóm' },
  ]
};

const LEVEL_MAP: Record<string, { value: string; label: string }[]> = {
  zh: [
    { value: 'Beginner', label: 'Sơ cấp HSK 1-2' },
    { value: 'Intermediate', label: 'Trung cấp HSK 3-4' },
    { value: 'Advanced', label: 'Cao cấp HSK 5-6' },
  ],
  en: [
    { value: 'Beginner', label: 'Sơ cấp (A1-A2)' },
    { value: 'Intermediate', label: 'Trung cấp (B1-B2)' },
    { value: 'Advanced', label: 'Cao cấp (C1-C2)' },
  ]
};

const TOPIC_MAP: Record<string, { value: string; label: string }[]> = {
  wuxia: [
    { value: 'Daily Conversation', label: 'Hội thoại hàng ngày' },
    { value: 'Ordering Food at Tavern', label: 'Gọi món ở Tửu điếm' },
    { value: 'Asking for Directions in Jianghu', label: 'Hỏi đường hành tẩu Giang hồ' },
    { value: 'Martial Arts Sparring', label: 'Thảo luận võ học' },
  ],
  modern: [
    { value: 'Daily Conversation', label: 'Trò chuyện hàng ngày' },
    { value: 'Office Talk', label: 'Chuyện công sở' },
    { value: 'Job Interviewing', label: 'Trả lời Phỏng vấn' },
    { value: 'Shopping & Travel', label: 'Mua sắm & Du lịch' },
  ],
  academic: [
    { value: 'Research Discussion', label: 'Thảo luận Luận văn / Đề tài' },
    { value: 'Laboratory Work', label: 'Nghiên cứu phòng thí nghiệm' },
    { value: 'Debating Theory', label: 'Tranh luận lý thuyết học thuật' },
  ]
};

// Dynamic Persona Card Details based on Role
const PERSONA_DETAILS: Record<string, { name: string; tag: string; desc: string }> = {
  "Sư huynh": { name: "Tiểu Nguyệt", tag: "Sư muội (Tsundere)", desc: "Sư muội bướng bỉnh nhưng cực kỳ quan tâm sư huynh. Đồng hành sửa lỗi phát âm và đàm đạo võ học!" },
  "Sư tỷ": { name: "A Lang / Junior", tag: "Sư đệ ngoan ngoãn", desc: "Sư đệ kính trọng sư tỷ, luôn lắng nghe và học hỏi võ công." },
  "Đệ đệ": { name: "Vân tỷ tỷ", tag: "Tỷ tỷ ác ma", desc: "Tỷ tỷ cực kỳ nghiêm khắc, phê bình lỗi sai không nể nang nhưng rất thương đệ đệ." },
  "Tỷ tỷ": { name: "Tiểu Bảo / Sister", tag: "Muội muội nhõng nhẽo", desc: "Muội muội bé bỏng rất thích bám lấy tỷ tỷ, hay nũng nịu đòi dạy chữ Hán." },
  "Đồng nghiệp": { name: "Tiểu Lâm / Colleague", tag: "Đồng nghiệp vui tính", desc: "Đồng nghiệp cùng phòng năng động, chia sẻ những câu chuyện và thuật ngữ công sở thực tế." },
  "Bạn thân": { name: "A Bảo / Bestie", tag: "Bạn thân chí cốt", desc: "Người bạn chí cốt cùng phòng, trò chuyện thân thiết, tự nhiên và dùng nhiều từ lóng." },
  "Người yêu": { name: "Tuyết Nhi / Crush", tag: "Crush ngọt ngào", desc: "Người yêu đáng yêu, hay dỗi hờn nhẹ nhàng khi bạn trêu đùa." },
  "Phỏng vấn": { name: "Giám khảo Lâm / Interviewer", tag: "Nhà tuyển dụng", desc: "Người phỏng vấn lịch sự nhưng nghiêm túc, đặt câu hỏi kiểm tra năng lực giao tiếp và tư duy." },
  "Nghiên cứu sinh": { name: "Giáo sư Vương / Prof. Vance", tag: "Giáo sư hướng dẫn", desc: "Giáo sư có kiến thức chuyên môn cao, giúp thẩm định bài viết học thuật và chỉ dạy kỹ lưỡng." },
  "Bạn cùng lớp": { name: "Minh Triết / Classmate", tag: "Bạn cùng lớp", desc: "Người bạn học nhóm chăm chỉ, cùng bạn giải bài tập lớn và chuẩn bị thi cử." }
};

interface QuizItem {
  id: number;
  type: 'fill_blank' | 'multiple_choice' | 'listening';
  question: string;
  options?: string[];
  answer: string;
}

interface CorrectionDetail {
  is_correct: boolean;
  mistake_highlight?: string;
  explanation?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  translation?: string;
  pinyin?: string;
  emotion?: string;
  thought?: string;
  correction?: CorrectionDetail;
  quizzes?: QuizItem[];
  isStreaming?: boolean;
}

const EMOTION_MAP: Record<string, { emoji: string; text: string; bg: string; border: string }> = {
  neutral: { emoji: '😐', text: 'Bình thường', bg: 'bg-slate-100', border: 'border-slate-300' },
  happy: { emoji: '😊', text: 'Vui vẻ', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  excited: { emoji: '😄', text: 'Phấn khích', bg: 'bg-amber-50', border: 'border-amber-300' },
  cheerful: { emoji: '😃', text: 'Hớn hở', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  strict: { emoji: '👩‍🏫', text: 'Nghiêm khắc', bg: 'bg-rose-50', border: 'border-rose-300' },
  concerned: { emoji: '😟', text: 'Lo lắng', bg: 'bg-sky-50', border: 'border-sky-300' },
  sulking: { emoji: '😤', text: 'Hờn dỗi', bg: 'bg-purple-50', border: 'border-purple-300' },
  angry: { emoji: '😡', text: 'Tức giận', bg: 'bg-red-50', border: 'border-red-300' },
};

export default function AIChatPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'zh';

  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [contextSetting, setContextSetting] = useState(lang === 'zh' ? 'wuxia' : 'modern');
  const [selectedRole, setSelectedRole] = useState(lang === 'zh' ? 'Sư huynh' : 'Đồng nghiệp');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedTopic, setSelectedTopic] = useState('Daily Conversation');
  const [sulkingLevel, setSulkingLevel] = useState(0);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});

  // Sync selectedRole and selectedTopic dynamically when contextSetting changes
  useEffect(() => {
    const roles = ROLE_MAP[contextSetting] || [];
    if (roles.length > 0 && !roles.some(r => r.value === selectedRole)) {
      setSelectedRole(roles[0].value);
    }
    const topics = TOPIC_MAP[contextSetting] || [];
    if (topics.length > 0 && !topics.some(t => t.value === selectedTopic)) {
      setSelectedTopic(topics[0].value);
    }
  }, [contextSetting, selectedRole, selectedTopic]);

  // WS Gateway Connection Ref (shared WebSocket for all notifications)
  const wsRef = useRef<WebSocket | null>(null);

  // Audio Playback Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSentenceChunksRef = useRef<BlobPart[]>([]);
  const sentenceQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Playback Executor for Sentence-by-Sentence Queue Player
  const playNextSentence = useCallback(() => {
    if (isPlayingRef.current) return;
    if (sentenceQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    const blob = sentenceQueueRef.current.shift();
    if (!blob) return;

    isPlayingRef.current = true;
    if (!audioRef.current) {
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
      console.error('Audio playback error:', e);
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

  // Append incoming raw audio chunks
  const appendAudioBuffer = useCallback((buffer: ArrayBuffer) => {
    currentSentenceChunksRef.current.push(buffer);
  }, []);

  // Stop active playback and clear queues
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch (e) {
        // Ignored
      }
    }
    sentenceQueueRef.current = [];
    currentSentenceChunksRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle incoming WebSocket messages from ws-gateway
  const handleWsMessage = useCallback((event: MessageEvent) => {
    // Binary frame → audio chunk
    if (event.data instanceof ArrayBuffer) {
      appendAudioBuffer(event.data);
      return;
    }

    // Text frame → JSON message
    if (typeof event.data !== 'string') return;

    let msg: any;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    // Filter: only handle ai_chat_* and audio_sentence_* message types
    const msgType = msg.type;

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

      // Update sulking level if sent by the backend
      if (payload.sulking_level !== undefined) {
        setSulkingLevel(payload.sulking_level);
      } else {
        fetchSulkingLevel();
      }
    }
  }, [playNextSentence, appendAudioBuffer]);

  // Connect to ws-gateway (shared WebSocket for all notifications including chat)
  const connectSocket = useCallback(async () => {
    stopAudio();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);

    // Only authenticated users can use AI Chat
    if (!user) return;

    try {
      const { data } = await djangoClient.get('/users/ws-token');

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
      // Connect to ws-gateway (NOT ai-chat-service directly)
      const wsUrl = `${cleanBaseWsUrl}/${actualUserId}?token=${wsToken}`;

      const socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('✅ WS Gateway connected for AI Chat');
      };

      socket.onmessage = handleWsMessage;

      socket.onclose = () => {
        setIsConnected(false);
        console.log('❌ WS Gateway connection closed');
      };

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
      };
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
    }
  }, [user, stopAudio, handleWsMessage]);

  // Fetch mood data via Django endpoint
  const fetchSulkingLevel = async () => {
    if (!user) return;
    try {
      const { data } = await djangoClient.get('/xiaoyue-chat/sulking/');
      setSulkingLevel(data.sulking_level || 0);
    } catch (err) {
      console.warn('Failed to fetch sulking level:', err);
    }
  };

  const handleResetHistory = async () => {
    if (!confirm('Bạn có chắc muốn xóa lịch sử trò chuyện để bắt đầu lại từ đầu?')) return;
    try {
      stopAudio();
      await djangoClient.post('/xiaoyue-chat/clear/');
      setMessages([]);
      setSulkingLevel(0);
      alert('Đã xóa sạch lịch sử trò chuyện.');
    } catch (err) {
      console.error('Failed to clear history:', err);
      alert('Không thể xóa lịch sử trò chuyện.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isSending || !isConnected) return;

    setInputValue('');
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

    // Send chat request via Django HTTP endpoint (authenticated)
    try {
      await djangoClient.post('/xiaoyue-chat/send/', {
        user_text: text,
        user_role: selectedRole,
        user_level: selectedLevel,
        topic: selectedTopic,
        learning_language: lang,
        context_setting: contextSetting,
      });
    } catch (err) {
      console.error('Failed to send chat request:', err);
      setIsSending(false);
      // Remove streaming placeholder on error
      setMessages((prev) => prev.filter((m) => m.id !== 'stream-placeholder'));
    }
  };

  const handleReplayAudio = async (text: string, emotion: string) => {
    try {
      const voicePresets = lang === 'en' ? VOICE_PRESETS_CLIENT_EN : VOICE_PRESETS_CLIENT;
      const preset = voicePresets[emotion] || voicePresets.neutral;
      const response = await fetch(`/api/v1/tts?text=${encodeURIComponent(text)}&voice=${preset.voice}&rate=${preset.rate}&volume=${preset.volume}`);
      if (response.ok) {
        const audioUrl = response.url;
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('TTS playback error:', err);
    }
  };

  const handleAnswerQuiz = (quizId: number, selectedOption: string, correctAnswer: string) => {
    const isCorrect = selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setQuizResults((prev) => ({ ...prev, [quizId]: isCorrect }));
    setActiveQuizAnswers((prev) => ({ ...prev, [quizId]: selectedOption }));
  };

  useEffect(() => {
    if (user) {
      fetchSulkingLevel();
      connectSocket();
    }

    return () => {
      stopAudio();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectSocket, stopAudio, user]);

  const currentEmotionPreset = EMOTION_MAP[messages[messages.length - 1]?.emotion || 'neutral'] || EMOTION_MAP.neutral;

  // Show login prompt for unauthenticated users
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface h-[calc(100vh-72px)] font-lexend">
        <div className="text-center p-8">
          <span className="material-symbols-outlined text-6xl text-slate-300">lock</span>
          <h3 className="font-bold text-lg text-primary mt-4">Vui lòng đăng nhập</h3>
          <p className="text-sm text-secondary max-w-sm mt-2 leading-relaxed">
            Tính năng trò chuyện với Tiểu Nguyệt chỉ dành cho thành viên đã đăng nhập.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-surface h-[calc(100vh-72px)] overflow-hidden font-lexend">
      {/* LEFT PANEL: Chat log */}
      <div className="flex-1 flex flex-col h-full border-r border-outline relative">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-outline flex items-center justify-between bg-surface/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                月
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}></span>
            </div>
            <div>
              <h2 className="font-bold text-[16px] text-primary">Tiểu Nguyệt</h2>
              <p className="text-[12px] text-secondary flex items-center gap-1">
                <span>{isConnected ? 'Đang trực tuyến (Live Audio)' : 'Đang kết nối lại...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetHistory}
              title="Làm mới lịch sử hội thoại"
              className="p-2 rounded-xl text-secondary hover:bg-hover-bg hover:text-primary transition-all flex items-center justify-center focus:outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Messages Scrolling Panel */}
        <div className="flex-1 p-6 overflow-y-auto sidebar-scroll space-y-6 bg-[#fafafa]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <span className="material-symbols-outlined text-6xl text-slate-300 animate-bounce">forum</span>
              <h3 className="font-bold text-lg text-primary mt-4">Trò chuyện với Tiểu Nguyệt</h3>
              <p className="text-sm text-secondary max-w-sm mt-2 leading-relaxed">
                Hành tẩu giang hồ, cùng sư muội Tiểu Nguyệt đàm đạo võ học và phát âm trực tiếp với tốc độ cực cao.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end items-start gap-3">
                    <div className="max-w-[70%] bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm">
                      <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0 text-sm">
                      Huynh
                    </div>
                  </div>
                );
              }

              // Agent Message
              const emotionPreset = EMOTION_MAP[msg.emotion || 'neutral'] || EMOTION_MAP.neutral;
              return (
                <div key={msg.id} className="flex justify-start items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#fce7f3] border border-pink-200 flex items-center justify-center text-lg shrink-0 shadow-sm relative">
                    <span>月</span>
                    <span className="absolute -bottom-1 -right-1 text-[11px] bg-white rounded-full p-0.5 border border-outline flex items-center justify-center shadow-sm">
                      {emotionPreset.emoji}
                    </span>
                  </div>

                  <div className="max-w-[75%] flex flex-col gap-2">
                    {/* Inner message bubble */}
                    <div className="bg-white border border-outline px-4 py-3 rounded-2xl rounded-tl-none shadow-sm relative">
                      {msg.thought && (
                        <p className="text-[11px] text-slate-400 font-medium mb-1.5 italic font-mono leading-tight">
                          suy nghĩ: {msg.thought}
                        </p>
                      )}

                      {/* Chinese text content */}
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-slate-800 leading-relaxed tracking-wide select-all font-lexend">
                          {msg.text || '...'}
                        </p>
                        {!msg.isStreaming && msg.text && (
                          <button
                            onClick={() => handleReplayAudio(msg.text, msg.emotion || 'neutral')}
                            className="p-1 rounded-full text-secondary hover:bg-hover-bg hover:text-primary transition-all flex items-center justify-center focus:outline-none shrink-0"
                          >
                            <span className="material-symbols-outlined text-[18px]">volume_up</span>
                          </button>
                        )}
                      </div>

                      {/* Pinyin */}
                      {msg.pinyin && (
                        <p className="text-[13px] text-secondary/80 font-medium mt-0.5 select-all">
                          {msg.pinyin}
                        </p>
                      )}

                      {/* Vietnamese translation */}
                      {msg.translation && (
                        <div className="mt-2.5 pt-2 border-t border-outline/40">
                          <p className="text-[14px] text-secondary font-medium leading-relaxed italic">
                            {msg.translation}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Correction details box if exists */}
                    {msg.correction && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 shadow-sm text-sm">
                        <div className="flex items-center gap-2 text-rose-600 font-bold mb-1">
                          <span className="material-symbols-outlined text-[18px]">school</span>
                          <span>Tiểu Nguyệt sửa bài:</span>
                        </div>
                        <p className="text-[13px] text-slate-800 leading-relaxed">
                          Chỗ chưa chuẩn: <span className="font-bold text-rose-600 bg-rose-100 px-1 rounded">{msg.correction.mistake_highlight}</span>
                        </p>
                        <p className="text-[13px] text-secondary mt-1 leading-relaxed">
                          {msg.correction.explanation}
                        </p>
                      </div>
                    )}

                    {/* Quiz items box if exists */}
                    {msg.quizzes && msg.quizzes.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm text-sm space-y-4">
                        <div className="flex items-center gap-2 text-amber-700 font-bold">
                          <span className="material-symbols-outlined text-[18px]">star</span>
                          <span>Thử thách nho nhỏ:</span>
                        </div>

                        {msg.quizzes.map((quiz) => {
                          const hasAnswered = activeQuizAnswers[quiz.id] !== undefined;
                          const isCorrect = quizResults[quiz.id];

                          return (
                            <div key={quiz.id} className="border-t border-amber-200/50 pt-3 first:border-0 first:pt-0 space-y-2">
                              <p className="font-bold text-slate-800 leading-relaxed">{quiz.question}</p>

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
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {hasAnswered && (
                                <p className={`text-[12px] font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isCorrect ? '✓ Sư huynh trả lời hoàn toàn chính xác!' : `✗ Chưa chính xác. Đáp án đúng là: ${quiz.answer}`}
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
        <form onSubmit={handleSendMessage} className="p-4 border-t border-outline bg-surface shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isSending || !isConnected}
              placeholder={isConnected ? 'Nhập tin nhắn tiếng Trung hoặc pinyin...' : 'Đang kết nối cổng âm thanh...'}
              className="flex-1 px-4 py-3 bg-hover-bg border border-outline rounded-xl text-sm focus:outline-none focus:border-primary text-slate-800 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim() || !isConnected}
              className="px-5 bg-primary text-white rounded-xl hover:bg-[#334155] active:scale-95 transition-all flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 shrink-0 font-bold text-sm shadow-sm"
            >
              <span>Gửi</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANEL: Settings & Persona */}
      <div className="w-full md:w-80 p-6 flex flex-col shrink-0 overflow-y-auto bg-surface space-y-6">
        {/* Persona Profile Card */}
        {(() => {
          const persona = PERSONA_DETAILS[selectedRole] || PERSONA_DETAILS['Sư huynh'];
          return (
            <div className="border border-outline rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#fce7f3] border-2 border-pink-300 flex items-center justify-center text-4xl shadow-md relative">
                <span>{persona.name.charAt(0)}</span>
                <span className="absolute bottom-0 right-0 text-xl bg-white rounded-full p-1 border border-outline flex items-center justify-center shadow-md">
                  {currentEmotionPreset.emoji}
                </span>
              </div>

              <h3 className="font-bold text-lg text-primary mt-4">{persona.name}</h3>
              <p className="text-[12px] font-bold text-[#ec4899] bg-[#fdf2f8] border border-pink-100 px-3 py-1 rounded-full mt-2 uppercase tracking-wider">
                {persona.tag}
              </p>

              <p className="text-[13px] text-secondary leading-relaxed mt-3">
                {persona.desc}
              </p>
            </div>
          );
        })()}

        {/* Mood Meter (Only relevant for Chinese tutoring) */}
        {lang === 'zh' && (
          <div className="border border-outline rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-primary">
              <span>Độ dỗi của sư muội:</span>
              <span className="text-[#a855f7]">{sulkingLevel}/3</span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-outline/40">
              <div
                style={{ width: `${(sulkingLevel / 3) * 100}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              />
            </div>

            <p className="text-[12px] text-secondary leading-relaxed">
              {sulkingLevel === 0 && '😊 Sư muội đang rất vui vẻ, dịu dàng đàm thoại.'}
              {sulkingLevel === 1 && '😤 Sư muội có chút dỗi hờn nhẹ. Huynh chú ý hơn nhé.'}
              {sulkingLevel === 2 && '😾 Sư muội bắt đầu phụng phịu, trả lời bướng bỉnh hơn rồi.'}
              {sulkingLevel === 3 && '😭 Sư muội cực kỳ giận dỗi! Sư huynh mau mau sửa sai bài tập để sư muội vui trở lại.'}
            </p>
          </div>
        )}

        {/* Settings Panel */}
        <div className="border border-outline rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
            {lang === 'zh' ? 'Cấu hình Giang hồ' : 'Cấu hình AI Chat'}
          </h4>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">Bối cảnh</label>
            <select
              value={contextSetting}
              onChange={(e) => setContextSetting(e.target.value)}
              className="w-full px-3 py-2.5 bg-hover-bg border border-outline rounded-xl text-sm focus:outline-none text-slate-800"
            >
              {CONTEXT_SETTINGS.filter(c => c.langs.includes(lang)).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">Vai vế đối phương</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-hover-bg border border-outline rounded-xl text-sm focus:outline-none text-slate-800"
            >
              {(ROLE_MAP[contextSetting] || []).map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">
              {lang === 'zh' ? 'Trình độ HSK' : 'Trình độ Tiếng Anh'}
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2.5 bg-hover-bg border border-outline rounded-xl text-sm focus:outline-none text-slate-800"
            >
              {(LEVEL_MAP[lang] || []).map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-secondary uppercase">Chủ đề thảo luận</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2.5 bg-hover-bg border border-outline rounded-xl text-sm focus:outline-none text-slate-800"
            >
              {(TOPIC_MAP[contextSetting] || []).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client voice presets mapping for replays (Chinese)
const VOICE_PRESETS_CLIENT: Record<string, { voice: string; rate: string; volume: string }> = {
  neutral: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+0%', volume: '+0%' },
  happy: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+10%', volume: '+10%' },
  excited: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+15%', volume: '+20%' },
  cheerful: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+10%', volume: '+10%' },
  strict: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-5%', volume: '+10%' },
  concerned: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-5%', volume: '-15%' },
  sulking: { voice: 'zh-CN-XiaoxiaoNeural', rate: '-10%', volume: '-10%' },
  angry: { voice: 'zh-CN-XiaoxiaoNeural', rate: '+20%', volume: '+25%' },
};

// Client voice presets mapping for replays (English)
const VOICE_PRESETS_CLIENT_EN: Record<string, { voice: string; rate: string; volume: string }> = {
  neutral: { voice: 'en-US-JennyNeural', rate: '+0%', volume: '+0%' },
  happy: { voice: 'en-US-JennyNeural', rate: '+5%', volume: '+5%' },
  excited: { voice: 'en-US-JennyNeural', rate: '+10%', volume: '+10%' },
  cheerful: { voice: 'en-US-JennyNeural', rate: '+5%', volume: '+5%' },
  strict: { voice: 'en-US-JennyNeural', rate: '-2%', volume: '+5%' },
  concerned: { voice: 'en-US-JennyNeural', rate: '-2%', volume: '-10%' },
  sulking: { voice: 'en-US-JennyNeural', rate: '-5%', volume: '-5%' },
  angry: { voice: 'en-US-JennyNeural', rate: '+10%', volume: '+15%' },
};
