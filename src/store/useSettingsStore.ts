import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Voice Type ────────────────────────────────────────────────────────────────
export type VoiceOption = 'female_neural' | 'male_neural' | 'browser_base';

// ── Voice Mapping Constants ───────────────────────────────────────────────────
export const VOICE_MAP = {
  zh: {
    female_neural: 'zh-CN-XiaoxiaoNeural',
    male_neural: 'zh-CN-YunxiNeural',
    browser_base: 'browser_base',
  },
  en: {
    female_neural: 'en-US-AriaNeural',
    male_neural: 'en-US-GuyNeural',
    browser_base: 'browser_base',
  },
} as const;

// ── Voice Display Labels ──────────────────────────────────────────────────────
export const VOICE_LABELS = {
  zh: {
    female_neural: 'Nữ (Xiaoxiao)',
    male_neural: 'Nam (Yunxi)',
    browser_base: 'Trình duyệt',
  },
  en: {
    female_neural: 'Nữ (Aria)',
    male_neural: 'Nam (Guy)',
    browser_base: 'Trình duyệt',
  },
} as const;

// ── Speed Presets ─────────────────────────────────────────────────────────────
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2.0;
export const SPEED_STEP = 0.05;
export const SPEED_DEFAULT = 1.0;

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;
export const VOLUME_STEP = 0.05;
export const VOLUME_DEFAULT = 1.0;

// ── Settings State Interface ──────────────────────────────────────────────────
interface SettingsState {
  // --- Cài Đặt Hệ Thống (System Settings) ---
  voiceZh: VoiceOption;
  voiceEn: VoiceOption;

  // --- Cài Đặt Bài Thi (Exam Settings) ---
  examSpeed: number;
  examVolume: number;

  // Actions
  setVoiceZh: (voice: VoiceOption) => void;
  setVoiceEn: (voice: VoiceOption) => void;
  setExamSpeed: (speed: number) => void;
  setExamVolume: (volume: number) => void;

  /**
   * Returns the Edge-TTS voice name for the given language,
   * or 'browser_base' if browser TTS is selected.
   */
  getVoiceName: (lang: 'zh' | 'en') => string;
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Defaults
      voiceZh: 'female_neural',
      voiceEn: 'female_neural',
      examSpeed: SPEED_DEFAULT,
      examVolume: VOLUME_DEFAULT,

      // Setters
      setVoiceZh: (voice) => set({ voiceZh: voice }),
      setVoiceEn: (voice) => set({ voiceEn: voice }),
      setExamSpeed: (speed) => set({ examSpeed: Math.max(SPEED_MIN, Math.min(SPEED_MAX, speed)) }),
      setExamVolume: (volume) => set({ examVolume: Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume)) }),

      // Helper
      getVoiceName: (lang) => {
        const state = get();
        const voiceKey = lang === 'zh' ? state.voiceZh : state.voiceEn;
        return VOICE_MAP[lang][voiceKey];
      },
    }),
    {
      name: 'app-settings',
      // Migrate from old localStorage keys on first load
      onRehydrateStorage: () => {
        return (state) => {
          if (typeof window === 'undefined' || !state) return;

          try {
            // Migrate legacy exam_audio_speed
            const legacySpeed = localStorage.getItem('exam_audio_speed');
            if (legacySpeed) {
              const parsed = parseFloat(legacySpeed);
              if (!isNaN(parsed)) {
                state.setExamSpeed(parsed);
              }
              localStorage.removeItem('exam_audio_speed');
            }

            // Migrate legacy exam_audio_volume
            const legacyVolume = localStorage.getItem('exam_audio_volume');
            if (legacyVolume) {
              const parsed = parseFloat(legacyVolume);
              if (!isNaN(parsed)) {
                state.setExamVolume(parsed);
              }
              localStorage.removeItem('exam_audio_volume');
            }
          } catch {
            // Silently ignore migration errors
          }
        };
      },
    }
  )
);
