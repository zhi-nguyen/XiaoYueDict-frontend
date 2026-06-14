"use client";

import React, { useRef, useState } from 'react';
import { Volume2, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { ZhWord } from '@/types/dictionary';
import AddToNotebookModal from './dictionary/AddToNotebookModal';

// Mapping from tags_vi.json
import tagsVi from '@/data/tags_vi.json';

interface WordCardProps {
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

export default function WordCard({ word, onPracticeClick, onCharClick }: WordCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAllExamples, setShowAllExamples] = useState(false);

  const posList = word?.part_of_speech
    ? word.part_of_speech
        .filter(pos => pos.trim().toLowerCase() !== 'sentence')
        .map(pos => translatePartOfSpeech(pos))
    : [];

  const displayedExamples = word?.examples
    ? (showAllExamples ? word.examples : word.examples.slice(0, 2))
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

  const playAudio = () => {
    if (word.audio_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(`http://localhost${word.audio_url}`);
      }
      audioRef.current.play();
    }
  };

  return (
    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 sticky top-6 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">

      {/* Header Section: Only Word and Speaker/Mic buttons */}
      <div className="flex justify-between items-center mb-6">
        {/* Word (Simplified) */}
        <h1 className={`leading-none font-bold text-primary ${word.word.length <= 4 ? "text-[4rem]" : word.word.length <= 8 ? "text-[3rem]" : "text-3xl"}`}>
          {renderClickableHanzi(word.word, onCharClick)}
        </h1>

        {/* 2 nút Icon Loa và Icon Mic ở trên bên phải Card */}
        <div className="flex gap-3 flex-shrink-0 ml-4">
          <button
            type="button"
            onClick={playAudio}
            disabled={!word.audio_url}
            title="Phát audio"
            className="text-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors flex-shrink-0 focus:outline-none"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={onPracticeClick}
            disabled={!onPracticeClick}
            title="Phát âm thử"
            className="text-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors flex-shrink-0 focus:outline-none"
          >
            <Mic className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Details list below the header, spanning full width */}
      <div className="space-y-3 mb-6">
        {/* Từ Hán (Phồn thể) */}
        {word.traditional && word.traditional !== word.word && (
          <p className="text-lg text-secondary font-medium">
            Từ Hán (Phồn thể): <span className="text-primary font-semibold text-xl">{renderClickableHanzi(word.traditional, onCharClick)}</span>
          </p>
        )}

        {/* Pinyin */}
        <p className="text-2xl text-secondary font-semibold">{word.pinyin}</p>

        {/* Hán Việt (nếu có) */}
        {word.han_viet && (
          <div className="flex items-center gap-2">
            <span className="text-base text-secondary font-medium">Hán Việt:</span>
            <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-secondary/10 text-secondary uppercase tracking-wider">
              {word.han_viet}
            </span>
          </div>
        )}

        {/* Từ loại (dịch sang tiếng Việt) */}
        {posList.length > 0 && (
          <p className="text-base text-secondary font-medium">
            Từ loại: <span className="text-primary font-semibold">{posList.join(', ')}</span>
          </p>
        )}

        {/* Level & Tags (xếp cùng hàng) */}
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

        {/* Nút thêm vào sổ tay (cuối cùng) */}
        {word.word.length <= 14 && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600/30 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">bookmark_add</span>
            Thêm vào sổ tay từ vựng
          </button>
        )}
      </div>

      <hr className="border-outline/50 mb-8" />

      {/* Translation Section */}
      <div className="mb-8">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-3">
          Nghĩa Tiếng Việt
        </h2>
        <p className="text-2xl text-primary font-semibold leading-relaxed">
          {word.translation_vi ? word.translation_vi.toUpperCase() : ''}
        </p>
        {word.popularity_rank !== undefined && word.popularity_rank !== null && (
          <p className="text-sm font-semibold text-secondary/60 mt-2">
            #Độ phổ biến: {word.popularity_rank}
          </p>
        )}
      </div>

      {/* Examples Section */}
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
                    <p className="text-xl font-medium text-primary mb-2 leading-relaxed">{renderClickableHanzi(example.chinese, onCharClick)}</p>
                    <p className="text-sm font-medium text-secondary mb-1">{example.pinyin}</p>
                    <p className="text-base text-secondary">{example.vietnamese}</p>
                  </div>
                  {example.audio_url && (
                    <button className="w-10 h-10 rounded-full bg-white border border-outline flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {word.examples.length > 2 && (
            <button
              onClick={() => setShowAllExamples(!showAllExamples)}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-hover-bg hover:bg-outline/20 text-primary border border-outline font-bold text-sm transition-all flex items-center justify-center gap-1.5 focus:outline-none"
            >
              {showAllExamples ? (
                <>
                  <span>Thu gọn ví dụ</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Xem thêm ({word.examples.length - 2} ví dụ)</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Add To Notebook Modal */}
      <AddToNotebookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        word={word}
      />
    </div>
  );
}
