"use client";

import React, { useState, useRef, useEffect } from 'react';
import WordCard from '@/components/WordCard';
import PracticeHub from '@/components/PracticeHub';
import SearchBar from '@/components/dictionary/SearchBar';
import HanziStrokeBox, { HanziStrokeSequence } from '@/components/HanziStrokeBox';
import { ZhWord, ZhExample } from '@/types/dictionary';
import { djangoClient } from '@/lib/apiClient';
import { Volume2, Bookmark, ArrowUpDown, Loader2, ChevronDown } from 'lucide-react';
import { useWebSocket, getGuestId } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';

// Common etymology helper
const getEtymology = (char: string): string => {
  const mapping: Record<string, string> = {
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
  return mapping[char] || 'hình thanh';
};

// Set of all valid Pinyin syllables (lowercase, without tones)
const PINYIN_SYLLABLES = new Set([
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

const removeTones = (str: string): string => {
  const map: Record<string, string> = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v', 'ü': 'v'
  };
  return str.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, c => map[c] || c);
};

const splitPinyin = (pinyin: string): string[] => {
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

// Check if character is Chinese
const isChineseChar = (char: string) => /[\u4e00-\u9fa5]/.test(char);

const renderClickableHanzi = (text: string, onCharClick?: (char: string) => void) => {
  if (!text) return '';
  if (!onCharClick) return text;

  return Array.from(text).map((char, idx) => {
    if (isChineseChar(char)) {
      return (
        <span
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            onCharClick(char);
          }}
          className="cursor-pointer hover:text-red-600 hover:underline decoration-red-500/50 transition-colors"
          title={`Tra cứu chữ ${char}`}
        >
          {char}
        </span>
      );
    }
    return <span key={idx}>{char}</span>;
  });
};

export default function StudyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'hanzi' | 'examples'>('vocabulary');

  // Search data states
  const [wordResults, setWordResults] = useState<ZhWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<ZhWord | null>(null);
  const [exactExampleMatch, setExactExampleMatch] = useState<any>(null);

  // Translation fallback states
  const [translationResult, setTranslationResult] = useState<{ text: string; source: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState('');

  const { isAuthenticated } = useAuthStore();

  useWebSocket({
    onMessage: (msg) => {
      if (!currentTaskId || msg.payload?.task_id !== currentTaskId) return;

      if (msg.type === 'translation_complete') {
        const payload = msg.payload as any;
        setTranslationResult({
          text: payload.translatedText,
          source: payload.source || 'ai_translation'
        });
        setIsTranslating(false);
        setCurrentTaskId(null);
      } else if (msg.type === 'translation_failed') {
        const payload = msg.payload as any;
        setTranslationError(payload.error || 'Dịch thuật thất bại.');
        setIsTranslating(false);
        setCurrentTaskId(null);
      }
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const practiceSectionRef = useRef<HTMLDivElement>(null);

  // Hanzi tab state
  const [selectedHanziChar, setSelectedHanziChar] = useState<string | null>(null);
  const [hanziWords, setHanziWords] = useState<Record<string, ZhWord | null>>({});
  const [resolvedRadicals, setResolvedRadicals] = useState<Record<string, string>>({});

  // Database examples fallback & pagination states
  const [dbExamples, setDbExamples] = useState<ZhExample[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [visibleExamplesCount, setVisibleExamplesCount] = useState(5);
  const [isLoadingHanziDetails, setIsLoadingHanziDetails] = useState(false);

  // Dynamic Hán Việt sentence reading state
  const [queryText, setQueryText] = useState('');
  const [hanVietSentence, setHanVietSentence] = useState('');

  const handleScrollToPractice = () => {
    practiceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Resolve radical names dynamically with db lookups and caching
  const resolveRadicalName = async (radicalChar: string): Promise<string> => {
    if (!radicalChar) return '';
    const commonRadicals: Record<string, string> = {
      '白': 'BẠCH', '大': 'ĐẠI', '口': 'KHẨU', '人': 'NHÂN', '亻': 'NHÂN (đứng)', '女': 'NỮ', '子': 'TỬ',
      '宀': 'MIÊN', '山': 'SƠN', '水': 'THỦY', '氵': 'THỦY (ba chấm)', '木': 'MỘC', '火': 'HỎA',
      '灬': 'HỎA (nằm)', '土': 'THỔ', '日': 'NHẬT', '月': 'NGUYỆT', '手': 'THỦ', '扌': 'THỦ (gảy)',
      '目': 'MỤC', '心': 'TÂM', '忄': 'TÂM (đứng)', '言': 'NGÔN', '讠': 'NGÔN (phía)', '金': 'KIM',
      '钅': 'KIM (phía)', '糸': 'MỊCH', '纟': 'MỊCH (phía)', '竹': 'TRÚC', '⺮': 'TRÚC (đầu)',
      '辵': 'SÁI', '辶': 'SÁI (quai xước)', '阝': 'ẤP/PHỤ', '艹': 'THẢO', '欠': 'KHIẾM',
    };

    if (commonRadicals[radicalChar]) {
      return `${commonRadicals[radicalChar]} ${radicalChar}`;
    }

    try {
      const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(radicalChar)}`);
      if (res.data.results && res.data.results.length > 0) {
        const match = res.data.results.find((w: any) => w.word === radicalChar);
        if (match && match.han_viet) {
          return `${match.han_viet.trim().toUpperCase()} ${radicalChar}`;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return radicalChar;
  };

  // Direct AI translation fallback using WebSockets
  const handleDirectTranslation = async (text: string) => {
    setIsTranslating(true);
    setTranslationError('');
    setCurrentTaskId(null);
    setPendingText(text);

    try {
      const payload: any = { text };
      const guestId = !isAuthenticated ? getGuestId() : null;
      if (guestId) {
        payload.guest_id = guestId;
      }

      const res = await djangoClient.post('/dictionary/zh/translate/', payload);
      if (res.data.status === 'SUCCESS') {
        setTranslationResult({
          text: res.data.translatedText,
          source: res.data.source || 'ai_translation'
        });
        setIsTranslating(false);
      } else if (res.data.status === 'PENDING' && res.data.task_id) {
        setCurrentTaskId(res.data.task_id);
      } else {
        setTranslationError('Lỗi dịch thuật từ máy chủ.');
        setIsTranslating(false);
      }
    } catch (e: any) {
      setTranslationError(e.message || 'Lỗi kết nối máy chủ dịch thuật.');
      setIsTranslating(false);
    }
  };

  // Master search handler
  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setIsLoading(true);
    setWordResults([]);
    setSelectedWord(null);
    setExactExampleMatch(null);
    setTranslationResult(null);
    setTranslationError('');
    setCurrentTaskId(null);
    setPendingText(trimmed);

    try {
      const guestId = !isAuthenticated ? getGuestId() : null;
      let url = `/dictionary/zh/search/?q=${encodeURIComponent(trimmed)}`;
      if (guestId) {
        url += `&guest_id=${guestId}`;
      }
      const res = await djangoClient.get(url);

      if (res.status === 202 && res.data.task_id) {
        setIsTranslating(true);
        setCurrentTaskId(res.data.task_id);
      } else if (res.data.translatedText) {
        setTranslationResult({
          text: res.data.translatedText,
          source: res.data.source || 'ai_translation'
        });
      } else {
        const results = res.data.results || [];
        const exactMatch = res.data.exact_example_match || null;

        setWordResults(results);
        setExactExampleMatch(exactMatch);

        if (results.length > 0) {
          setSelectedWord(results[0]);
        } else if (!exactMatch) {
          handleDirectTranslation(trimmed);
        }
      }
    } catch (e: any) {
      console.error("Search failed, running translation fallback", e);
      handleDirectTranslation(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract Chinese characters from search query
  const hanziChars = Array.from(searchQuery).filter(isChineseChar);

  // Auto-select first hanzi char in Hán tự tab
  useEffect(() => {
    if (activeTab === 'hanzi' && hanziChars.length > 0 && !selectedHanziChar) {
      setSelectedHanziChar(hanziChars[0]);
    }
  }, [activeTab, searchQuery, selectedHanziChar, hanziChars]);

  // Fetch examples containing the search query with fallback=false (so we don't hit AI translation but get database examples instead)
  useEffect(() => {
    const fetchDbExamples = async () => {
      if (!searchQuery) {
        setDbExamples([]);
        return;
      }
      setIsLoadingExamples(true);
      try {
        const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(searchQuery)}&fallback=false`);
        const results = res.data.results || [];
        const collected: ZhExample[] = [];
        const seen = new Set<string>();

        results.forEach((word: ZhWord) => {
          if (word.examples) {
            word.examples.forEach((ex) => {
              if (
                (ex.chinese.includes(searchQuery) || ex.vietnamese.includes(searchQuery)) &&
                !seen.has(ex.chinese)
              ) {
                seen.add(ex.chinese);
                collected.push(ex);
              }
            });
          }
        });
        setDbExamples(collected);
      } catch (e) {
        console.error("Failed to fetch database examples", e);
      } finally {
        setIsLoadingExamples(false);
      }
    };

    setVisibleExamplesCount(5);
    fetchDbExamples();
  }, [searchQuery]);

  // Load Hanzi character details
  useEffect(() => {
    const fetchHanziDetails = async () => {
      if (!selectedHanziChar) return;
      if (hanziWords[selectedHanziChar]) return;

      setIsLoadingHanziDetails(true);
      try {
        const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(selectedHanziChar)}&fallback=false`);
        const results = res.data.results || [];

        let exactWord = results.find((w: ZhWord) => w.word === selectedHanziChar) || null;

        if (!exactWord) {
          const parentWord = results.find((w: ZhWord) => w.word.includes(selectedHanziChar));
          if (parentWord) {
            const i = parentWord.word.indexOf(selectedHanziChar);
            const radical = parentWord.radical?.[i] || '';
            const stroke_number = parentWord.stroke_number?.[i] || 0;
            const components = parentWord.components?.[i] || [];

            let pinyin = '';
            if (parentWord.pinyin) {
              const syllables = splitPinyin(parentWord.pinyin);
              if (syllables.length === parentWord.word.length) {
                pinyin = syllables[i];
              } else {
                pinyin = parentWord.pinyin;
              }
            }

            let han_viet = '';
            if (parentWord.han_viet) {
              const hanVietWords = parentWord.han_viet.split(/[\s,]+/);
              if (hanVietWords.length === parentWord.word.length) {
                han_viet = hanVietWords[i];
              } else {
                han_viet = parentWord.han_viet;
              }
            }

            // Collect examples containing the character from results
            const collectedExamples: ZhExample[] = [];
            const seen = new Set<string>();
            results.forEach((w: ZhWord) => {
              if (w.examples) {
                w.examples.forEach((ex) => {
                  if (ex.chinese.includes(selectedHanziChar) && !seen.has(ex.chinese)) {
                    seen.add(ex.chinese);
                    collectedExamples.push(ex);
                  }
                });
              }
            });

            exactWord = {
              id: parentWord.id,
              word: selectedHanziChar,
              traditional: parentWord.traditional?.[i] || '',
              pinyin: pinyin,
              toneless_pinyin: removeTones(pinyin),
              han_viet: han_viet,
              translation_vi: `Chữ ${selectedHanziChar} trong từ ghép ${parentWord.word} ("${parentWord.translation_vi}")`,
              translation_en: `The character ${selectedHanziChar} in compound word ${parentWord.word} ("${parentWord.translation_en}")`,
              part_of_speech: [],
              hsk_level: parentWord.hsk_level,
              radical: [radical],
              stroke_number: [stroke_number],
              components: [components],
              synonyms: [],
              antonyms: [],
              tags: [],
              word_frequency: parentWord.word_frequency,
              popularity_rank: parentWord.popularity_rank,
              audio_url: '',
              examples: collectedExamples
            };
          }
        }

        setHanziWords((prev) => ({
          ...prev,
          [selectedHanziChar]: exactWord
        }));

        if (exactWord && exactWord.radical && exactWord.radical.length > 0) {
          const rad = exactWord.radical[0];
          if (!resolvedRadicals[rad]) {
            const radName = await resolveRadicalName(rad);
            setResolvedRadicals((prev) => ({
              ...prev,
              [rad]: radName
            }));
          }
        }
      } catch (e) {
        console.error("Failed to load hanzi details", e);
      } finally {
        setIsLoadingHanziDetails(false);
      }
    };

    if (activeTab === 'hanzi') {
      fetchHanziDetails();
    }
  }, [selectedHanziChar, activeTab]);

  // Resolve queryText for Hán Việt sentence generator
  useEffect(() => {
    if (exactExampleMatch) {
      setQueryText(exactExampleMatch.chinese);
    } else if (translationResult) {
      setQueryText(searchQuery);
    } else {
      setQueryText('');
    }
  }, [exactExampleMatch, translationResult, searchQuery]);

  // Resolve dynamic Hán Việt reading for sentences
  useEffect(() => {
    if (!queryText) {
      setHanVietSentence('');
      return;
    }

    const resolveSentenceHanViet = async () => {
      const chars = Array.from(queryText);
      const resolved = await Promise.all(
        chars.map(async (char) => {
          if (isChineseChar(char)) {
            try {
              const commonHanViet: Record<string, string> = {
                '今': 'KIM', '天': 'THIÊN', '下': 'HẠ', '了': 'LIỄU', '很': 'NGẬN', '大': 'ĐẠI', '的': 'ĐÍCH', '雪': 'TUYẾT',
                '喜': 'HỶ', '欢': 'HOAN', '歡': 'HOAN', '我': 'NGÃ', '爱': 'ÁI', '愛': 'ÁI', 'biết': 'TRI', 'nói': 'THUYẾT'
              };
              if (commonHanViet[char]) return commonHanViet[char];

              const res = await djangoClient.get(`/dictionary/zh/search/?q=${encodeURIComponent(char)}`);
              if (res.data.results && res.data.results.length > 0) {
                const match = res.data.results.find((w: any) => w.word === char);
                if (match && match.han_viet) {
                  return match.han_viet.trim().toUpperCase().split('/')[0].split(',')[0];
                }
              }
            } catch (e) {
              console.error(e);
            }
            return '';
          }
          return char;
        })
      );

      let resultStr = '';
      for (let i = 0; i < resolved.length; i++) {
        const current = resolved[i];
        const prev = i > 0 ? resolved[i - 1] : '';
        const isCurrentWord = /^[A-ZĐĂÂÊÔƠƯ]+$/.test(current);
        const isPrevWord = /^[A-ZĐĂÂÊÔƠƯ]+$/.test(prev);

        if (isCurrentWord && isPrevWord) {
          resultStr += ' ' + current;
        } else {
          resultStr += current;
        }
      }
      setHanVietSentence(resultStr);
    };

    resolveSentenceHanViet();
  }, [queryText]);

  // Extract examples matching the query
  const getMatchingExamples = (): any[] => {
    if (!searchQuery) return [];

    if (dbExamples.length > 0) {
      return dbExamples;
    }

    const collected: any[] = [];
    const seen = new Set<string>();

    if (exactExampleMatch) {
      collected.push({
        id: 'exact-match',
        chinese: exactExampleMatch.chinese,
        pinyin: exactExampleMatch.pinyin,
        vietnamese: exactExampleMatch.vietnamese,
      });
      seen.add(exactExampleMatch.chinese);
    }

    wordResults.forEach((word) => {
      if (word.examples) {
        word.examples.forEach((ex) => {
          if (
            (ex.chinese.includes(searchQuery) || ex.vietnamese.includes(searchQuery)) &&
            !seen.has(ex.chinese)
          ) {
            seen.add(ex.chinese);
            collected.push(ex);
          }
        });
      }
    });

    return collected;
  };

  const matchingExamples = getMatchingExamples();

  // TTS browser fallback
  const speakChinese = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-16 bg-surface-alt h-full">
      <div className="max-w-[1280px] mx-auto">

        {/* Search Bar Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-6">Tra Từ Điển & Luyện Tập</h1>
          <SearchBar onSelectWord={(word) => handleSearch(word.word)} onSearch={handleSearch} />
        </div>

        {/* Tab Selection */}
        {searchQuery && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${activeTab === 'vocabulary'
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-surface text-secondary border-outline hover:border-primary/50'
                }`}
            >
              Từ vựng
            </button>
            <button
              onClick={() => setActiveTab('hanzi')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${activeTab === 'hanzi'
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-surface text-secondary border-outline hover:border-primary/50'
                }`}
            >
              Hán tự
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${activeTab === 'examples'
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-surface text-secondary border-outline hover:border-primary/50'
                }`}
            >
              Ví dụ
            </button>
          </div>
        )}

        {/* Tab Content Panels */}
        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
            <div className="w-20 h-20 bg-hover-bg rounded-full flex items-center justify-center mb-4 border border-outline">
              <span className="material-symbols-outlined text-4xl opacity-50">search</span>
            </div>
            <p className="text-xl font-medium">Hãy tìm kiếm một từ vựng để bắt đầu</p>
          </div>
        ) : isLoading || isTranslating ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px]">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-secondary font-medium">
              {isTranslating ? 'Đang kích hoạt dịch thuật AI...' : 'Đang tra cứu dữ liệu...'}
            </p>
          </div>
        ) : activeTab === 'vocabulary' ? (
          // ── VOCABULARY TAB ──────────────────────────────────────────────────────────
          wordResults.length > 0 ? (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 h-full relative">
                  <WordCard word={selectedWord} onPracticeClick={handleScrollToPractice} onCharClick={handleSearch} />
                </div>
                <div ref={practiceSectionRef} className="lg:col-span-7 h-full">
                  <PracticeHub word={selectedWord} />
                </div>
              </div>
            </div>
          ) : exactExampleMatch || translationResult ? (
            // Sentence / Translation Card View
            (() => {
              const sentenceText = exactExampleMatch ? exactExampleMatch.chinese : searchQuery;
              const sentenceWord: ZhWord = {
                id: '0',
                word: sentenceText,
                traditional: '',
                pinyin: exactExampleMatch ? exactExampleMatch.pinyin : '',
                toneless_pinyin: '',
                han_viet: hanVietSentence,
                translation_vi: exactExampleMatch ? exactExampleMatch.vietnamese : (translationResult?.text || ''),
                translation_en: '',
                part_of_speech: ['sentence'],
                hsk_level: '',
                radical: [],
                stroke_number: [],
                components: [],
                synonyms: [],
                antonyms: [],
                tags: [],
                word_frequency: 0,
                popularity_rank: 9999,
                audio_url: '',
                examples: []
              };

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
                  {/* Left Column: Translation details */}
                  <div className="lg:col-span-5 h-full relative">
                    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-3xl font-bold text-red-600 leading-relaxed tracking-wide flex-1 break-words">
                          {renderClickableHanzi(sentenceText, handleSearch)}
                        </h2>
                        <div className="flex gap-3 flex-shrink-0 ml-4">
                          <button
                            onClick={() => speakChinese(sentenceText)}
                            title="Phát âm"
                            className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none"
                          >
                            <Volume2 className="w-6 h-6" />
                          </button>
                          <button
                            title="Lưu vào sổ tay"
                            className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none"
                          >
                            <Bookmark className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Bracketed Readings */}
                      <div className="text-secondary font-medium text-lg leading-relaxed flex flex-wrap gap-2 mb-6">
                        {exactExampleMatch && (
                          <span className="text-blue-600">[ {exactExampleMatch.pinyin} ]</span>
                        )}
                        {hanVietSentence && (
                          <span className="text-emerald-700">[ {hanVietSentence} ]</span>
                        )}
                      </div>

                      {/* Swap indicator */}
                      <div className="relative my-6">
                        <hr className="border-outline/50" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-outline flex items-center justify-center shadow-sm">
                          <ArrowUpDown className="w-4 h-4 text-secondary/60" />
                        </div>
                      </div>

                      {/* Translation Text */}
                      <div className="mb-6">
                        <p className="text-xl text-primary font-medium leading-relaxed">
                          {exactExampleMatch ? exactExampleMatch.vietnamese : translationResult?.text}
                        </p>
                      </div>

                      {/* Card Footer Buttons */}
                      <div className="flex justify-between items-center mt-8 pt-4 border-t border-outline/30">
                        <button className="px-4 py-2 bg-hover-bg border border-outline rounded-full text-secondary hover:text-primary transition-all text-xs font-bold shadow-sm">
                          Đóng góp bản dịch
                        </button>
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${exactExampleMatch || translationResult?.source === 'database'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                            {exactExampleMatch || translationResult?.source === 'database' ? 'Dịch hệ thống' : 'Dịch AI'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: PracticeHub */}
                  <div className="lg:col-span-7 h-full">
                    <PracticeHub word={sentenceWord} />
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
              <p className="text-lg font-medium">{translationError || `Không tìm thấy kết quả nào cho "${searchQuery}"`}</p>
            </div>
          )
        ) : activeTab === 'hanzi' ? (
          // ── HANZI TAB ──────────────────────────────────────────────────────────────
          hanziChars.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
              <p className="text-lg font-medium">Không tìm thấy chữ Hán tự nào trong từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Hanzi selector buttons */}
              <div className="flex flex-wrap gap-2 p-3 bg-surface border border-outline rounded-2xl">
                <span className="text-sm font-semibold text-secondary flex items-center mr-2">Chữ Hán:</span>
                {hanziChars.map((char, idx) => (
                  <button
                    key={`${char}-${idx}`}
                    onClick={() => setSelectedHanziChar(char)}
                    className={`w-11 h-11 rounded-xl text-lg font-bold transition-all border ${selectedHanziChar === char
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-hover-bg hover:bg-outline/20 text-secondary border-transparent'
                      }`}
                  >
                    {char}
                  </button>
                ))}
              </div>

              {/* Hanzi details panel */}
              {selectedHanziChar && (
                isLoadingHanziDetails ? (
                  <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[300px]">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (
                  (() => {
                    const charWord = hanziWords[selectedHanziChar];
                    const radicalName = charWord?.radical?.[0] ? (resolvedRadicals[charWord.radical[0]] || charWord.radical[0]) : 'Chưa rõ';
                    const popularityText = charWord
                      ? (charWord.popularity_rank && charWord.popularity_rank <= 1000
                        ? 'Rất cao'
                        : charWord.popularity_rank && charWord.popularity_rank <= 3000
                          ? 'Cao'
                          : 'Trung bình')
                      : 'Chưa rõ';

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Visual details & WordCard */}
                        <div className="lg:col-span-5 space-y-6">
                          <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm">
                            <div className="flex flex-col items-center gap-6">
                              <HanziStrokeBox char={selectedHanziChar} />

                              <div className="w-full space-y-4 text-base text-secondary font-medium pt-4 border-t border-outline/50">
                                <div className="flex items-center gap-2">
                                  <span className="text-secondary/70 font-normal">Bính âm:</span>
                                  <span className="text-primary font-bold text-xl">{charWord?.pinyin || 'Chưa rõ'}</span>
                                  <button
                                    onClick={() => speakChinese(selectedHanziChar)}
                                    className="p-1.5 rounded-full hover:bg-hover-bg text-primary transition-colors focus:outline-none"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div>
                                  <span className="text-secondary/70 font-normal">Thành phần:</span>
                                  <span className="text-primary font-semibold ml-1">
                                    {charWord?.components?.flat()?.join(', ') || 'Chưa rõ'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-secondary/70 font-normal">Lục thư:</span>
                                  <span className="text-primary font-semibold ml-1">
                                    {getEtymology(selectedHanziChar)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-secondary/70 font-normal">Bộ thủ:</span>
                                  <span className="text-primary font-bold ml-1 uppercase">{radicalName}</span>
                                </div>
                                <div>
                                  <span className="text-secondary/70 font-normal">Số nét:</span>
                                  <span className="text-primary font-bold ml-1">
                                    {charWord?.stroke_number?.[0] || 'Chưa rõ'}
                                  </span>
                                </div>
                              </div>

                              <div className="w-full pt-4 border-t border-outline/50">
                                <span className="text-secondary/70 font-normal block mb-2">Sơ đồ nét viết (Nét bút):</span>
                                <HanziStrokeSequence char={selectedHanziChar} />
                              </div>

                              <div className="w-full flex items-center gap-2 pt-2">
                                <span className="text-secondary/70 font-normal">Độ phổ biến:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${popularityText === 'Rất cao'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : popularityText === 'Cao'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                  {popularityText}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* WordCard for character details (Meaning, Hán Việt, Examples) */}
                          <WordCard word={charWord} onCharClick={handleSearch} />
                        </div>

                        {/* Right Column: PracticeHub (Pronunciation scoring) */}
                        <div className="lg:col-span-7">
                          {(() => {
                            const activePracticeWord = charWord || {
                              id: '0',
                              word: selectedHanziChar || '',
                              traditional: '',
                              pinyin: '',
                              toneless_pinyin: '',
                              han_viet: '',
                              translation_vi: '',
                              translation_en: '',
                              part_of_speech: [],
                              hsk_level: '',
                              radical: [],
                              stroke_number: [],
                              components: [],
                              synonyms: [],
                              antonyms: [],
                              tags: [],
                              word_frequency: 0,
                              popularity_rank: 9999,
                              audio_url: '',
                              examples: []
                            };
                            return <PracticeHub word={activePracticeWord} />;
                          })()}
                        </div>
                      </div>
                    );
                  })()
                )
              )}
            </div>
          )
        ) : (
          // ── EXAMPLES TAB ───────────────────────────────────────────────────────────
          matchingExamples.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
              <p className="text-lg font-medium">Không tìm thấy ví dụ nào chứa từ khóa "{searchQuery}"</p>
            </div>
          ) : (
            <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-primary pb-3 border-b border-outline/50">
                Ví dụ chứa từ khóa "{searchQuery}" ({matchingExamples.length})
              </h3>

              <div className="space-y-4">
                {matchingExamples.slice(0, visibleExamplesCount).map((ex, idx) => (
                  <div key={idx} className="p-5 bg-hover-bg rounded-2xl border border-outline/50 hover:border-primary/30 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-bold text-primary mb-2 leading-relaxed">{renderClickableHanzi(ex.chinese, handleSearch)}</p>
                        <p className="text-sm font-semibold text-secondary mb-1 font-mono">{ex.pinyin}</p>
                        <p className="text-base text-secondary">{ex.vietnamese}</p>
                      </div>
                      <button
                        onClick={() => speakChinese(ex.chinese)}
                        className="w-10 h-10 rounded-full bg-white border border-outline flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {matchingExamples.length > visibleExamplesCount && (
                <button
                  onClick={() => setVisibleExamplesCount((prev) => prev + 5)}
                  className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-hover-bg hover:bg-outline/20 text-primary border border-outline font-bold text-sm transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <span>Xem thêm</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </main>
  );
}


