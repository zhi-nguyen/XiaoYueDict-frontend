'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSmartQueue } from '@/hooks/useSmartQueue';
import { useSpellCheck } from '@/hooks/useSpellCheck';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import SmartQueueStatus from '@/components/SmartQueueStatus';
import { QUEUE_STRATEGIES } from '@/constants/queueStrategies';
import ScoreDisplay from '@/components/ScoreDisplay';
import AudioWaveform from '@/components/AudioWaveform';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import UploadLimitBar from '@/components/speaking/UploadLimitBar';
import TargetTextInput from '@/components/speaking/TargetTextInput';
import RecordingControls from '@/components/speaking/RecordingControls';
import { useParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

/**
 * Speaking page orchestrator.
 * Composes audio recording, spellcheck, queue processing, and score display
 * into a unified pronunciation practice experience.
 */
export default function SpeakingClient() {
  const queue = useSmartQueue();
  const params = useParams();
  const language = ((params?.lang as string) || 'zh') as 'en' | 'zh';
  const spellCheck = useSpellCheck();

  // ── Subscription Usage & Rate Limiting ──
  const { usageData, fetchUsage } = useSubscriptionStore();

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (queue.phase === 'completed') {
      fetchUsage();
    }
  }, [queue.phase, fetchUsage]);

  // ── Local State ──
  const [targetText, setTargetText] = useState('');
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

  const isIdle = queue.phase === 'idle';
  const isServiceUnavailable = usageData?.service_available === false;
  const isBusy = queue.phase !== 'idle' && queue.phase !== 'completed' && queue.phase !== 'error';
  const showResult = queue.phase === 'completed' && queue.resultData;

  // ── Spellcheck ──
  const hasSpellErrors = spellCheck.result && !spellCheck.result.is_valid;

  const handleCheckText = useCallback(async () => {
    if (!targetText.trim() || isServiceUnavailable) return;
    await spellCheck.checkText(targetText);
  }, [targetText, spellCheck, isServiceUnavailable]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTargetText(e.target.value);
    if (spellCheck.result) {
      spellCheck.reset();
    }
  }, [spellCheck]);

  // ── Audio Recording Hook ──
  const recording = useAudioRecording(
    (msg) => setAlertConfig({
      isOpen: true,
      title: 'Lỗi thiết bị',
      message: msg,
      type: 'error'
    }),
    () => queue.reset()
  );

  // ── Gesture Event Handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isBusy || isServiceUnavailable || hasSpellErrors) return;
    recording.startRecording();
  }, [isBusy, isServiceUnavailable, hasSpellErrors, recording]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (recording.isRecording) recording.stopRecording();
  }, [recording]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isBusy || isServiceUnavailable || hasSpellErrors) return;
    recording.startRecording();
  }, [isBusy, isServiceUnavailable, hasSpellErrors, recording]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (recording.isRecording) recording.stopRecording();
  }, [recording]);

  // ── Submit with confirmation ──
  const handleSubmitAudio = useCallback(() => {
    if (!recording.audioBlob || isServiceUnavailable) return;
    if (hasSpellErrors) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận gửi',
      message: 'Bạn có muốn gửi bản ghi âm này để chấm điểm phát âm không?',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await queue.submit(recording.audioBlob!, language, targetText || undefined);
          useSubscriptionStore.getState().fetchUsage();
          recording.handleResetAudio();
        } catch (err) {
          console.error("Submit error:", err);
        }
      }
    });
  }, [recording.audioBlob, language, targetText, queue, hasSpellErrors, recording, isServiceUnavailable]);

  return (
    <div className="w-full p-8 pb-16">
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

          {/* Maintenance Banner */}
          {isServiceUnavailable && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in">
              <span className="material-symbols-outlined text-amber-600 text-xl animate-pulse">engineering</span>
              <div>
                <p className="text-sm font-bold text-amber-950">Dịch vụ đang bảo trì</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Hệ thống chấm điểm hiện đang tạm bảo trì để nâng cấp chất lượng dịch vụ. Vui lòng quay lại sau.
                </p>
              </div>
            </div>
          )}

          {/* ── Volume Limit Progress Bar ── */}
          {usageData && <UploadLimitBar usageData={usageData} />}

          {/* Target Text + Check Text Button */}
          <TargetTextInput
            language={language}
            targetText={targetText}
            onTextChange={handleTextChange}
            spellCheck={spellCheck}
            isBusy={isBusy || isServiceUnavailable}
            hasSpellErrors={hasSpellErrors}
            onCheckText={handleCheckText}
          />

          {/* Waveform */}
          <AudioWaveform
            isRecording={recording.isRecording}
            stream={recording.activeStream}
            height={64}
          />

          {/* Recording & Upload Controls */}
          <RecordingControls
            isRecording={recording.isRecording}
            isBusy={isBusy || isServiceUnavailable}
            isIdle={isIdle}
            audioBlob={recording.audioBlob}
            hasSpellErrors={hasSpellErrors}
            isPlayingPlayback={recording.isPlayingPlayback}
            targetText={targetText}
            language={language}
            fileInputRef={recording.fileInputRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onFileUpload={recording.handleFileUpload}
            onTogglePlayback={recording.handleTogglePlayback}
            onResetAudio={recording.handleResetAudio}
            onSubmit={handleSubmitAudio}
            isAuthLoading={queue.isAuthLoading}
          />

          {/* Spell Error Warning */}
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
          errorType={queue.errorType}
          queuePosition={queue.queuePosition}
          estimatedWait={queue.estimatedWait}
          initialEWT={queue.initialEWT}
          elapsedSeconds={queue.elapsedSeconds}
        />

        {/* ── Score Result ── */}
        {showResult && queue.resultData && (
          <div>
            <ScoreDisplay result={queue.resultData} overallScore={queue.score} />
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  queue.reset();
                  recording.handleResetAudio();
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