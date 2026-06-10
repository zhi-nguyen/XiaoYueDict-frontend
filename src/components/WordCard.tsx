"use client";

import React, { useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { ZhWord } from '@/types/dictionary';

// Mapping from tags_vi.json
import tagsVi from '@/data/tags_vi.json';

interface WordCardProps {
  word: ZhWord | null;
  onPracticeClick?: () => void;
}

export default function WordCard({ word, onPracticeClick }: WordCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className={`leading-none font-bold text-primary mb-3 flex items-baseline gap-4 ${word.word.length <= 4 ? "text-[4rem]" : word.word.length <= 8 ? "text-[3rem]" : "text-3xl"}`}>
            {word.word}
            {word.traditional && <span className="text-3xl font-medium text-secondary">({word.traditional})</span>}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-2xl text-secondary font-medium">{word.pinyin}</p>
            {word.han_viet && (
              <span className="text-sm font-medium px-2.5 py-1 rounded-md bg-secondary/10 text-secondary uppercase tracking-wider">
                {word.han_viet}
              </span>
            )}
          </div>
          {!word.part_of_speech.includes('sentence') && (
            <p className="text-base text-secondary font-medium mt-2">
              Từ loại: {word.part_of_speech.join(', ') || 'Chưa phân loại'}
            </p>
          )}
        </div>
        
        {word.audio_url && (
          <button 
            onClick={playAudio}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md flex-shrink-0 ml-4"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Semantic Tags & HSK Level */}
      <div className="flex flex-wrap gap-2 mb-8">
        {word.hsk_level && (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-bold text-sm">
            HSK {word.hsk_level}
          </span>
        )}
        {word.tags.slice(0, 5).map((tag, idx) => {
          // Translate tag if it exists in JSON
          const viTag = (tagsVi as Record<string, string>)[tag] || tag;
          return (
            <span key={idx} className="px-3 py-1 rounded-full bg-hover-bg border border-outline text-secondary font-medium text-sm">
              {viTag}
            </span>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          type="button"
          onClick={playAudio}
          disabled={!word.audio_url}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-hover-bg hover:bg-outline/50 text-primary border border-outline font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-lg">volume_up</span>
          Phát audio (Loa)
        </button>
        <button
          type="button"
          onClick={onPracticeClick}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-primary hover:opacity-90 text-white font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/30"
        >
          <span className="material-symbols-outlined text-lg">mic</span>
          Phát âm thử (Mic)
        </button>
      </div>

      <hr className="border-outline/50 mb-8" />

      {/* Translation Section */}
      <div className="mb-8">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-3">
          Nghĩa Tiếng Việt
        </h2>
        <p className="text-2xl text-primary font-semibold leading-relaxed">
          {word.translation_vi}
        </p>
      </div>

      {/* Examples Section */}
      {word.examples && word.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-secondary mb-4">
            Ví dụ sử dụng
          </h2>
          
          <div className="space-y-3">
            {word.examples.map((example) => (
              <div key={example.id} className="p-5 bg-hover-bg rounded-2xl border border-outline/50 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-medium text-primary mb-2 leading-relaxed">{example.chinese}</p>
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
        </div>
      )}
    </div>
  );
}
