'use client';

import React, { useState } from 'react';

interface MisspelledWord {
  word: string;
  index: number;
  suggestions: string[];
}

interface SpellCheckResult {
  is_valid: boolean;
  misspelled: MisspelledWord[];
}

interface SpellCheckState {
  result: SpellCheckResult | null;
  isChecking: boolean;
  error: string | null;
  reset: () => void;
}

interface TargetTextInputProps {
  language: 'zh' | 'en';
  targetText: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  spellCheck: SpellCheckState;
  isBusy: boolean;
  hasSpellErrors: boolean | null | undefined;
  onCheckText: () => void;
}

/**
 * Target text input with optional spellcheck for EN mode.
 * Displays highlighted misspelled words with suggestion tooltips.
 */
export default function TargetTextInput({
  language,
  targetText,
  onTextChange,
  spellCheck,
  isBusy,
  hasSpellErrors,
  onCheckText,
}: TargetTextInputProps) {
  const [selectedMisspelled, setSelectedMisspelled] = useState<string | null>(null);

  // Build highlighted text for display
  const renderHighlightedText = () => {
    if (!spellCheck.result?.misspelled?.length || !targetText.trim()) return null;

    const words = targetText.trim().split(/(\s+)/); // preserve whitespace
    let wordIndex = 0;

    return (
      <div className="mt-3 p-4 bg-hover-bg rounded-xl border border-outline text-sm leading-relaxed">
        <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">spellcheck</span>
          Phát hiện {spellCheck.result.misspelled.length} lỗi chính tả — Vui lòng sửa trước khi ghi âm
        </p>
        <div className="flex flex-wrap gap-0 text-primary">
          {words.map((segment, i) => {
            // whitespace-only segment
            if (/^\s+$/.test(segment)) {
              return <span key={`ws-${i}`}>{segment}</span>;
            }

            const currentWordIndex = wordIndex;
            wordIndex++;

            const isMisspelledWord = spellCheck.result!.misspelled.some(
              (m) => m.index === currentWordIndex
            );

            if (isMisspelledWord) {
              const misspelledInfo = spellCheck.result!.misspelled.find(
                (m) => m.index === currentWordIndex
              );
              const isSelected = selectedMisspelled === segment;

              return (
                <span key={`w-${i}`} className="relative inline-block">
                  <span
                    onClick={() => setSelectedMisspelled(isSelected ? null : segment)}
                    className="cursor-pointer px-0.5 py-0.5 rounded-md font-semibold transition-all
                               bg-red-100 text-red-700 decoration-wavy decoration-red-400 underline underline-offset-4
                               hover:bg-red-200 hover:text-red-800"
                  >
                    {segment}
                  </span>
                  {/* Suggestion tooltip */}
                  {isSelected && misspelledInfo && misspelledInfo.suggestions.length > 0 && (
                    <span className="absolute left-0 top-full mt-1 z-20 bg-white border border-outline rounded-lg shadow-lg p-2
                                     flex flex-wrap gap-1.5 min-w-[120px] animate-fade-in">
                      <span className="w-full text-[10px] text-secondary font-semibold uppercase tracking-wider mb-0.5">
                        Gợi ý sửa:
                      </span>
                      {misspelledInfo.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Replace the misspelled word in the text
                            const textWords = targetText.split(/(\s+)/);
                            let wIdx = 0;
                            const newParts = textWords.map((part) => {
                              if (/^\s+$/.test(part)) return part;
                              const curr = wIdx;
                              wIdx++;
                              if (curr === misspelledInfo.index) return s;
                              return part;
                            });
                            // Simulate a change event by constructing the new text
                            const syntheticEvent = {
                              target: { value: newParts.join('') }
                            } as React.ChangeEvent<HTMLTextAreaElement>;
                            onTextChange(syntheticEvent);
                            setSelectedMisspelled(null);
                            spellCheck.reset();
                          }}
                          className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold
                                     rounded-md border border-green-200 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </span>
                  )}
                </span>
              );
            }

            return (
              <span key={`w-${i}`} className="text-primary">
                {segment}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <label
          htmlFor="target-text"
          className="block text-sm font-semibold text-primary"
        >
          {language === 'en' ? 'Câu mẫu' : '目标文本'}
          <span className="font-normal text-secondary ml-2">
            (để trống = chế độ tự do)
          </span>
        </label>

        {/* Check Text button — English mode only */}
        {language === 'en' && targetText.trim() && (
          <button
            id="check-text-btn"
            type="button"
            onClick={onCheckText}
            disabled={spellCheck.isChecking || isBusy}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold
                       transition-all focus:outline-none focus:ring-2 focus:ring-offset-1
                       disabled:opacity-40 disabled:cursor-not-allowed
                       ${hasSpellErrors
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-300'
                : spellCheck.result?.is_valid
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 focus:ring-amber-300'
              }`}
          >
            {spellCheck.isChecking ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang kiểm tra…
              </>
            ) : hasSpellErrors ? (
              <>
                <span className="material-symbols-outlined text-sm">error</span>
                Có lỗi chính tả
              </>
            ) : spellCheck.result?.is_valid ? (
              <>
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Hợp lệ
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">spellcheck</span>
                Kiểm tra chính tả
              </>
            )}
          </button>
        )}
      </div>

      <textarea
        id="target-text"
        rows={3}
        value={targetText}
        onChange={onTextChange}
        disabled={isBusy}
        placeholder={
          language === 'en'
            ? 'e.g. The quick brown fox jumps over the lazy dog'
            : '例如：今天天气很好，我想出去散步。'
        }
        className={`w-full rounded-xl border px-4 py-3 text-sm text-primary
                   placeholder:text-secondary/50 focus:outline-none focus:ring-2
                   focus:border-transparent resize-none transition-shadow disabled:opacity-50
                   ${hasSpellErrors
            ? 'border-red-300 bg-red-50/30 focus:ring-red-300'
            : 'border-outline bg-hover-bg focus:ring-[var(--accent-gradient-start)]'
          }`}
      />

      {/* Spellcheck error display */}
      {spellCheck.error && (
        <p className="mt-1.5 text-xs text-red-500">
          ⚠️ Không thể kiểm tra: {spellCheck.error}
        </p>
      )}

      {/* Highlighted misspelled words */}
      {renderHighlightedText()}

      {/* Mode indicator — only show when no spell errors */}
      {!hasSpellErrors && (
        <p className="mt-1.5 text-xs text-secondary">
          {targetText.trim()
            ? `📖 Chế độ Read-Aloud — Chấm điểm GOP từng ${language === 'zh' ? 'ký tự' : 'từ'}`
            : '🎤 Chế độ tự do — Nhận diện giọng nói + điểm lưu loát'}
        </p>
      )}
    </div>
  );
}
