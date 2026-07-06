import React, { useState, useEffect } from 'react';
import { useSmartQueue } from '@/hooks/useSmartQueue';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { getAudioDurationLimit } from '@/lib/subscriptionUtils';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import { getScoreLevel, isReadAloudAny, isChineseReadAloudResponse } from '@/types/scoring';
import { playTTSWithClientCache } from '@/lib/zhUtils';

interface DeepPracticeSpeakTabProps {
  vocabulary: string;
  pinyin?: string;
  lang: string;
  onAnswered: (isCorrect: boolean) => void;
  onSkip?: () => void;
}

const SCORE_COLORS = {
  excellent: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  good: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  moderate: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  poor: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function DeepPracticeSpeakTab({
  vocabulary,
  pinyin,
  lang,
  onAnswered,
  onSkip,
}: DeepPracticeSpeakTabProps) {
  const { tier, fetchUsage } = useSubscriptionStore();
  const durationLimit = getAudioDurationLimit(tier);
  const queue = useSmartQueue();

  const handlePlayTTS = () => {
    playTTSWithClientCache(vocabulary, lang === 'en' ? 'en' : 'zh');
  };

  const {
    isRecording,
    timeLeft,
    audioBlob,
    isPlayingPlayback,
    startRecording,
    stopRecording,
    handleTogglePlayback,
    handleResetAudio,
    recordingError
  } = useAudioRecording(
    (err) => console.error("Speech recording error:", err),
    () => queue.reset(),
    durationLimit
  );

  useEffect(() => {
    // Notify parent on completion
    if (queue.phase === 'completed' && queue.score !== null) {
      onAnswered(queue.score >= 70);
      fetchUsage();
    }
  }, [queue.phase, queue.score, fetchUsage, onAnswered]);

  useEffect(() => {
    return () => {
      handleResetAudio();
    };
  }, []);

  const handleToggleRecord = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSubmitAudio = async () => {
    if (!audioBlob) return;

    let target = vocabulary;
    if (lang === 'zh' && !target.endsWith('。')) {
      target += '。';
    } else if (lang === 'en' && !target.endsWith('.')) {
      target += '.';
    }

    try {
      await queue.submit(audioBlob, lang === 'en' ? 'en' : 'zh', target);
    } catch (err) {
      console.error("Audio submit failed:", err);
    }
  };

  const isBusy = queue.phase === 'processing';

  return (
    <div className="py-4 text-center">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 text-left">
        <h3 className="text-lg sm:text-xl font-bold text-primary">
          Đọc to từ sau:
        </h3>
        <button
          onClick={() => {
            onAnswered(true);
            onSkip?.();
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline hover:bg-hover-bg text-secondary hover:text-primary transition-all text-xs font-bold focus:outline-none shrink-0 self-start sm:self-center"
          title="Tạm thời bỏ qua phần Nói"
        >
          <span className="material-symbols-outlined text-sm font-bold">skip_next</span>
          Bỏ qua Nói
        </button>
      </div>

      <div className="mb-8 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <h2 className="text-4xl sm:text-5xl font-bold text-primary select-all">
            {vocabulary}
          </h2>
          <button
            onClick={handlePlayTTS}
            className="p-2 rounded-full bg-hover-bg text-secondary hover:text-primary hover:bg-secondary-container transition-colors shadow-sm flex items-center justify-center border border-outline"
            title="Nghe phát âm từ mẫu"
          >
            <span className="material-symbols-outlined font-bold text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              volume_up
            </span>
          </button>
        </div>
        {pinyin && (
          <p className="text-base font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded w-fit border border-emerald-100/50 mt-1">
            {pinyin}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center mb-8">
        {!audioBlob ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-4">
              {/* Red ripple rings behind mic button when recording */}
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/30 pointer-events-none pulse-ring-1" />
                  <div className="absolute inset-0 rounded-full bg-red-500/25 pointer-events-none pulse-ring-2" />
                  <div className="absolute inset-0 rounded-full bg-red-500/15 pointer-events-none pulse-ring-3" />
                </>
              )}

              <button
                disabled={isBusy}
                onClick={handleToggleRecord}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white scale-105 shadow-red-200/50' : 'bg-primary text-white'
                  }`}
                title={isRecording ? "Dừng ghi âm" : "Bắt đầu nói"}
              >
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </button>
            </div>

            {/* Height-consistent status text */}
            {isRecording ? (
              <p className="text-sm font-semibold text-red-500 animate-pulse">Đang ghi âm, hãy nói... ({timeLeft}s)</p>
            ) : (
              <p className="text-sm font-semibold text-secondary">Nhấn nút mic để bắt đầu ghi âm</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm px-4">
            <div className="flex items-center gap-2 mb-1 select-none">
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
              disabled={isBusy}
              className="w-full py-3.5 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  Đang chấm điểm...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Gửi chấm điểm
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {recordingError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 max-w-sm mx-auto mb-4">
          {recordingError}
        </p>
      )}

      <div className="mt-4 mb-4 max-w-sm mx-auto">
        <SmartQueueStatus
          phase={queue.phase}
          strategy={lang === 'en' ? QUEUE_STRATEGIES.speaking_en : QUEUE_STRATEGIES.speaking_zh}
          onRetry={queue.retry}
          errorMessage={queue.errorMessage}
          errorType={queue.errorType}
          queuePosition={queue.queuePosition}
          estimatedWait={queue.estimatedWait}
          initialEWT={queue.initialEWT}
          elapsedSeconds={queue.elapsedSeconds}
        />
      </div>

      {queue.phase === 'completed' && queue.score !== null && (
        <div className="mt-4 max-w-sm mx-auto bg-surface-container-low p-4 rounded-xl border border-outline/50 text-left">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Kết quả phát âm:</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-secondary">Độ chính xác:</span>
            <span className={`text-lg font-bold ${queue.score >= 70 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {Math.round(queue.score)}/100 {queue.score >= 70 ? '(Đạt)' : '(Chưa đạt)'}
            </span>
          </div>

          {queue.resultData && isReadAloudAny(queue.resultData) && queue.resultData.word_scores.length > 0 && (
            <div className="mt-2 pt-2 border-t border-outline/30">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Chi tiết từng ký tự:</p>
              <div className="flex flex-wrap gap-1.5">
                {queue.resultData.word_scores.map((ws, i) => {
                  const wLevel = getScoreLevel(ws.score);
                  const wColors = SCORE_COLORS[wLevel];

                  return (
                    <div
                      key={i}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1
                        ${wColors.bg} ${wColors.text} ${wColors.border}`}
                    >
                      <span>{ws.word}</span>
                      <span className="opacity-60">{Math.round(ws.score)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
