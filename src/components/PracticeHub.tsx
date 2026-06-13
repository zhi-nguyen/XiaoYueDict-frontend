"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSmartQueue } from '@/hooks/useSmartQueue';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useParams } from 'next/navigation';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import ScoreDisplay from '@/components/ScoreDisplay';
import AudioWaveform from '@/components/AudioWaveform';
import { getScoreLevel, isReadAloudAny, isChineseReadAloudResponse } from '@/types/scoring';
import { ZhWord } from '@/types/dictionary';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

/** Maps score levels to Tailwind-compatible color strings */
const SCORE_COLORS = {
  excellent: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: '#10B981' },
  good: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: '#3B82F6' },
  moderate: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: '#F59E0B' },
  poor: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: '#EF4444' },
};

/** Convert AudioBuffer to 16-bit PCM WAV Blob */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bitDepth = 16;
  const dataLength = samples.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const ab = new ArrayBuffer(bufferLength);
  const view = new DataView(ab);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); view.setUint32(4, 36 + dataLength, true); w(8, 'WAVE'); w(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); w(36, 'data');
  view.setUint32(40, dataLength, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

interface PracticeHubProps {
  word: ZhWord | null;
}

export default function PracticeHub({ word }: PracticeHubProps) {
  const queue = useSmartQueue();
  const params = useParams();
  const lang = ((params?.lang as string) || 'zh') as 'en' | 'zh';

  const { usageData, fetchUsage } = useSubscriptionStore();

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
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
    onConfirm: () => {}
  });

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingPlayback, setIsPlayingPlayback] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (queue.phase === 'completed') {
      fetchUsage();
    }
  }, [queue.phase, fetchUsage]);

  const handleResetAudio = useCallback(() => {
    setAudioBlob(null);
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current = null;
    }
    setIsPlayingPlayback(false);
  }, []);

  useEffect(() => {
    handleResetAudio();
  }, [word, handleResetAudio]);

  // Error is handled inline in SmartQueueStatus component now

  const startRecording = async () => {
    try {
      queue.reset();
      handleResetAudio();
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setActiveStream(stream);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setActiveStream(null);
        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
          const ab = await webmBlob.arrayBuffer();
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await ctx.decodeAudioData(ab);
          const wavBlob = audioBufferToWav(decoded);
          setAudioBlob(wavBlob);
        } catch {
          setAudioBlob(webmBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setAlertConfig({
        isOpen: true,
        title: 'Lỗi thiết bị',
        message: 'Không thể truy cập microphone. Vui lòng kiểm tra quyền thiết bị.',
        type: 'error'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isBusy || !word?.word) return;
    startRecording();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isBusy || !word?.word) return;
    startRecording();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  };

  const handleTogglePlayback = () => {
    if (!audioBlob) return;
    
    if (!playbackAudioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      playbackAudioRef.current = audio;
      audio.onended = () => {
        setIsPlayingPlayback(false);
      };
    }

    if (isPlayingPlayback) {
      playbackAudioRef.current.pause();
      setIsPlayingPlayback(false);
    } else {
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current.play();
      setIsPlayingPlayback(true);
    }
  };

  const handleSubmitAudio = () => {
    if (!audioBlob || !word?.word) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận gửi',
      message: 'Bạn có muốn gửi bản ghi âm này để chấm điểm phát âm không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        
        const isSentence = word?.part_of_speech.includes('sentence');
        let target = word?.word;
        if (target && isSentence && !target.endsWith('。')) {
          target += '。';
        }

        try {
          await queue.submit(audioBlob, lang, target);
          useSubscriptionStore.getState().fetchUsage();
          handleResetAudio();
        } catch (err) {
          console.error("Submit error:", err);
        }
      }
    });
  };

  const isBusy = queue.phase !== 'idle' && queue.phase !== 'completed' && queue.phase !== 'error';
  const showResult = queue.phase === 'completed' && queue.resultData;

  const displayScore = queue.score != null ? Math.round(queue.score) : '--';
  const circumference = 2 * Math.PI * 54;
  const scoreNum = typeof displayScore === 'number' ? displayScore : 0;
  const dashOffset = circumference - (scoreNum / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-outline rounded-[1.5rem] p-4 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-hover-bg flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
            </div>
            <h2 className="text-xl font-bold text-primary">Chấm điểm phát âm</h2>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Đang hoạt động
          </span>
        </div>

        {usageData && (
          <div className="relative overflow-hidden rounded-2xl border border-outline bg-hover-bg/30 backdrop-blur-md p-5 shadow-sm transition-all hover:bg-hover-bg/50 mb-8 font-sans">
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-500">
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hạn Mức Tải Lên</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      usageData.tier === 'PRO' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      usageData.tier === 'PREMIUM' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                      usageData.tier === 'PLUS' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' :
                      'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {usageData.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary mt-0.5">Dung lượng ghi âm đã dùng trong 1 giờ qua</p>
                </div>
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-primary font-bold">
                    {(usageData.used_hr / (1024 * 1024)).toFixed(2)} MB <span className="text-secondary/60 font-normal">/ {(usageData.limit_hr / (1024 * 1024)).toFixed(2)} MB</span>
                  </span>
                  <span className="text-secondary">
                    {((usageData.used_hr / usageData.limit_hr) * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="h-2 w-full rounded-full bg-outline/40 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (usageData.used_hr / usageData.limit_hr) * 100)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-secondary mt-1.5 font-semibold">
                  <span>Theo phút: {(usageData.used_min / (1024 * 1024)).toFixed(2)} / {(usageData.limit_min / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>Theo ngày: {(usageData.used_day / (1024 * 1024)).toFixed(2)} / {(usageData.limit_day / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="relative w-[120px] h-[120px] flex items-center justify-center shrink-0">
            {isBusy ? (
              <div className="absolute inset-0 border-[6px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
            ) : (
              <svg className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="transparent" stroke="var(--color-outline)" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="54" fill="transparent"
                  stroke={scoreNum >= 85 ? 'var(--score-excellent)' : scoreNum >= 70 ? 'var(--score-good)' : scoreNum >= 50 ? 'var(--score-moderate)' : scoreNum > 0 ? 'var(--score-poor)' : 'var(--color-outline)'}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={scoreNum > 0 ? dashOffset : circumference}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isBusy ? (
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse text-center px-2">
                  Đang xử lý
                </span>
              ) : (
                <>
                  <span className="text-[28px] font-bold text-primary leading-none mb-1">
                    {displayScore}<span className="text-base text-secondary">/100</span>
                  </span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Điểm số
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col items-center gap-6">
            <AudioWaveform
              isRecording={isRecording}
              stream={activeStream}
              height={64}
              result={queue.resultData}
            />

            <div className="flex flex-col items-center gap-4 w-full">
              {!audioBlob ? (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    disabled={isBusy || !word?.word}
                    className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-md transition-all select-none disabled:opacity-40 focus:outline-none ${
                      isRecording
                        ? 'bg-red-500 text-white ring-8 ring-red-500/20'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isRecording && <span className="absolute inset-0 rounded-xl animate-pulse-ring text-red-300 pointer-events-none" />}
                    <span className="material-symbols-outlined text-[32px]">mic</span>
                  </button>
                  <p className="text-xs text-secondary font-medium select-none">
                    {isRecording ? 'Thả tay để hoàn tất' : 'Nhấn giữ để nói'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full px-4 font-sans">
                  <div className="flex items-center gap-2 mb-2 select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs font-semibold text-emerald-600">Đã ghi âm — {(audioBlob.size / 1024).toFixed(1)} KB</p>
                  </div>
                  
                  <div className="flex w-full gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePlayback}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline bg-hover-bg text-primary font-bold text-sm transition-all hover:bg-outline/50 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isPlayingPlayback ? 'pause' : 'play_arrow'}
                      </span>
                      {isPlayingPlayback ? 'Tạm dừng' : 'Nghe lại'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResetAudio}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline bg-hover-bg text-secondary font-bold text-sm transition-all hover:bg-outline/50 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-lg">refresh</span>
                      Ghi lại
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitAudio}
                    className="w-full py-3.5 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    Gửi chấm điểm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 mb-6">
          <SmartQueueStatus
            phase={queue.phase}
            strategy={lang === 'en' ? QUEUE_STRATEGIES.speaking_en : QUEUE_STRATEGIES.speaking_zh}
            onRetry={queue.retry}
            errorMessage={queue.errorMessage}
          />
        </div>

        {showResult && queue.resultData && isReadAloudAny(queue.resultData) && queue.resultData.word_scores.length > 0 && (
          <div className="mb-8 rounded-2xl border border-outline bg-surface p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Chi tiết từng {isChineseReadAloudResponse(queue.resultData) ? 'ký tự' : 'từ'}
            </h4>

            <div className="flex flex-wrap gap-2">
              {queue.resultData.word_scores.map((ws, i) => {
                const wLevel = getScoreLevel(ws.score);
                const wColors = SCORE_COLORS[wLevel];

                return (
                  <div
                    key={i}
                    className={`group relative px-3 py-1.5 rounded-xl border text-sm font-bold transition-all hover:scale-105 duration-200 cursor-default flex items-center gap-1.5
                      ${wColors.bg} ${wColors.text} ${wColors.border}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="font-semibold">{ws.word}</span>
                    <span className="opacity-60 text-xs">{Math.round(ws.score)}</span>

                    {'pinyin' in ws && (ws as any).pinyin && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {(ws as any).pinyin}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
          if (queue.phase === 'error') {
            queue.reset();
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
