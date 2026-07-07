"use client";

import React, { useRef, useState } from 'react';
import { Mic, ChevronDown, Flag } from 'lucide-react';
import SpeakerIcon from '@/components/dictionary/SpeakerIcon';
import { ZhWord } from '@/types/dictionary';
import AddToNotebookModal from './dictionary/AddToNotebookModal';
import AuthModal from '@/components/auth/AuthModal';
import { speakChinese, playTTSWithClientCache } from '@/lib/zhUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getGuestId } from '@/lib/guest';
import VocabularyImage from './dictionary/VocabularyImage';
import ReportModal from '@/components/ReportModal';

// Mapping from tags_vi.json
import tagsVi from '@/data/tags_vi.json';

interface WordCardZhProps {
  word: ZhWord | null;
  onPracticeClick?: () => void;
  onCharClick?: (char: string) => void;
}

const translatePartOfSpeech = (pos: string): string => {
  const mapping: Record<string, string> = {
    noun: 'Danh từ',
    verb: 'Động từ',
    adjective: 'Tính từ',
    adverb: 'Phó từ',
    pronoun: 'Đại từ',
    number: 'Số từ',
    numeral: 'Số từ',
    classifier: 'Lượng từ',
    preposition: 'Giới từ',
    conjunction: 'Liên từ',
    particle: 'Trợ từ',
    auxiliary: 'Trợ động từ',
    interjection: 'Thán từ',
    onomatopoeia: 'Từ tượng thanh',
    suffix: 'Hậu tố',
    prefix: 'Tiền tố',
    idiom: 'Thành ngữ',
    phrase: 'Cụm từ',
    sentence: 'Câu',
    punctuation: 'Dấu câu',
  };
  const normalized = pos.trim().toLowerCase();
  return mapping[normalized] || pos;
};

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

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  const trimmed = str.trim();
  if (!trimmed) return str;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const TranslationVi = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const parts = text.split(';').map(part => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return (
      <span className="block space-y-1 text-left">
        {parts.map((part, idx) => (
          <span key={idx} className="block">
            {capitalizeFirstLetter(part)}
          </span>
        ))}
      </span>
    );
  }

  const displayedParts = isExpanded ? parts : [parts[0]];

  return (
    <div className="flex flex-col items-start w-full text-left">
      <span className="block space-y-1 w-full">
        {displayedParts.map((part, idx) => (
          <span key={idx} className="block">
            - {capitalizeFirstLetter(part)}
          </span>
        ))}
      </span>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-emerald-600 hover:text-emerald-700 font-bold text-xs mt-2.5 flex items-center gap-1 transition-colors focus:outline-none"
      >
        <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
        <span className="material-symbols-outlined text-[16px] font-bold">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>
    </div>
  );
};

export default function WordCardZh({ word, onPracticeClick, onCharClick }: WordCardZhProps) {
  const { isAuthenticated } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visibleExamplesCount, setVisibleExamplesCount] = useState(5);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportType, setActiveReportType] = useState<'image' | 'translation' | 'pinyin' | 'example' | 'exam_question' | 'audio' | 'other'>('other');

  const handleOpenReport = (type: typeof activeReportType) => {
    setActiveReportType(type);
    setIsReportModalOpen(true);
  };

  React.useEffect(() => {
    setVisibleExamplesCount(5);
  }, [word]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<'idle' | 'generating' | 'regenerating' | 'ready' | 'failed' | 'collecting'>('idle');

  const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  const fetchImageStatus = React.useCallback(async () => {
    if (!word || !word.id || !isUUID(word.id)) return;
    try {
      const guestId = !isAuthenticated ? getGuestId() : null;
      const res = await djangoClient.get(`/media/image/zh/${word.id}/`, {
        params: guestId ? { guest_id: guestId } : undefined
      });
      
      if (res.data.status === 'ready' && res.data.image_url) {
        setImageUrl(res.data.image_url);
        setImageStatus('ready');
      } else if (res.data.status === 'collecting' || res.data.status === 'COLLECTING') {
        setImageStatus('collecting');
      } else if (res.data.status === 'REGENERATING') {
        setImageStatus('regenerating');
      } else {
        setImageStatus('generating');
      }
    } catch (err) {
      console.error('Failed to fetch image status:', err);
      setImageStatus('failed');
    }
  }, [word?.id, isAuthenticated]);

  React.useEffect(() => {
    if (!word || !word.id || !isUUID(word.id)) {
      setImageUrl(null);
      setImageStatus('idle');
      return;
    }

    setImageUrl(null);
    setImageStatus('generating');
    fetchImageStatus();
  }, [word?.id, isAuthenticated, fetchImageStatus]);

  useWebSocket({
    onMessage: (msg) => {
      if (word && msg.payload?.word_id === word.id) {
        if (msg.type === 'image_complete') {
          if (msg.payload.status === 'collecting') {
            setImageStatus('collecting');
          } else {
            setImageUrl(msg.payload.image_url as string);
            setImageStatus('ready');
          }
        } else if (msg.type === 'image_failed') {
          setImageStatus('failed');
        }
      }
    }
  });

  const handleRetryFetchImage = () => {
    setImageUrl(null);
    setImageStatus('generating');
    fetchImageStatus();
  };

  const isBridged = imageUrl ? imageUrl.includes('/images/en/') : false;

  const posList = word?.part_of_speech
    ? word.part_of_speech
      .filter(pos => pos.trim().toLowerCase() !== 'sentence')
      .map(pos => translatePartOfSpeech(pos))
    : [];

  const displayedExamples = word?.examples
    ? word.examples.slice(0, visibleExamplesCount)
    : [];

  if (!word) {
    return (
      <div className="bg-surface border border-outline rounded-[1.5rem] p-8 h-full flex flex-col items-center justify-center text-secondary min-h-[500px]">
        <div className="w-20 h-20 bg-hover-bg rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl opacity-50">search</span>
        </div>
        <p className="text-xl font-medium">Hãy tìm kiếm một từ vựng để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 sticky top-6 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`leading-none font-bold text-primary ${word.word.length <= 4 ? "text-[4rem]" : word.word.length <= 8 ? "text-[3rem]" : "text-3xl"}`}>
          {renderClickableHanzi(word.word, onCharClick)}
        </h1>

        <div className="flex gap-3 flex-shrink-0 ml-4">
          <SpeakerIcon text={word.word} lang="zh" size={24} />
          <button
            type="button"
            onClick={onPracticeClick}
            disabled={!onPracticeClick}
            title="Phát âm thử"
            className="text-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors flex-shrink-0 focus:outline-none"
          >
            <Mic className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenReport('translation')}
            title="Báo cáo lỗi từ vựng"
            className="text-secondary hover:text-red-600 transition-colors flex-shrink-0 focus:outline-none"
          >
            <Flag className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {word.traditional && word.traditional !== word.word && (
          <p className="text-lg text-secondary font-medium">
            Từ Hán (Phồn thể): <span className="text-primary font-semibold text-xl">{renderClickableHanzi(word.traditional, onCharClick)}</span>
          </p>
        )}

        <p className="text-2xl text-secondary font-semibold">{word.pinyin}</p>

        {word.han_viet && (
          <div className="flex items-center gap-2">
            <span className="text-base text-secondary font-medium">Hán Việt:</span>
            <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-secondary/10 text-secondary uppercase tracking-wider">
              {word.han_viet.toUpperCase()}
            </span>
          </div>
        )}

        {posList.length > 0 && (
          <p className="text-base text-secondary font-medium">
            Từ loại: <span className="text-primary font-semibold">{posList.join(', ')}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {word.hsk_level && (
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm">
              HSK {word.hsk_level}
            </span>
          )}
          {word.tags.slice(0, 5).map((tag, idx) => {
            const viTag = (tagsVi as Record<string, string>)[tag] || tag;
            return (
              <span key={idx} className="px-3 py-1 rounded-full bg-hover-bg border border-outline text-secondary font-medium text-sm">
                {viTag}
              </span>
            );
          })}
        </div>

        {word.word.length <= 14 && (
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                setIsAddModalOpen(true);
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600/30 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">bookmark_add</span>
            Thêm vào sổ tay từ vựng
          </button>
        )}
      </div>

      <hr className="border-outline/50 mb-8" />

      <div className="mb-8">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-3">
          Nghĩa Tiếng Việt
        </h2>
        <div className="text-xl text-primary font-semibold leading-relaxed">
          <TranslationVi text={word.translation_vi} />
        </div>
        {word.popularity_rank !== undefined && word.popularity_rank !== null && (
          <p className="text-sm font-semibold text-secondary/60 mt-2">
            #Độ phổ biến: {word.popularity_rank}
          </p>
        )}
      </div>

      {word && word.id && isUUID(word.id) && imageStatus !== 'idle' && (
        <div className="mb-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-3">
            Hình ảnh minh họa
          </h2>
          {imageStatus === 'generating' || imageStatus === 'regenerating' ? (
            <div className="relative w-full h-[200px] rounded-2xl bg-hover-bg border border-outline flex flex-col items-center justify-center overflow-hidden shadow-inner text-secondary select-none animate-pulse">
              <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-primary/50">autorenew</span>
              <span className="text-sm font-semibold">
                {imageStatus === 'regenerating' ? 'Đang tạo lại hình ảnh...' : 'Đang thiết kế hình ảnh...'}
              </span>
              <span className="text-xs text-secondary/60 mt-1">AI đang vẽ minh họa cho từ vựng này. Hãy đợi một chút...</span>
            </div>
          ) : imageStatus === 'collecting' ? (
            <div className="relative w-full h-[200px] rounded-2xl bg-hover-bg border border-outline flex flex-col items-center justify-center overflow-hidden shadow-inner text-secondary select-none text-center p-6">
              <span className="material-symbols-outlined text-3xl mb-2 text-secondary/40">photo_library</span>
              <span className="text-sm font-semibold">Ảnh đang trong quá trình thu thập</span>
              <span className="text-xs text-secondary/60 mt-1">Hình ảnh minh họa cho từ vựng này đang được cập nhật.</span>
            </div>
          ) : imageStatus === 'failed' ? (
            <div className="relative w-full h-[200px] rounded-2xl bg-hover-bg border border-outline flex flex-col items-center justify-center overflow-hidden shadow-inner text-secondary select-none text-center p-6 space-y-3">
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-1 text-secondary/40">image_not_supported</span>
                <span className="text-sm font-semibold text-secondary/60">Không tải được hình ảnh minh họa</span>
              </div>
              <button
                type="button"
                onClick={handleRetryFetchImage}
                className="mx-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-primary bg-surface border border-outline hover:border-primary/50 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span className="material-symbols-outlined text-sm">autorenew</span>
                <span>Thử tải lại</span>
              </button>
            </div>
          ) : imageUrl ? (
            <div className="space-y-3">
              <VocabularyImage 
                src={imageUrl} 
                alt={`Minh họa cho ${word.word}`}
                isBridged={isBridged}
                onReport={() => handleOpenReport('image')}
                isReporting={(imageStatus as string) === 'regenerating'}
              />
              {isBridged && (
                <p className="text-xs text-center text-secondary/60 italic max-w-[320px] mx-auto leading-relaxed">
                  * Hình ảnh này được chia sẻ liên kết giữa Tiếng Trung và Tiếng Anh để tối ưu hóa học tập.
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {word.examples && word.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-4">
            Ví dụ sử dụng
          </h2>

          <div className="space-y-3">
            {displayedExamples.map((example) => (
              <div key={example.id} className="p-5 bg-hover-bg rounded-2xl border border-outline/50 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-medium text-primary mb-2 leading-relaxed">{example.chinese}</p>
                    <p className="text-sm font-medium text-secondary mb-1">{example.pinyin}</p>
                    <p className="text-base text-secondary">{example.vietnamese}</p>
                  </div>
                  <SpeakerIcon
                    audioUrl={example.audio_url ? `http://localhost${example.audio_url}` : undefined}
                    text={example.chinese}
                    lang="zh"
                    size={24}
                    className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none mt-1"
                  />
                </div>
              </div>
            ))}
          </div>

          {word.examples.length > visibleExamplesCount && (
            <button
              type="button"
              onClick={() => setVisibleExamplesCount((prev) => prev + 5)}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-hover-bg hover:bg-outline/20 text-primary border border-outline font-bold text-sm transition-all flex items-center justify-center gap-1.5 focus:outline-none"
            >
              <span>Xem thêm</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <AddToNotebookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        word={word}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        contentType="zh_word"
        objectId={word.id}
        defaultReportType={activeReportType}
      />
    </div>
  );
}
