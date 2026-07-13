/**
 * Chinese language utility functions.
 *
 * Shared helpers for pinyin processing, character detection,
 * etymology lookup, and clickable-hanzi rendering.
 */

import React from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { directVpsClient } from '@/lib/apiClient';

// ── Etymology Helper ──────────────────────────────────────────────────────────

const ETYMOLOGY_MAP: Readonly<Record<string, string>> = {
  '的': 'hình thanh',
  '欢': 'hình thanh',
  '歡': 'hình thanh',
  '大': 'tượng hình',
  '人': 'tượng hình',
  '山': 'tượng hình',
  '水': 'tượng hình',
  '木': 'tượng hình',
  '火': 'tượng hình',
  '土': 'tượng hình',
  '日': 'tượng hình',
  '月': 'tượng hình',
  '口': 'tượng hình',
  '手': 'tượng hình',
  '目': 'tượng hình',
  '女': 'tượng hình',
  '子': 'tượng hình',
  '门': 'tượng hình',
  '門': 'tượng hình',
  '好': 'hội ý',
  '明': 'hội ý',
  '森': 'hội ý',
  '休': 'hội ý',
  '看': 'hội ý',
  '林': 'hội ý',
  '卡': 'hội ý',
};

export const getEtymology = (char: string): string =>
  ETYMOLOGY_MAP[char] || 'hình thanh';

// ── Pinyin Syllable Set (lowercase, without tones) ────────────────────────────

export const PINYIN_SYLLABLES = new Set([
  "a", "ai", "an", "ang", "ao", "ba", "bai", "ban", "bang", "bao", "bei", "ben", "beng", "bi", "bian", "biao", "bie", "bin", "bing", "bo", "bu",
  "ca", "cai", "can", "cang", "cao", "ce", "cen", "ceng", "cha", "chai", "chan", "chang", "chao", "che", "chen", "cheng", "chi", "chong", "chou",
  "chu", "chua", "chuai", "chuan", "chuang", "chui", "chun", "chuo", "ci", "cong", "cou", "cu", "cuan", "cui", "cun", "cuo",
  "da", "dai", "dan", "dang", "dao", "de", "dei", "den", "deng", "di", "dia", "dian", "diao", "die", "ding", "diu", "dong", "dou",
  "du", "duan", "dui", "dun", "duo", "e", "ei", "en", "eng", "er", "fa", "fan", "fang", "fei", "fen", "feng", "fo", "fou", "fu",
  "ga", "gai", "gan", "gang", "gao", "ge", "gei", "gen", "geng", "gong", "gou", "gu", "gua", "guai", "guan", "guang", "gui", "gun", "guo",
  "ha", "hai", "han", "hang", "hao", "he", "hei", "hen", "heng", "hong", "hou", "hu", "hua", "huai", "huan", "huang", "hui", "hun", "huo",
  "ji", "jia", "jian", "jiang", "jiao", "jie", "jin", "jing", "jiong", "jiu", "ju", "juan", "jue", "jun",
  "ka", "kai", "kan", "kang", "kao", "ke", "ken", "keng", "kong", "kou", "ku", "kua", "kuai", "kuan", "kuang", "kui", "kun", "kuo",
  "la", "lai", "lan", "lang", "lao", "le", "lei", "leng", "li", "lia", "lian", "liang", "liao", "lie", "lin", "ling", "liu", "long", "lou",
  "lu", "lv", "luan", "lue", "lun", "luo", "ma", "mai", "man", "mang", "mao", "me", "mei", "men", "meng", "mi", "mian", "miao", "mie", "min", "ming", "miu", "mo", "mou", "mu",
  "na", "nai", "nan", "nang", "nao", "ne", "nei", "nen", "neng", "ni", "nian", "niang", "niao", "nie", "nin", "ning", "niu", "nong", "nou", "nu", "nv", "nuan", "nue", "nun", "nuo",
  "o", "ou", "pa", "pai", "pan", "pang", "pao", "pei", "pen", "peng", "pi", "pian", "piao", "pie", "pin", "ping", "po", "pou", "pu",
  "qi", "qia", "qian", "qiang", "qiao", "qie", "qin", "qing", "qiong", "qiu", "qu", "quan", "que", "qun",
  "ran", "rang", "rao", "re", "ren", "reng", "ri", "rong", "rou", "ru", "rua", "ruan", "rui", "run", "ruo",
  "sa", "sai", "san", "sang", "sao", "se", "sen", "seng", "sha", "shai", "shan", "shang", "shao", "she", "shei", "shen", "sheng", "shi", "shou",
  "shu", "shua", "shuai", "shuan", "shuang", "shui", "shun", "shuo", "si", "song", "sou", "su", "suan", "sui", "sun", "suo",
  "ta", "tai", "tan", "tang", "tao", "te", "teng", "ti", "tian", "tiao", "tie", "ting", "tong", "tou", "tu", "tuan", "tui", "tun", "tuo",
  "wa", "wai", "wan", "wang", "wei", "wen", "weng", "wo", "wu",
  "xi", "xia", "xian", "xiang", "xiao", "xie", "xin", "xing", "xiong", "xiu", "xu", "xuan", "xue", "xun",
  "ya", "yan", "yang", "yao", "ye", "yi", "yin", "ying", "yong", "you", "yu", "yuan", "yue", "yun",
  "za", "zai", "zan", "zang", "zao", "ze", "zei", "zen", "zeng", "zha", "zhai", "zhan", "zhang", "zhao", "zhe", "zhei", "zhen", "zheng", "zhi", "zhong", "zhou",
  "zhu", "zhua", "zhuai", "zhuan", "zhuang", "zhui", "zhun", "zhuo", "zi", "zong", "zou", "zu", "zuan", "zui", "zun", "zuo"
]);

// ── Tone Removal ──────────────────────────────────────────────────────────────

const TONE_MAP: Readonly<Record<string, string>> = {
  'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
  'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
  'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
  'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
  'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
  'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v', 'ü': 'v'
};

export const removeTones = (str: string): string =>
  str.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, c => TONE_MAP[c] || c);

// ── Pinyin Syllable Splitter ──────────────────────────────────────────────────

export const splitPinyin = (pinyin: string): string[] => {
  const cleanPinyin = pinyin.toLowerCase().replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']/g, '');
  const syllables: string[] = [];
  let i = 0;
  while (i < cleanPinyin.length) {
    if (cleanPinyin[i] === "'") {
      i++;
      continue;
    }
    let matchedLen = 0;
    for (let len = Math.min(6, cleanPinyin.length - i); len >= 1; len--) {
      const sub = cleanPinyin.slice(i, i + len);
      const untoned = removeTones(sub);
      if (PINYIN_SYLLABLES.has(untoned)) {
        matchedLen = len;
        break;
      }
    }
    if (matchedLen > 0) {
      syllables.push(cleanPinyin.slice(i, i + matchedLen));
      i += matchedLen;
    } else {
      syllables.push(cleanPinyin[i]);
      i++;
    }
  }
  return syllables;
};

// ── Chinese Character Detection ───────────────────────────────────────────────

export const isChineseChar = (char: string): boolean => {
  try {
    return new RegExp('\\p{Unified_Ideograph}', 'u').test(char);
  } catch (e) {
    return /[\u4e00-\u9fa5]/.test(char);
  }
};

// ── Clickable Hanzi Rendering ─────────────────────────────────────────────────

export const renderClickableHanzi = (
  text: string,
  onCharClick?: (char: string) => void
): React.ReactNode => {
  if (!text) return '';
  if (!onCharClick) return text;

  return Array.from(text).map((char, idx) => {
    if (isChineseChar(char)) {
      return React.createElement(
        'span',
        {
          key: idx,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onCharClick(char);
          },
          className: 'cursor-pointer hover:text-red-600 hover:underline decoration-red-500/50 transition-colors',
          title: `Tra cứu chữ ${char}`,
        },
        char
      );
    }
    return React.createElement('span', { key: idx }, char);
  });
};

// ── TTS Browser Fallback ──────────────────────────────────────────────────────

export const speakBrowserFallback = (text: string, lang: 'zh' | 'en', onEnded?: () => void): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    if (onEnded) {
      utterance.onend = onEnded;
      utterance.onerror = onEnded;
    }
    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnded) {
      setTimeout(onEnded, 1000);
    }
  }
};
export const speakChinese = (text: string): void => {
  let voice: string | undefined = undefined;
  try {
    if (typeof window !== 'undefined') {
      voice = useSettingsStore.getState().getVoiceName('zh');
    }
  } catch (e) {
    console.warn('Failed to retrieve voice name from useSettingsStore in speakChinese:', e);
  }

  playTTSWithClientCache(text, 'zh', voice).catch((err) => {
    console.warn('[speakChinese] playTTSWithClientCache failed, fallback should have run internally:', err);
  });
};

// ── Common Radical Name Map ───────────────────────────────────────────────────

export const COMMON_RADICALS: Readonly<Record<string, string>> = {
  '白': 'BẠCH', '大': 'ĐẠI', '口': 'KHẨU', '人': 'NHÂN', '亻': 'NHÂN (đứng)', '女': 'NỮ', '子': 'TỬ',
  '宀': 'MIÊN', '山': 'SƠN', '水': 'THỦY', '氵': 'THỦY (ba chấm)', '木': 'MỘC', '火': 'HỎA',
  '灬': 'HỎA (nằm)', '土': 'THỔ', '日': 'NHẬT', '月': 'NGUYỆT', '手': 'THỦ', '扌': 'THỦ (gảy)',
  '目': 'MỤC', '心': 'TÂM', '忄': 'TÂM (đứng)', '言': 'NGÔN', '讠': 'NGÔN (phía)', '金': 'KIM',
  '钅': 'KIM (phía)', '糸': 'MỊCH', '纟': 'MỊCH (phía)', '竹': 'TRÚC', '⺮': 'TRÚC (đầu)',
  '辵': 'SÁI', '辶': 'SÁI (quai xước)', '阝': 'ẤP/PHỤ', '艹': 'THẢO', '欠': 'KHIẾM',
};

// ── Common Hán Việt Map (for sentence reading) ───────────────────────────────

export const COMMON_HAN_VIET: Readonly<Record<string, string>> = {
  '今': 'KIM', '天': 'THIÊN', '下': 'HẠ', '了': 'LIỄU', '很': 'NGẬN', '大': 'ĐẠI', '的': 'ĐÍCH', '雪': 'TUYẾT',
  '喜': 'HỶ', '欢': 'HOAN', '歡': 'HOAN', '我': 'NGÃ', '爱': 'ÁI', '愛': 'ÁI',
};

// ── Client-Side TTS Cache Player ──────────────────────────────────────────────

// In-flight WebSocket listener deduplication: prevents duplicate event listeners
// for the same task_id when multiple callers await the same PENDING task.
const inflightWSListeners = new Map<string, Promise<string>>();

// Helper to wait for the WebSocket notification of TTS audio generation
const waitForTTS = (taskId: string): Promise<string> => {
  // If a listener is already registered for this task_id, reuse the existing Promise
  const existing = inflightWSListeners.get(taskId);
  if (existing) {
    return existing;
  }

  const promise = new Promise<string>((resolve, reject) => {
    const handleCompleted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.task_id === taskId) {
        cleanup();
        resolve(detail.audio_url);
      }
    };
    const handleFailed = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.task_id === taskId) {
        cleanup();
        reject(new Error(detail.error || 'TTS generation failed'));
      }
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('TTS request timeout (15s)'));
    }, 15000);

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('tts_task_completed', handleCompleted);
      window.removeEventListener('tts_task_failed', handleFailed);
    };

    window.addEventListener('tts_task_completed', handleCompleted);
    window.addEventListener('tts_task_failed', handleFailed);
  }).finally(() => {
    inflightWSListeners.delete(taskId);
  });

  inflightWSListeners.set(taskId, promise);
  return promise;
};

// ── Client-Side TTS Cache Player ──────────────────────────────────────────────

let activeAudio: HTMLAudioElement | null = null;
let currentPlaybackToken = 0;

/**
 * Stop any active TTS audio playing (both HTML5 Audio and Web Speech Synthesis),
 * and cancel any pending TTS audio requests that are currently loading.
 */
export const stopActiveTTS = (): void => {
  currentPlaybackToken++; // Invalidate any pending play requests currently awaiting async fetches
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.onended = null;
      activeAudio.onerror = null;
    } catch (e) {
      // Ignored
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignored
    }
  }
};

export const playTTSWithClientCache = async (
  text: string, 
  lang: 'zh' | 'en', 
  voice?: string,
  onEnded?: () => void
): Promise<void> => {
  if (!text) return;

  // Stop any currently playing audio and invalidate pending fetches
  stopActiveTTS();
  const myToken = currentPlaybackToken;

  const langCode = lang === 'en' ? 'en' : 'zh';

  let resolvedVoice = voice;
  if (!resolvedVoice) {
    try {
      if (typeof window !== 'undefined') {
        resolvedVoice = useSettingsStore.getState().getVoiceName(lang);
      }
    } catch (e) {
      // Ignored
    }
  }

  if (myToken !== currentPlaybackToken) {
    if (onEnded) onEnded();
    return;
  }

  if (resolvedVoice === 'browser_base') {
    speakBrowserFallback(text, langCode, onEnded);
    return;
  }

  // Local cache key using standard relative URL structure
  let cacheKeyUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${langCode}`;
  if (resolvedVoice) {
    cacheKeyUrl += `&voice=${encodeURIComponent(resolvedVoice)}`;
  }

  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open('tts-audio-cache');
      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }
      const cachedResponse = await cache.match(cacheKeyUrl);

      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        if (myToken !== currentPlaybackToken) {
          if (onEnded) onEnded();
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        activeAudio = audio;
        if (onEnded) {
          audio.onended = () => {
            if (activeAudio === audio) activeAudio = null;
            onEnded();
          };
          audio.onerror = () => {
            if (activeAudio === audio) activeAudio = null;
            onEnded();
          };
        }
        await audio.play();
        return;
      }

      // Call Direct VPS to trigger or fetch cached audio
      const response = await directVpsClient.get(`/media/tts/`, {
        params: {
          text: text.trim(),
          voice: resolvedVoice || ''
        }
      });

      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }

      let audioUrl = '';
      if (response.data.status === 'SUCCESS') {
        audioUrl = response.data.audio_url;
      } else if (response.data.status === 'PENDING') {
        // Wait for WebSocket event
        audioUrl = await waitForTTS(response.data.task_id);
      } else {
        throw new Error('Invalid TTS response status');
      }

      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }

      // Fetch the binary file from GCS or Media storage to cache it locally
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error('Failed to download generated TTS audio file');
      }

      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }

      // Put cloned response to local cache using standard local key
      await cache.put(cacheKeyUrl, audioResponse.clone());

      const blob = await audioResponse.blob();
      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      activeAudio = audio;
      if (onEnded) {
        audio.onended = () => {
          if (activeAudio === audio) activeAudio = null;
          onEnded();
        };
        audio.onerror = () => {
          if (activeAudio === audio) activeAudio = null;
          onEnded();
        };
      }
      await audio.play();
    } else {
      // Fallback for environment without Caches API support
      const response = await directVpsClient.get(`/media/tts/`, {
        params: {
          text: text.trim(),
          voice: resolvedVoice || ''
        }
      });

      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }

      let audioUrl = '';
      if (response.data.status === 'SUCCESS') {
        audioUrl = response.data.audio_url;
      } else if (response.data.status === 'PENDING') {
        audioUrl = await waitForTTS(response.data.task_id);
      }

      if (myToken !== currentPlaybackToken) {
        if (onEnded) onEnded();
        return;
      }

      const audio = new Audio(audioUrl);
      activeAudio = audio;
      if (onEnded) {
        audio.onended = () => {
          if (activeAudio === audio) activeAudio = null;
          onEnded();
        };
        audio.onerror = () => {
          if (activeAudio === audio) activeAudio = null;
          onEnded();
        };
      }
      await audio.play();
    }
  } catch (err) {
    console.warn('TTS async orchestration failed, falling back to browser SpeechSynthesis:', err);
    if (myToken === currentPlaybackToken) {
      speakBrowserFallback(text, langCode, onEnded);
    } else {
      if (onEnded) onEnded();
    }
  }
};

// In-flight prefetch deduplication: prevents duplicate API calls for the same text+voice
const inflightPrefetchRequests = new Map<string, Promise<void>>();

// Internal implementation of prefetch TTS logic
const _doPrefetchTTS = async (
  text: string,
  langCode: string,
  resolvedVoice: string | undefined,
  cacheKeyUrl: string
): Promise<void> => {
  if (typeof window !== 'undefined' && 'caches' in window) {
    const cache = await caches.open('tts-audio-cache');
    const cachedResponse = await cache.match(cacheKeyUrl);

    if (cachedResponse) {
      return;
    }

    const response = await directVpsClient.get(`/media/tts/`, {
      params: {
        text: text.trim(),
        voice: resolvedVoice || ''
      }
    });

    let audioUrl = '';
    if (response.data.status === 'SUCCESS') {
      audioUrl = response.data.audio_url;
    } else if (response.data.status === 'PENDING') {
      audioUrl = await waitForTTS(response.data.task_id);
    } else {
      throw new Error('Invalid TTS response status');
    }

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download generated TTS audio file');
    }

    await cache.put(cacheKeyUrl, audioResponse.clone());
  }
};

export const prefetchTTS = async (
  text: string,
  lang: 'zh' | 'en',
  voice?: string
): Promise<void> => {
  if (!text) return;
  const langCode = lang === 'en' ? 'en' : 'zh';

  let resolvedVoice = voice;
  if (!resolvedVoice) {
    try {
      if (typeof window !== 'undefined') {
        resolvedVoice = useSettingsStore.getState().getVoiceName(lang);
      }
    } catch (e) {
      // Ignored
    }
  }

  if (resolvedVoice === 'browser_base') {
    return;
  }

  let cacheKeyUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${langCode}`;
  if (resolvedVoice) {
    cacheKeyUrl += `&voice=${encodeURIComponent(resolvedVoice)}`;
  }

  // Deduplicate: if the same text+lang+voice is already being prefetched, reuse
  const dedupeKey = `${text.trim()}:${langCode}:${resolvedVoice || 'default'}`;
  const existing = inflightPrefetchRequests.get(dedupeKey);
  if (existing) {
    return existing;
  }

  const promise = _doPrefetchTTS(text, langCode, resolvedVoice, cacheKeyUrl)
    .catch((err) => {
      // Graceful rejection: log warning locally, do not throw to caller
      console.warn(`[Prefetch Ignored] Không thể tải trước TTS cho từ "${text}":`, err);
    })
    .finally(() => {
      inflightPrefetchRequests.delete(dedupeKey);
    });

  inflightPrefetchRequests.set(dedupeKey, promise);
  return promise;
};

/**
 * Batch check which words already have TTS audio cached on backend.
 * Returns a Map of text -> audio_url for cached items.
 * Frontend can then skip prefetchTTS for these words and cache them locally directly.
 */
export const batchCheckTTSCache = async (
  words: string[],
  voice: string
): Promise<Map<string, string>> => {
  const result = new Map<string, string>();
  if (!words.length || !voice) return result;

  try {
    const response = await directVpsClient.post('/media/tts/batch-status/', {
      items: words.map(text => ({ text: text.trim(), voice }))
    });

    const results = response.data?.results || [];
    for (const item of results) {
      if (item.status === 'cached' && item.audio_url) {
        result.set(item.text, item.audio_url);
      }
    }
  } catch (err) {
    console.warn('[batchCheckTTSCache] Failed:', err);
  }

  return result;
};

export interface BatchTTSResult {
  text: string;
  status: 'cached' | 'pending' | 'invalid';
  audio_url?: string;
  task_id?: string;
}

/**
 * Batch trigger/check TTS status for all words.
 * Triggers Celery generation tasks on backend for uncached words,
 * and sets up background WebSocket listeners to pre-warm the browser cache.
 */
export const batchTriggerTTS = async (
  words: string[],
  voice: string,
  lang: 'zh' | 'en'
): Promise<Map<string, string>> => {
  const cachedMap = new Map<string, string>();
  if (!words.length || !voice) return cachedMap;

  const langCode = lang === 'en' ? 'en' : 'zh';

  try {
    const response = await directVpsClient.post('/media/tts/batch-trigger/', {
      items: words.map(text => ({ text: text.trim(), voice }))
    });

    const results: BatchTTSResult[] = response.data?.results || [];
    const hasCacheSupport = typeof window !== 'undefined' && 'caches' in window;
    const browserCache = hasCacheSupport ? await caches.open('tts-audio-cache') : null;

    for (const item of results) {
      const localKey = `/api/tts?text=${encodeURIComponent(item.text)}&lang=${langCode}&voice=${encodeURIComponent(voice)}`;

      if (item.status === 'cached' && item.audio_url) {
        cachedMap.set(item.text, item.audio_url);

        // Pre-warm local browser cache
        if (browserCache) {
          const existing = await browserCache.match(localKey);
          if (!existing) {
            // Asynchronously fetch and cache
            fetch(item.audio_url)
              .then(resp => {
                if (resp.ok) {
                  browserCache.put(localKey, resp.clone());
                }
              })
              .catch(() => { /* ignore */ });
          }
        }
      } else if (item.status === 'pending' && item.task_id) {
        // Listen to WebSocket and cache in background once completed
        if (browserCache) {
          waitForTTS(item.task_id)
            .then(async (audioUrl) => {
              const existing = await browserCache.match(localKey);
              if (!existing) {
                const resp = await fetch(audioUrl);
                if (resp.ok) {
                  await browserCache.put(localKey, resp.clone());
                }
              }
            })
            .catch((err) => {
              console.warn(`[batchTriggerTTS] Background prefetch failed for "${item.text}":`, err);
            });
        }
      }
    }
  } catch (err) {
    console.warn('[batchTriggerTTS] Failed:', err);
  }

  return cachedMap;
};

