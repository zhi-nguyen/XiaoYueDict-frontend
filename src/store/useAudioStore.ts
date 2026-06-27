import { create } from 'zustand';

export type AudioStatus = 'idle' | 'loading' | 'playing';

interface AudioState {
  activeKey: string | null;
  status: AudioStatus;
  play: (key: string, url: string, fallbackText?: string, fallbackLang?: 'zh' | 'en') => Promise<void>;
  stop: () => void;
}

let globalAudio: HTMLAudioElement | null = null;
let globalActiveKey: string | null = null;

export const useAudioStore = create<AudioState>((set, get) => ({
  activeKey: null,
  status: 'idle',

  play: async (key: string, url: string, fallbackText?: string, fallbackLang?: 'zh' | 'en') => {
    // If the clicked key is already active, stop playing
    if (globalActiveKey === key) {
      get().stop();
      return;
    }

    // Stop previous audio
    get().stop();

    set({ activeKey: key, status: 'loading' });
    globalActiveKey = key;

    try {
      let finalUrl = url;

      // Handle TTS client cache if it is a TTS request
      if (typeof window !== 'undefined' && 'caches' in window && url.includes('/api/tts')) {
        try {
          const cache = await caches.open('tts-audio-cache');
          const cachedResponse = await cache.match(url);
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            finalUrl = URL.createObjectURL(blob);
          } else {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response.clone());
              const blob = await response.blob();
              finalUrl = URL.createObjectURL(blob);
            }
          }
        } catch (cacheErr) {
          console.warn('Cache operations failed, using direct URL:', cacheErr);
        }
      }

      // Check if another play request has interrupted this one
      if (globalActiveKey !== key) {
        return;
      }

      const audio = new Audio(finalUrl);
      globalAudio = audio;

      audio.onplay = () => {
        if (globalActiveKey === key) {
          set({ status: 'playing' });
        }
      };

      audio.onplaying = () => {
        if (globalActiveKey === key) {
          set({ status: 'playing' });
        }
      };

      audio.onended = () => {
        if (globalActiveKey === key) {
          set({ activeKey: null, status: 'idle' });
          globalActiveKey = null;
          globalAudio = null;
        }
      };

      audio.onerror = (e) => {
        console.warn('Audio play error, fallback to browser synthesis:', e);
        if (globalActiveKey === key) {
          get().stop();
          if (fallbackText && fallbackLang) {
            import('@/lib/zhUtils').then(({ speakBrowserFallback }) => {
              speakBrowserFallback(fallbackText, fallbackLang);
            });
          }
        }
      };

      await audio.play();
    } catch (err) {
      console.warn('Audio play call failed:', err);
      if (globalActiveKey === key) {
        get().stop();
        if (fallbackText && fallbackLang) {
          import('@/lib/zhUtils').then(({ speakBrowserFallback }) => {
            speakBrowserFallback(fallbackText, fallbackLang);
          });
        }
      }
    }
  },

  stop: () => {
    if (globalAudio) {
      try {
        globalAudio.pause();
        globalAudio.currentTime = 0;
      } catch (e) {
        // Ignored
      }
    }
    globalAudio = null;
    globalActiveKey = null;
    set({ activeKey: null, status: 'idle' });
  }
}));
