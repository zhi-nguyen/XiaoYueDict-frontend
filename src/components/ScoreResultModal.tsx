'use client';

import React from 'react';
import ScoreDisplay from './ScoreDisplay';

interface ScoreResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    task_id: string;
    score: number;
    language: string;
    target_text?: string;
    result_data: any;
  } | null;
}

export default function ScoreResultModal({ isOpen, onClose, data }: ScoreResultModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-outline/50 pb-3 shrink-0">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">insights</span>
            Kết Quả Phát Âm
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1 scrollbar-thin">
          {data.target_text && (
            <div className="bg-hover-bg rounded-xl p-4 border border-outline/50">
              <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">Văn bản mẫu</span>
              <p className="text-primary font-medium text-lg leading-relaxed">{data.target_text}</p>
              <span className="text-[10px] text-secondary mt-1 block">Ngôn ngữ: {data.language === 'zh' ? 'Tiếng Trung (Mandarin)' : 'Tiếng Anh'}</span>
            </div>
          )}

          <ScoreDisplay result={data.result_data} overallScore={data.score} />
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-outline/50 mt-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors text-sm shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
