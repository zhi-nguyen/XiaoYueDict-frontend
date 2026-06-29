import { create } from 'zustand';

export type AudioStatus = 'idle' | 'loading' | 'playing';

interface AudioState {
  activeKey: string | null;
  status: AudioStatus;
  play: (key: string, url: string, fallbackText?: string, fallbackLang?: 'zh' | 'en', voice?: string) => Promise<void>;
  stop: () => void;
}

let globalAudio: HTMLAudioElement | null = null;
let globalActiveKey: string | null = null;

export const useAudioStore = create<AudioState>((set, get) => ({
  activeKey: null,
  status: 'idle',

  play: async (key: string, url: string, fallbackText?: string, fallbackLang?: 'zh' | 'en', voice?: string) => {
    // If the clicked key is already active, stop playing
    if (globalActiveKey === key) {
      get().stop();
      return;
    }

    // Stop previous audio
    get().stop();

    set({ activeKey: key, status: 'loading' });
    globalActiveKey = key;

    const isBrowserBase = voice === 'browser_base' || url.includes('voice=browser_base');

    if (isBrowserBase) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(fallbackText || '');
          utterance.lang = fallbackLang === 'zh' ? 'zh-CN' : 'en-US';
          utterance.onstart = () => {
            if (globalActiveKey === key) {
              set({ status: 'playing' });
            }
          };
          utterance.onend = () => {
            if (globalActiveKey === key) {
              set({ activeKey: null, status: 'idle' });
              globalActiveKey = null;
            }
          };
          utterance.onerror = () => {
            if (globalActiveKey === key) {
              set({ activeKey: null, status: 'idle' });
              globalActiveKey = null;
            }
          };
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Browser SpeechSynthesis failed:', err);
          set({ activeKey: null, status: 'idle' });
          globalActiveKey = null;
        }
      } else {
        set({ activeKey: null, status: 'idle' });
        globalActiveKey = null;
      }
      return;
    }

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignored
      }
    }
    globalAudio = null;
    globalActiveKey = null;
    set({ activeKey: null, status: 'idle' });
  }
}));
