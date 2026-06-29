"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/useUIStore';
import {
  useSettingsStore,
  VoiceOption,
  VOICE_LABELS,
  SPEED_MIN,
  SPEED_MAX,
  SPEED_STEP,
  VOLUME_MIN,
  VOLUME_MAX,
  VOLUME_STEP,
} from '@/store/useSettingsStore';

// ── Tiny test-play helper ────────────────────────────────────────────────────
function playTestVoice(lang: 'zh' | 'en', voiceName: string) {
  const sampleText = lang === 'zh' ? '你好，欢迎使用。' : 'Hello, welcome!';

  if (voiceName === 'browser_base') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
    return;
  }

  const url = `/api/tts?text=${encodeURIComponent(sampleText)}&lang=${lang}&voice=${encodeURIComponent(voiceName)}`;
  const audio = new Audio(url);
  audio.play().catch(console.error);
}

// ── Voice Radio Group ────────────────────────────────────────────────────────
interface VoiceGroupProps {
  lang: 'zh' | 'en';
  title: string;
  value: VoiceOption;
  onChange: (v: VoiceOption) => void;
}

const voiceOptions: VoiceOption[] = ['female_neural', 'male_neural', 'browser_base'];

function VoiceGroup({ lang, title, value, onChange }: VoiceGroupProps) {
  const labels = VOICE_LABELS[lang];
  const { getVoiceName } = useSettingsStore();

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold text-secondary uppercase tracking-wider">{title}</span>
      <div className="space-y-1">
        {voiceOptions.map((opt) => {
          const isActive = value === opt;
          return (
            <label
              key={opt}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-hover-bg border border-transparent'
              }`}
            >
              <input
                type="radio"
                name={`voice-${lang}`}
                value={opt}
                checked={isActive}
                onChange={() => onChange(opt)}
                className="accent-primary w-4 h-4 shrink-0"
              />
              <span className={`text-sm font-medium flex-1 ${isActive ? 'text-primary' : 'text-secondary'}`}>
                {labels[opt]}
              </span>
              {/* Test play button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Use selected voice name for test
                  const { getVoiceName: gv } = useSettingsStore.getState();
                  // For test, we play with the option's mapped voice, not current selection
                  const testVoice =
                    opt === 'browser_base'
                      ? 'browser_base'
                      : lang === 'zh'
                        ? opt === 'female_neural'
                          ? 'zh-CN-XiaoxiaoNeural'
                          : 'zh-CN-YunxiNeural'
                        : opt === 'female_neural'
                          ? 'en-US-AriaNeural'
                          : 'en-US-GuyNeural';
                  playTestVoice(lang, testVoice);
                }}
                className="p-1.5 rounded-lg hover:bg-hover-bg text-secondary hover:text-primary transition-colors"
                title="Nghe thử"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Settings Panel ──────────────────────────────────────────────────────
export default function SettingsPanel() {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  const {
    voiceZh,
    voiceEn,
    examSpeed,
    examVolume,
    setVoiceZh,
    setVoiceEn,
    setExamSpeed,
    setExamVolume,
  } = useSettingsStore();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isSettingsOpen, setSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-[380px] bg-surface border-l border-outline z-[70] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>settings</span>
            <h2 className="text-lg font-bold text-primary">Cài Đặt</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-full hover:bg-hover-bg text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 sidebar-scroll">

          {/* ── Section 1: Cài Đặt Hệ Thống ─────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>record_voice_over</span>
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Cài Đặt Hệ Thống</h3>
            </div>

            <div className="space-y-5 bg-hover-bg/50 rounded-2xl p-4">
              <VoiceGroup
                lang="zh"
                title="Giọng đọc Tiếng Trung"
                value={voiceZh}
                onChange={setVoiceZh}
              />

              <div className="border-t border-outline" />

              <VoiceGroup
                lang="en"
                title="Giọng đọc Tiếng Anh"
                value={voiceEn}
                onChange={setVoiceEn}
              />
            </div>
          </section>

          {/* ── Section 2: Cài Đặt Bài Thi ───────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>headphones</span>
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Cài Đặt Bài Thi</h3>
            </div>

            <div className="space-y-5 bg-hover-bg/50 rounded-2xl p-4">
              {/* Speed Control */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tốc độ phát (Speed)
                  </span>
                  <span className="text-primary font-mono text-sm">{examSpeed.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min={SPEED_MIN}
                  max={SPEED_MAX}
                  step={SPEED_STEP}
                  value={examSpeed}
                  onChange={(e) => setExamSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-secondary/60 font-mono">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>1.5x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* Volume Control */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary flex justify-between">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Âm lượng (Volume)
                  </span>
                  <span className="text-primary font-mono text-sm">{Math.round(examVolume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={VOLUME_MIN}
                  max={VOLUME_MAX}
                  step={VOLUME_STEP}
                  value={examVolume}
                  onChange={(e) => setExamVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-secondary/60 font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline shrink-0">
          <p className="text-xs text-secondary/60 text-center">
            Cài đặt được lưu tự động
          </p>
        </div>
      </div>
    </>
  );
}
