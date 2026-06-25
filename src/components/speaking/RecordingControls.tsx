'use client';

import React from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isBusy: boolean;
  isIdle: boolean;
  audioBlob: Blob | null;
  hasSpellErrors: boolean | null | undefined;
  isPlayingPlayback: boolean;
  targetText: string;
  language: 'zh' | 'en';
  fileInputRef: React.RefObject<HTMLInputElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlayback: () => void;
  onResetAudio: () => void;
  onSubmit: () => void;
  isAuthLoading?: boolean;
}

/**
 * Recording and audio playback controls for the Speaking page.
 * Two states: recording mode (mic + upload) and review mode (playback + submit).
 */
export default function RecordingControls({
  isRecording,
  isBusy,
  isIdle,
  audioBlob,
  hasSpellErrors,
  isPlayingPlayback,
  targetText,
  language,
  fileInputRef,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  onFileUpload,
  onTogglePlayback,
  onResetAudio,
  onSubmit,
  isAuthLoading = false,
}: RecordingControlsProps) {
  if (!audioBlob) {
    // ── Recording & Upload Mode ──
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Record button */}
        <button
          id="record-btn"
          type="button"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          disabled={isBusy || isAuthLoading || (!!hasSpellErrors && !isRecording)}
          className={`relative flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm
                     transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 select-none
                     ${isRecording
              ? 'bg-red-500 text-white ring-8 ring-red-500/20'
              : 'bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white hover:opacity-90 focus:ring-[var(--accent-gradient-start)] shadow-md hover:shadow-lg'
            }`}
        >
          {isRecording && <span className="absolute inset-0 rounded-xl animate-pulse-ring text-red-300 pointer-events-none" />}
          <span className="material-symbols-outlined text-lg">
            {isAuthLoading ? 'sync' : 'mic'}
          </span>
          {isAuthLoading ? 'Đang xác thực...' : isRecording ? 'Thả tay để hoàn tất' : 'Nhấn giữ để nói'}
        </button>

        {/* Upload button */}
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={onFileUpload}
          className="hidden"
        />
        <button
          id="upload-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy || isRecording || isAuthLoading || !!hasSpellErrors}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm
                     bg-hover-bg hover:bg-outline/50 text-secondary transition-colors focus:outline-none
                     focus:ring-2 focus:ring-offset-2 focus:ring-primary/30 disabled:opacity-40
                     border border-outline"
        >
          <span className="material-symbols-outlined text-lg">upload_file</span>
          Tải file lên
        </button>
      </div>
    );
  }

  // ── Review & Submit Mode ──
  return (
    <div className="flex flex-col gap-4 w-full font-sans">
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={onTogglePlayback}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-outline bg-hover-bg text-primary font-bold text-sm transition-all hover:bg-outline/50 focus:outline-none"
        >
          <span className="material-symbols-outlined text-lg">
            {isPlayingPlayback ? 'pause' : 'play_arrow'}
          </span>
          {isPlayingPlayback ? 'Tạm dừng' : 'Nghe lại'}
        </button>

        <button
          type="button"
          onClick={onResetAudio}
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
          onClick={onSubmit}
          disabled={!!hasSpellErrors || isAuthLoading}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all focus:outline-none
                     focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-gradient-start)] disabled:opacity-35
                     disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-white shadow-md
                     hover:shadow-lg active:scale-[0.98]"
        >
          {isAuthLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Đang xác thực tài khoản...
            </span>
          ) : targetText.trim()
            ? `Chấm điểm Read-Aloud (${language === 'en' ? 'EN' : 'ZH'})`
            : `Chấm điểm tự do (${language === 'en' ? 'EN' : 'ZH'})`}
        </button>
      )}
    </div>
  );
}
