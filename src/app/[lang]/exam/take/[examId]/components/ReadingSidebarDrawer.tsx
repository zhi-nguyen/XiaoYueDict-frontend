'use client';

import React, { useState } from 'react';
import { X, BookOpen, ZoomIn, ZoomOut } from 'lucide-react';
import { Section } from '@/types/exam';

interface ReadingSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: Section | null;
  partSuffix?: string;
}

export default function ReadingSidebarDrawer({
  isOpen,
  onClose,
  activeSection,
  partSuffix = '',
}: ReadingSidebarDrawerProps) {
  const [textSize, setTextSize] = useState<'text-sm' | 'text-base' | 'text-lg' | 'text-xl'>('text-base');

  if (!isOpen || !activeSection) return null;

  const getPassageText = (paragraph: any): string => {
    if (!paragraph) return '';
    if (typeof paragraph === 'string') return paragraph;
    if (typeof paragraph === 'object') {
      const title = paragraph.title || '';
      const content = paragraph.content || '';
      if (title && content) {
        return `${title}\n\n${content}`;
      }
      return content || title || '';
    }
    return '';
  };

  const passageText = getPassageText(activeSection.questions[0]?.paragraph);

  const increaseTextSize = () => {
    if (textSize === 'text-sm') setTextSize('text-base');
    else if (textSize === 'text-base') setTextSize('text-lg');
    else if (textSize === 'text-lg') setTextSize('text-xl');
  };

  const decreaseTextSize = () => {
    if (textSize === 'text-xl') setTextSize('text-lg');
    else if (textSize === 'text-lg') setTextSize('text-base');
    else if (textSize === 'text-base') setTextSize('text-sm');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-[500px] max-w-[95vw] h-full bg-white border-l border-outline p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant/80 hover:text-primary z-10 p-1 rounded-full focus:outline-none"
          title="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-lg font-bold text-primary mb-4 pr-8 flex items-center gap-2 font-lexend">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>Đoạn văn - Phần {activeSection.part_number}{partSuffix}</span>
        </h2>

        {/* Text size controls */}
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-outline/50 w-fit">
          <button
            onClick={decreaseTextSize}
            disabled={textSize === 'text-sm'}
            className="p-1 text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-secondary focus:outline-none"
            title="Giảm cỡ chữ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-secondary font-mono px-2 select-none">
            Cỡ chữ
          </span>
          <button
            onClick={increaseTextSize}
            disabled={textSize === 'text-xl'}
            className="p-1 text-secondary hover:text-primary disabled:opacity-30 disabled:hover:text-secondary focus:outline-none"
            title="Tăng cỡ chữ"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>



        {/* Scrollable Passage Content */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div
            className={`text-primary leading-relaxed text-justify font-inter space-y-6 ${textSize}`}
            style={{ textAlign: 'justify' }}
          >
            <p className="whitespace-pre-line">{passageText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
