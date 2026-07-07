"use client";

import React, { useState } from 'react';
import { Mic, Flag } from 'lucide-react';
import SpeakerIcon from '@/components/dictionary/SpeakerIcon';
import AddToNotebookModal from './dictionary/AddToNotebookModal';
import AuthModal from '@/components/auth/AuthModal';
import { speakBrowserFallback } from '@/lib/zhUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { djangoClient } from '@/lib/apiClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getGuestId } from '@/lib/guest';
import VocabularyImage from './dictionary/VocabularyImage';
import ReportModal from '@/components/ReportModal';

export interface EnExample {
  english: string;
  vietnamese: string;
  audio_url?: string;
}

export interface EnDefinition {
  part_of_speech: string;
  translation_vi: string;
  examples: EnExample[];
}

export interface EnWord {
  id: string;
  word: string;
  ipa?: string;
  translation_vi: string;
  part_of_speech: string[];
  cefr_level?: string;
  audio_url?: string;
  image_url?: string;
  definitions: EnDefinition[];
  examples?: EnExample[];
}

interface WordCardEnProps {
  word: EnWord | null;
  onPracticeClick?: () => void;
}

const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

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
    'modal auxiliary': 'Trợ động từ khuyết thiếu',
  };
  const normalized = pos.trim().toLowerCase();
  const res = mapping[normalized] || pos;
  return capitalizeWords(res);
};

const TranslationVi = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const parts = text.split(';').map(part => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return (
      <span className="block space-y-1">
        {parts.map((part, idx) => (
          <span key={idx} className="block text-left">
            - {part}
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
            - {part}
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

export default function WordCardEn({ word, onPracticeClick }: WordCardEnProps) {
  const { isAuthenticated } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<'idle' | 'generating' | 'regenerating' | 'ready' | 'failed' | 'collecting'>('idle');
  const [activeDefIdx, setActiveDefIdx] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReportType, setActiveReportType] = useState<'image' | 'translation' | 'pinyin' | 'example' | 'exam_question' | 'audio' | 'other'>('other');

  const handleOpenReport = (type: typeof activeReportType) => {
    setActiveReportType(type);
    setIsReportModalOpen(true);
  };

  React.useEffect(() => {
    setActiveDefIdx(0);
  }, [word?.id]);

  const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  const fetchImageStatus = React.useCallback(async () => {
    if (!word || !word.id || !isUUID(word.id)) return;
    try {
      const guestId = !isAuthenticated ? getGuestId() : null;
      const res = await djangoClient.get(`/media/image/en/${word.id}/`, {
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

  const isBridged = imageUrl ? imageUrl.includes('/images/zh/') : false;

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

  const posList = word.part_of_speech
    ? word.part_of_speech
      .filter(pos => pos.trim().toLowerCase() !== 'sentence')
      .map(pos => translatePartOfSpeech(pos))
    : [];

  return (
    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 sticky top-6 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`leading-none font-bold text-primary ${word.word.length <= 4 ? "text-[4rem]" : word.word.length <= 8 ? "text-[3rem]" : "text-3xl"}`}>
          {capitalizeWords(word.word)}
        </h1>

        <div className="flex gap-3 flex-shrink-0 ml-4">
          <SpeakerIcon text={word.word} lang="en" size={24} />
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
        {word.ipa && (
          <p className="text-2xl text-secondary font-semibold font-mono">{word.ipa}</p>
        )}

        {posList.length > 0 && (
          <p className="text-base text-secondary font-medium">
            Từ loại: <span className="text-primary font-semibold">{posList.join(', ')}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {word.cefr_level && word.cefr_level !== '0' && (
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm">
              {word.cefr_level}
            </span>
          )}
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

      {/* Image Illustration Section */}
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

      {/* Definitions & Examples Section */}
      {word.definitions && word.definitions.length > 0 ? (
        <div className="space-y-6 mb-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary">
            Định nghĩa & Ví dụ
          </h2>

          {/* Definition Tabs */}
          {word.definitions.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2.5 scrollbar-thin scrollbar-thumb-outline/50">
              {word.definitions.map((def, defIdx) => {
                const isSelected = activeDefIdx === defIdx;
                return (
                  <button
                    key={defIdx}
                    onClick={() => setActiveDefIdx(defIdx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all border-2 flex-shrink-0 cursor-pointer focus:outline-none
                      ${isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface text-secondary border-outline hover:border-primary/50 hover:bg-hover-bg'
                      }`}
                  >
                    <span>{translatePartOfSpeech(def.part_of_speech)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {(() => {
            const def = word.definitions[activeDefIdx] || word.definitions[0];
            if (!def) return null;
            return (
              <div className="p-6 bg-hover-bg rounded-2xl border border-outline/50 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-secondary/10 text-secondary">
                      {translatePartOfSpeech(def.part_of_speech)}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-primary leading-relaxed">
                    <TranslationVi text={def.translation_vi} />
                  </div>
                </div>

                {def.examples && def.examples.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-outline/30">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Ví dụ minh họa
                    </h4>
                    <div className="space-y-2.5">
                      {def.examples.map((ex, exIdx) => (
                        <div key={exIdx} className="p-4 bg-surface rounded-xl border border-outline/30 flex items-start justify-between gap-4 group">
                          <div>
                            <p className="text-lg font-medium text-primary mb-1 leading-relaxed">{ex.english}</p>
                            <p className="text-sm text-secondary">{ex.vietnamese}</p>
                          </div>
                          <SpeakerIcon
                            text={ex.english}
                            lang="en"
                            size={20}
                            className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* Fallback translation and flat examples if definitions list is empty */
        <>
          <div className="mb-8">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-3">
              Nghĩa Tiếng Việt
            </h2>
            <div className="text-lg font-semibold text-primary leading-relaxed">
              <TranslationVi text={word.translation_vi} />
            </div>
          </div>

          {word.examples && word.examples.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-4">
                Ví dụ sử dụng
              </h2>
              <div className="space-y-3">
                {word.examples.map((example, idx) => (
                  <div key={idx} className="p-5 bg-hover-bg rounded-2xl border border-outline/50 flex items-start justify-between gap-4 group">
                    <div>
                      <p className="text-xl font-medium text-primary mb-2 leading-relaxed">{example.english}</p>
                      <p className="text-base text-secondary">{example.vietnamese}</p>
                    </div>
                    <SpeakerIcon
                      text={example.english}
                      lang="en"
                      size={24}
                      className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddToNotebookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        word={word as any}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        contentType="en_word"
        objectId={word.id}
        defaultReportType={activeReportType}
      />
    </div>
  );
}
