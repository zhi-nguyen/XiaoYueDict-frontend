import React from 'react';

interface FlashCardCompletionProps {
  word: string;
  onReset: () => void;
  onMastered: () => void;
  isSaving: boolean;
}

export default function FlashCardCompletion({
  word,
  onReset,
  onMastered,
  isSaving,
}: FlashCardCompletionProps) {
  return (
    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-emerald-600 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          workspace_premium
        </span>
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1d2b3e] mb-2 font-headline-lg">
        Hoàn thành xuất sắc!
      </h2>
      <p className="text-sm sm:text-base text-secondary mb-8">
        Bạn đã học từ "{word}" qua cả 4 kỹ năng Nghe - Nói - Đọc - Viết.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
        <button
          onClick={onReset}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl border border-outline text-secondary hover:bg-hover-bg transition-colors font-semibold text-sm"
        >
          Học lại từ đầu
        </button>
        <button
          onClick={onMastered}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors font-bold text-sm shadow-md flex items-center justify-center gap-2"
        >
          {isSaving && (
            <span className="material-symbols-outlined animate-spin text-sm">
              progress_activity
            </span>
          )}
          Đã học xong
        </button>
      </div>
    </div>
  );
}
