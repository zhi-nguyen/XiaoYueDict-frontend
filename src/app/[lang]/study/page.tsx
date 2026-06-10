"use client";

import React, { useState, useRef } from 'react';
import WordCard from '@/components/WordCard';
import PracticeHub from '@/components/PracticeHub';
import SearchBar from '@/components/dictionary/SearchBar';
import { ZhWord } from '@/types/dictionary';

export default function StudyPage() {
  const [selectedWord, setSelectedWord] = useState<ZhWord | null>(null);
  const practiceSectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToPractice = () => {
    practiceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-16 bg-surface-alt h-full">
      <div className="max-w-[1280px] mx-auto">
        
        {/* Search Bar Section */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-primary mb-6">Tra Từ Điển & Luyện Tập</h1>
          <SearchBar onSelectWord={setSelectedWord} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Word Profile) : 5 cols wide */}
          <div className="lg:col-span-5 h-full relative">
            <WordCard word={selectedWord} onPracticeClick={handleScrollToPractice} />
          </div>
          
          {/* Right Column (Practice Activities) : 7 cols wide */}
          <div ref={practiceSectionRef} className="lg:col-span-7 h-full">
            <PracticeHub word={selectedWord} />
          </div>
        </div>
      </div>
    </main>
  );
}

