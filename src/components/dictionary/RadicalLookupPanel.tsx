'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { RADICALS_BY_STROKE, RADICAL_VARIANTS, Radical } from '@/data/radicalData';
import { djangoClient } from '@/lib/apiClient';

interface RadicalLookupPanelProps {
  onSelectChar: (char: string) => void;
  onClose: () => void;
}

interface CharacterResult {
  id: string;
  word: string;
  pinyin: string;
  han_viet: string;
  translation_vi: string;
  popularity_rank: number;
}

export default function RadicalLookupPanel({ onSelectChar, onClose }: RadicalLookupPanelProps) {
  const [selectedStroke, setSelectedStroke] = useState<number>(4); // Mặc định chọn 4 nét
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null);
  const [characters, setCharacters] = useState<CharacterResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -160, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  // Cuộn màn hình đến phần danh sách kết quả khi dữ liệu tải xong
  useEffect(() => {
    if (selectedRadical && !isLoading && characters.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [characters, isLoading, selectedRadical]);

  // Lấy các bộ thủ ứng với số nét đã chọn
  const currentRadicals = RADICALS_BY_STROKE[selectedStroke] || [];

  // Gọi API tìm chữ Hán khi chọn bộ thủ
  useEffect(() => {
    if (!selectedRadical) {
      setCharacters([]);
      return;
    }

    const fetchCharacters = async () => {
      setIsLoading(true);
      try {
        const res = await djangoClient.get(
          `/dictionary/zh/radical-search/?radical=${encodeURIComponent(selectedRadical.radical)}`
        );
        setCharacters(res.data.results || []);
      } catch (err) {
        console.error('Error fetching characters by radical:', err);
        setCharacters([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, [selectedRadical]);

  const handleStrokeChange = (stroke: number) => {
    setSelectedStroke(stroke);
    setSelectedRadical(null);
    setCharacters([]);
  };

  const getRadicalDisplayName = (rad: Radical) => {
    return RADICAL_VARIANTS[rad.radical] || rad.hanViet;
  };

  return (
    <div className="w-full bg-white border border-outline rounded-[1.5rem] p-5 shadow-lg animate-in slide-in-from-top-4 duration-300 z-20">
      {/* CSS to hide scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline/40">
        <h4 className="font-bold text-slate-800 text-lg">Tra cứu bộ thủ</h4>
        <button
          onClick={onClose}
          className="text-secondary/70 hover:text-primary transition-colors text-xs font-bold px-3 py-1.5 rounded-full hover:bg-hover-bg border border-outline/40 cursor-pointer"
        >
          Đóng
        </button>
      </div>

      {/* Label */}
      <div className="text-sm font-semibold text-slate-700 mb-2">Theo số nét:</div>

      {/* Stroke Selector Scrollable Row */}
      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden mb-6 bg-white shadow-sm w-full">
        {/* Left scroll button */}
        <button
          type="button"
          onClick={scrollLeft}
          className="px-3.5 py-2 border-r border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 select-none font-bold text-xs shrink-0 bg-slate-50/50 cursor-pointer focus:outline-none transition-colors"
          title="Cuộn sang trái"
        >
          &lt;
        </button>

        {/* Scrollable area containing all valid values (excluding 15 and 16) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 flex gap-2.5 py-1.5 px-3 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17].map((stroke) => (
            <button
              key={stroke}
              onClick={() => handleStrokeChange(stroke)}
              className={`w-9 h-9 rounded-full font-bold text-sm transition-all flex items-center justify-center shrink-0 focus:outline-none cursor-pointer
                ${selectedStroke === stroke
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100/70 hover:bg-slate-200/80 text-slate-600'
                }`}
            >
              {stroke}
            </button>
          ))}
        </div>

        {/* Right scroll button */}
        <button
          type="button"
          onClick={scrollRight}
          className="px-3.5 py-2 border-l border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:bg-slate-100 select-none font-bold text-xs shrink-0 bg-slate-50/50 cursor-pointer focus:outline-none transition-colors"
          title="Cuộn sang phải"
        >
          &gt;
        </button>
      </div>

      {/* Radicals Grid (5 columns on mobile, full width 12 columns on PC) */}
      <div className="mb-6 w-full">
        <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-12 gap-2.5 w-full">
          {currentRadicals.map((rad) => (
            <button
              key={rad.id}
              onClick={() => setSelectedRadical(rad)}
              className={`aspect-square flex items-center justify-center rounded-xl text-xl transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer
                ${selectedRadical?.id === rad.id
                  ? 'bg-slate-800 text-white font-bold shadow-md'
                  : 'bg-slate-100/60 hover:bg-slate-200/70 text-slate-700'
                }`}
              title={`${rad.radical} (${rad.hanViet.toUpperCase()}): ${rad.english}`}
            >
              {rad.radical}
            </button>
          ))}
        </div>
      </div>

      {/* Search results */}
      {selectedRadical && (
        <div ref={resultsRef} className="border-t border-outline/40 pt-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-secondary uppercase tracking-wide">
              Chữ Hán chứa bộ "{selectedRadical.radical}" ({getRadicalDisplayName(selectedRadical)}):
            </div>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary/60" />}
          </div>

          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-secondary/60">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50 mb-2" />
              <span className="text-xs font-medium">Đang tìm kiếm chữ Hán...</span>
            </div>
          ) : characters.length === 0 ? (
            <div className="p-6 text-center text-secondary/60 text-sm border border-dashed border-outline/50 rounded-2xl">
              Không tìm thấy chữ Hán nào chứa bộ thủ này trong cơ sở dữ liệu.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-[250px] overflow-y-auto p-1">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => onSelectChar(char.word)}
                  className="flex flex-col items-start p-2.5 bg-surface hover:bg-hover-bg border border-outline/60 hover:border-primary/50 rounded-2xl text-left transition-all hover:shadow-sm focus:outline-none cursor-pointer group"
                >
                  <div className="flex justify-between items-baseline w-full">
                    <span className="text-xl font-bold text-primary group-hover:text-primary-hover">{char.word}</span>
                    <span className="text-[10px] font-semibold text-secondary/70 font-mono">{char.pinyin}</span>
                  </div>
                  <div className="text-[11px] text-secondary font-medium mt-1 truncate w-full">
                    {char.han_viet && <span className="uppercase text-[9px] mr-1 text-primary/70">{char.han_viet}</span>}
                    {char.translation_vi}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
