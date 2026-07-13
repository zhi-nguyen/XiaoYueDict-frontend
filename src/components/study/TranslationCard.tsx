'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Bookmark, ArrowUpDown, Flag } from 'lucide-react';
import SpeakerIcon from '@/components/dictionary/SpeakerIcon';
import { renderClickableHanzi } from '@/lib/zhUtils';
import ReportModal from '@/components/ReportModal';
import AddToNotebookModal from '@/components/dictionary/AddToNotebookModal';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthStore } from '@/store/useAuthStore';

interface TranslationCardProps {
  sentenceText: string;
  pinyin?: string;
  translationVi: string;
  translationSource: 'database' | 'ai_translation' | string;
  isExactMatch: boolean;
  onSearch: (query: string) => void;
  sentenceId?: string;
}

/**
 * Displays a sentence/translation result card with:
 * - Clickable hanzi characters
 * - Pinyin reading
 * - Vietnamese translation
 * - Source badge (system vs AI)
 */
export default function TranslationCard({
  sentenceText,
  pinyin,
  translationVi,
  translationSource,
  isExactMatch,
  onSearch,
  sentenceId,
}: TranslationCardProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const params = useParams();
  const lang = (params?.lang as 'zh' | 'en') === 'en' ? 'en' : 'zh';
  const isSystemTranslation = isExactMatch || translationSource === 'database';

  // Helper to detect Vietnamese diacritics
  const hasVietnamese = (str: string) => {
    const viPattern = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỔỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỸĐ]/;
    return viPattern.test(str);
  };

  // Helper to detect Chinese characters
  const hasChinese = (str: string) => {
    return /[\u4e00-\u9fa5]/.test(str);
  };

  // Check eligibility for adding to notebook (<= 14 chars/words)
  const isEligibleForNotebook = (() => {
    if (lang === 'zh') {
      const chineseText = hasChinese(sentenceText) ? sentenceText : translationVi;
      return chineseText.length <= 14;
    } else {
      const englishText = !hasVietnamese(sentenceText) ? sentenceText : translationVi;
      const wordCount = englishText.split(/\s+/).filter(Boolean).length;
      return wordCount <= 14;
    }
  })();

  // Construct notebook word object dynamically based on source/target
  const notebookWordData = (() => {
    if (lang === 'zh') {
      if (hasChinese(sentenceText)) {
        return {
          word: sentenceText,
          pinyin: pinyin || '',
          translation_vi: translationVi
        };
      } else {
        return {
          word: translationVi,
          pinyin: pinyin || '',
          translation_vi: sentenceText
        };
      }
    } else {
      if (!hasVietnamese(sentenceText)) {
        return {
          word: sentenceText,
          translation_vi: translationVi
        };
      } else {
        return {
          word: translationVi,
          translation_vi: sentenceText
        };
      }
    }
  })();

  // Determine if sentenceText is target language
  const isSentenceTarget = lang === 'en' ? !hasVietnamese(sentenceText) : hasChinese(sentenceText);
  // Determine if translationVi is target language
  const isTranslationTarget = lang === 'en' ? !hasVietnamese(translationVi) : hasChinese(translationVi);

  return (
    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-3xl font-bold text-red-600 leading-relaxed tracking-wide flex-1 break-words">
          {renderClickableHanzi(sentenceText, isExactMatch ? undefined : onSearch)}
        </h2>
        <div className="flex gap-3 flex-shrink-0 ml-4">
          {isSentenceTarget && (
            <SpeakerIcon text={sentenceText} lang={lang} size={24} />
          )}
          {isEligibleForNotebook && (
            <button
              onClick={() => {
                if (isAuthenticated) {
                  setIsNotebookModalOpen(true);
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              title="Lưu vào sổ tay"
              className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none"
            >
              <Bookmark className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Bracketed Readings */}
      <div className="text-secondary font-medium text-lg leading-relaxed flex flex-wrap gap-2 mb-6">
        {pinyin && (
          <span className="text-blue-600">[ {pinyin} ]</span>
        )}
      </div>

      {/* Swap indicator */}
      <div className="relative my-6">
        <hr className="border-outline/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-outline flex items-center justify-center shadow-sm">
          <ArrowUpDown className="w-4 h-4 text-secondary/60" />
        </div>
      </div>

      {/* Translation Text */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <p className="text-xl text-primary font-medium leading-relaxed flex-1">
          {translationVi}
        </p>
        {isTranslationTarget && (
          <SpeakerIcon
            text={translationVi}
            lang={lang}
            size={24}
            className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none mt-1"
          />
        )}
      </div>

      {/* Card Footer Buttons */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-outline/30">
        {sentenceId ? (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 bg-hover-bg border border-outline rounded-full text-secondary hover:text-primary hover:border-primary/50 transition-all text-xs font-bold shadow-sm flex items-center gap-1.5 focus:outline-none"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Báo cáo dịch sai / Đóng góp</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {(isExactMatch || translationSource === 'database') ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Dịch hệ thống
            </span>
          ) : translationSource === 'ai_translation' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              AI Gen
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <span className="material-symbols-outlined text-[14px]">g_translate</span>
              Google Translate
            </span>
          )}
        </div>
      </div>

      {sentenceId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          contentType={lang === 'en' ? 'en_example' : 'zh_example'}
          objectId={sentenceId}
          defaultReportType="translation"
          title="Báo cáo lỗi bản dịch"
        />
      )}

      {isEligibleForNotebook && (
        <AddToNotebookModal
          isOpen={isNotebookModalOpen}
          onClose={() => setIsNotebookModalOpen(false)}
          word={notebookWordData}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
