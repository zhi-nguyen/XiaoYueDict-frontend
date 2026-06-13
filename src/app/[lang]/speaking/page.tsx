'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSmartQueue } from '@/hooks/useSmartQueue';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import ScoreDisplay from '@/components/ScoreDisplay';
import AudioWaveform from '@/components/AudioWaveform';
import { useParams } from 'next/navigation';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

/** Convert AudioBuffer to 16-bit PCM WAV Blob */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bitDepth = 16;
  const dataLength = samples.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * (bitDepth / 8), true);
  view.setUint16(32, bitDepth / 8, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export default function SpeakingPage() {
  const queue = useSmartQueue();
  const params = useParams();
  const language = ((params?.lang as string) || 'zh') as 'en' | 'zh';
  const spellCheck = useSpellCheck();

  // ── Subscription Usage & Rate Limiting (Zustand Store) ──
  const { usageData, fetchUsage } = useSubscriptionStore();

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (queue.phase === 'completed') {
      fetchUsage();
    }
  }, [queue.phase, fetchUsage]);

  // Error is handled inline in SmartQueueStatus component now

  // Helper to format bytes to MB
  const formatMB = useCallback((bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  }, []);

  // ── Local State ──
  const [targetText, setTargetText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [selectedMisspelled, setSelectedMisspelled] = useState<string | null>(null);
  const [isPlayingPlayback, setIsPlayingPlayback] = useState(false);
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const isIdle = queue.phase === 'idle';
  const isBusy = queue.phase !== 'idle' && queue.phase !== 'completed' && queue.phase !== 'error';
  const showResult = queue.phase === 'completed' && queue.resultData;

  const handleResetAudio = useCallback(() => {
    setAudioBlob(null);
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.currentTime = 0;
      playbackAudioRef.current = null;
    }
    setIsPlayingPlayback(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    return () => {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.currentTime = 0;
        playbackAudioRef.current = null;
      }
    };
  }, []);

  // ── Spellcheck ──
  const hasSpellErrors = spellCheck.result && !spellCheck.result.is_valid;
  const misspelledWords = useMemo(() => {
    if (!spellCheck.result?.misspelled) return new Set<string>();
    return new Set(spellCheck.result.misspelled.map((m) => m.word));
  }, [spellCheck.result]);

  const handleCheckText = useCallback(async () => {
    if (!targetText.trim()) return;
    setSelectedMisspelled(null);
    await spellCheck.checkText(targetText);
  }, [targetText, spellCheck]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTargetText(e.target.value);
    // Reset spellcheck when text changes
    if (spellCheck.result) {
      spellCheck.reset();
      setSelectedMisspelled(null);
    }
  }, [spellCheck]);

  // ── Recording ──
  const startRecording = useCallback(async () => {
    // Block recording if there are spelling errors
    if (hasSpellErrors) return;

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
        stream.getTracks().forEach((t) => t.stop());
        setActiveStream(null);

        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
          const arrayBuffer = await webmBlob.arrayBuffer();
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
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
        message: 'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.',
        type: 'error'
      });
    }
  }, [queue, hasSpellErrors, handleResetAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // ── Gesture Event Handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isBusy || hasSpellErrors) return;
    startRecording();
  }, [isBusy, hasSpellErrors, startRecording]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  }, [isRecording, stopRecording]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isBusy || hasSpellErrors) return;
    startRecording();
  }, [isBusy, hasSpellErrors, startRecording]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) stopRecording();
  }, [isRecording, stopRecording]);

  // ── File Upload ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      queue.reset();
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.currentTime = 0;
        playbackAudioRef.current = null;
      }
      setIsPlayingPlayback(false);
      setAudioBlob(file);
    }
  }, [queue]);

  // ── Toggle Replay Playback ──
  const handleTogglePlayback = useCallback(() => {
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
  }, [audioBlob, isPlayingPlayback]);

  // ── Submit with confirmation ──
  const handleSubmitAudio = useCallback(() => {
    if (!audioBlob) return;
    if (hasSpellErrors) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận gửi',
      message: 'Bạn có muốn gửi bản ghi âm này để chấm điểm phát âm không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await queue.submit(audioBlob, language, targetText || undefined);
          useSubscriptionStore.getState().fetchUsage();
          handleResetAudio();
        } catch (err) {
          console.error("Submit error:", err);
        }
      }
    });
  }, [audioBlob, language, targetText, queue, hasSpellErrors, handleResetAudio]);

  // ── Build highlighted text for display ──
  const renderHighlightedText = () => {
    if (!spellCheck.result?.misspelled?.length || !targetText.trim()) return null;

    const words = targetText.trim().split(/(\s+)/); // preserve whitespace
    let wordIndex = 0;

    return (
      <div className="mt-3 p-4 bg-hover-bg rounded-xl border border-outline text-sm leading-relaxed">
        <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">spellcheck</span>
          Phát hiện {spellCheck.result.misspelled.length} lỗi chính tả — Vui lòng sửa trước khi ghi âm
        </p>
        <div className="flex flex-wrap gap-0 text-primary">
          {words.map((segment, i) => {
            // whitespace-only segment
            if (/^\s+$/.test(segment)) {
              return <span key={`ws-${i}`}>{segment}</span>;
            }

            const currentWordIndex = wordIndex;
            wordIndex++;

            const isMisspelled = spellCheck.result!.misspelled.some(
              (m) => m.index === currentWordIndex
            );

            if (isMisspelled) {
              const misspelledInfo = spellCheck.result!.misspelled.find(
                (m) => m.index === currentWordIndex
              );
              const isSelected = selectedMisspelled === segment;

              return (
                <span key={`w-${i}`} className="relative inline-block">
                  <span
                    onClick={() => setSelectedMisspelled(isSelected ? null : segment)}
                    className="cursor-pointer px-0.5 py-0.5 rounded-md font-semibold transition-all
                               bg-red-100 text-red-700 decoration-wavy decoration-red-400 underline underline-offset-4
                               hover:bg-red-200 hover:text-red-800"
                  >
                    {segment}
                  </span>
                  {/* Suggestion tooltip */}
                  {isSelected && misspelledInfo && misspelledInfo.suggestions.length > 0 && (
                    <span className="absolute left-0 top-full mt-1 z-20 bg-white border border-outline rounded-lg shadow-lg p-2
                                     flex flex-wrap gap-1.5 min-w-[120px] animate-fade-in">
                      <span className="w-full text-[10px] text-secondary font-semibold uppercase tracking-wider mb-0.5">
                        Gợi ý sửa:
                      </span>
                      {misspelledInfo.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Replace the misspelled word in the text
                            const textWords = targetText.split(/(\s+)/);
                            let wIdx = 0;
                            const newParts = textWords.map((part) => {
                              if (/^\s+$/.test(part)) return part;
                              const curr = wIdx;
                              wIdx++;
                              if (curr === misspelledInfo.index) return s;
                              return part;
                            });
                            setTargetText(newParts.join(''));
                            setSelectedMisspelled(null);
                            spellCheck.reset();
                          }}
                          className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold
                                     rounded-md border border-green-200 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </span>
                  )}
                </span>
              );
            }

            return (
              <span key={`w-${i}`} className="text-primary">
                {segment}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 pb-16">
      <div className="max-w-[800px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-primary">Luyện Phát Âm</h1>
          <p className="text-secondary mt-1">
            Ghi âm hoặc tải file — Chấm điểm từng từ trong 5-10 giây
          </p>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm space-y-6">

          {/* ── Volume Limit Progress Bar (Glassmorphic) ── */}
          {usageData && (
            <div className="relative overflow-hidden rounded-2xl border border-outline bg-hover-bg/30 backdrop-blur-md p-5 shadow-sm transition-all hover:bg-hover-bg/50 animate-fade-in">
              {/* Decorative radial gradient for depth */}
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-4">
                {/* Left: Info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-500">
                    <span className="material-symbols-outlined text-lg">cloud_upload</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">Hạn Mức Tải Lên</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${usageData.tier === 'PRO' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
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

                {/* Right: Bar & Details */}
                <div className="w-full">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-primary font-bold">
                      {formatMB(usageData.used_hr)} MB <span className="text-secondary/60 font-normal">/ {formatMB(usageData.limit_hr)} MB</span>
                    </span>
                    <span className="text-secondary">
                      {((usageData.used_hr / usageData.limit_hr) * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="h-2 w-full rounded-full bg-outline/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, (usageData.used_hr / usageData.limit_hr) * 100)}%` }}
                    />
                  </div>

                  {/* Additional info */}
                  <div className="flex items-center justify-between text-[10px] text-secondary mt-1.5 font-semibold">
                    <span>Theo phút: {formatMB(usageData.used_min)} / {formatMB(usageData.limit_min)} MB</span>
                    <span>Theo ngày: {formatMB(usageData.used_day)} / {formatMB(usageData.limit_day)} MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Target Text + Check Text Button */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label
                htmlFor="target-text"
                className="block text-sm font-semibold text-primary"
              >
                {language === 'en' ? 'Câu mẫu' : '目标文本'}
                <span className="font-normal text-secondary ml-2">
                  (để trống = chế độ tự do)
                </span>
              </label>

              {/* Check Text button — English mode only */}
              {language === 'en' && targetText.trim() && (
                <button
                  id="check-text-btn"
                  type="button"
                  onClick={handleCheckText}
                  disabled={spellCheck.isChecking || isBusy}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold
                             transition-all focus:outline-none focus:ring-2 focus:ring-offset-1
                             disabled:opacity-40 disabled:cursor-not-allowed
                             ${hasSpellErrors
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-300'
                      : spellCheck.result?.is_valid
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-300'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 focus:ring-amber-300'
                    }`}
                >
                  {spellCheck.isChecking ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang kiểm tra…
                    </>
                  ) : hasSpellErrors ? (
                    <>
                      <span className="material-symbols-outlined text-sm">error</span>
                      Có lỗi chính tả
                    </>
                  ) : spellCheck.result?.is_valid ? (
                    <>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Hợp lệ
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">spellcheck</span>
                      Kiểm tra chính tả
                    </>
                  )}
                </button>
              )}
            </div>

            <textarea
              id="target-text"
              rows={3}
              value={targetText}
              onChange={handleTextChange}
              disabled={isBusy}
              placeholder={
                language === 'en'
                  ? 'e.g. The quick brown fox jumps over the lazy dog'
                  : '例如：今天天气很好，我想出去散步。'
              }
              className={`w-full rounded-xl border px-4 py-3 text-sm text-primary
                         placeholder:text-secondary/50 focus:outline-none focus:ring-2
                         focus:border-transparent resize-none transition-shadow disabled:opacity-50
                         ${hasSpellErrors
                  ? 'border-red-300 bg-red-50/30 focus:ring-red-300'
                  : 'border-outline bg-hover-bg focus:ring-[var(--accent-gradient-start)]'
                }`}
            />

            {/* Spellcheck error display */}
            {spellCheck.error && (
              <p className="mt-1.5 text-xs text-red-500">
                ⚠️ Không thể kiểm tra: {spellCheck.error}
              </p>
            )}

            {/* Highlighted misspelled words */}
            {renderHighlightedText()}

            {/* Mode indicator — only show when no spell errors */}
            {!hasSpellErrors && (
              <p className="mt-1.5 text-xs text-secondary">
                {targetText.trim()
                  ? `📖 Chế độ Read-Aloud — Chấm điểm GOP từng ${language === 'zh' ? 'ký tự' : 'từ'}`
                  : '🎤 Chế độ tự do — Nhận diện giọng nói + điểm lưu loát'}
              </p>
            )}
          </div>

          {/* Waveform */}
          <AudioWaveform
            isRecording={isRecording}
            stream={activeStream}
            height={64}
          />

          {/* Recording & Upload Controls */}
          {!audioBlob ? (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Record button */}
              <button
                id="record-btn"
                type="button"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                disabled={isBusy || (!!hasSpellErrors && !isRecording)}
                className={`relative flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm
                           transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 select-none
                           ${isRecording
                    ? 'bg-red-500 text-white ring-8 ring-red-500/20'
                    : 'bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white hover:opacity-90 focus:ring-[var(--accent-gradient-start)] shadow-md hover:shadow-lg'
                  }`}
              >
                {isRecording && <span className="absolute inset-0 rounded-xl animate-pulse-ring text-red-300 pointer-events-none" />}
                <span className="material-symbols-outlined text-lg">mic</span>
                {isRecording ? 'Thả tay để hoàn tất' : 'Nhấn giữ để nói'}
              </button>

              {/* Upload button */}
              <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                id="upload-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy || isRecording || !!hasSpellErrors}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm
                           bg-hover-bg hover:bg-outline/50 text-secondary transition-colors focus:outline-none
                           focus:ring-2 focus:ring-offset-2 focus:ring-primary/30 disabled:opacity-40
                           border border-outline"
              >
                <span className="material-symbols-outlined text-lg">upload_file</span>
                Tải file lên
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full font-sans">
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

              {/* Audio Ready Indicator */}
              {isIdle && !hasSpellErrors && (
                <div className="flex items-center gap-2 animate-fade-in select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-semibold text-emerald-600">
                    Sẵn sàng — {(audioBlob.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              {/* Submit Button */}
              {isIdle && (
                <button
                  id="submit-btn"
                  type="button"
                  onClick={handleSubmitAudio}
                  disabled={!!hasSpellErrors}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all focus:outline-none
                             focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-gradient-start)] disabled:opacity-30
                             disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-white shadow-md
                             hover:shadow-lg active:scale-[0.98]"
                >
                  {targetText.trim()
                    ? `Chấm điểm Read-Aloud (${language === 'en' ? 'EN' : 'ZH'})`
                    : `Chấm điểm tự do (${language === 'en' ? 'EN' : 'ZH'})`}
                </button>
              )}
            </div>
          )}

          {/* Spell Error Warning — blocks submission */}
          {hasSpellErrors && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
              <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
              <p className="text-xs font-semibold text-red-600">
                Hãy sửa lỗi chính tả trước khi ghi âm hoặc tải file lên
              </p>
            </div>
          )}
        </div>

        {/* ── Smart Queue Status ── */}
        <SmartQueueStatus
          phase={queue.phase}
          strategy={language === 'en' ? QUEUE_STRATEGIES.speaking_en : QUEUE_STRATEGIES.speaking_zh}
          onRetry={queue.retry}
          errorMessage={queue.errorMessage}
        />

        {/* Error is now handled by the AlertModal popup */}

        {/* ── Score Result ── */}
        {showResult && queue.resultData && (
          <div>
            <ScoreDisplay result={queue.resultData} overallScore={queue.score} />
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  queue.reset();
                  handleResetAudio();
                }}
                className="px-6 py-2.5 bg-hover-bg hover:bg-outline/50 text-primary font-semibold text-sm rounded-full
                           transition-colors border border-outline"
              >
                🎤 Ghi âm mới
              </button>
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
