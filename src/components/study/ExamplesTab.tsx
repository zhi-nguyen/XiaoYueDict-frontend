'use client';

import React, { useState } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import SpeakerIcon from '@/components/dictionary/SpeakerIcon';
import { renderClickableHanzi } from '@/lib/zhUtils';
import ReportModal from '@/components/ReportModal';

interface ExamplesTabProps {
  matchingExamples: any[];
  searchQuery: string;
  visibleCount: number;
  onLoadMore: () => void;
  onSearch: (query: string) => void;
  language?: 'zh' | 'en';
}

/**
 * Examples tab panel for the Study page.
 * Displays example sentences containing the search query with pagination.
 */
export default function ExamplesTab({
  matchingExamples,
  searchQuery,
  visibleCount,
  onLoadMore,
  onSearch,
  language = 'zh',
}: ExamplesTabProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);

  const handleOpenReport = (id: string) => {
    setSelectedExampleId(id);
    setIsReportModalOpen(true);
  };

  if (matchingExamples.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
        <p className="text-lg font-medium">Không tìm thấy ví dụ nào chứa từ khóa &quot;{searchQuery}&quot;</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-outline rounded-[1.5rem] p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
      <h3 className="text-xl font-bold text-primary pb-3 border-b border-outline/50">
        Ví dụ chứa từ khóa &quot;{searchQuery}&quot; ({matchingExamples.length})
      </h3>

      <div className="space-y-4">
        {matchingExamples.slice(0, visibleCount).map((ex, idx) => (
          <div key={idx} className="p-5 bg-hover-bg rounded-2xl border border-outline/50 hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between gap-4">
              <div>
                {language === 'en' ? (
                  <>
                    <p className="text-xl font-bold text-primary mb-2 leading-relaxed">{ex.english}</p>
                    <p className="text-base text-secondary">{ex.vietnamese}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-primary mb-2 leading-relaxed">{renderClickableHanzi(ex.chinese)}</p>
                    <p className="text-sm font-semibold text-secondary mb-1 font-mono">{ex.pinyin}</p>
                    <p className="text-base text-secondary">{ex.vietnamese}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2.5 flex-shrink-0 mt-1">
                <SpeakerIcon
                  audioUrl={ex.audio_url ? `http://localhost${ex.audio_url}` : undefined}
                  text={language === 'en' ? (ex.english || '') : (ex.chinese || '')}
                  lang={language === 'en' ? 'en' : 'zh'}
                  size={24}
                  className="text-secondary hover:text-primary transition-colors flex-shrink-0 focus:outline-none"
                />
                {ex.id && (
                  <button
                    onClick={() => handleOpenReport(ex.id)}
                    className="text-secondary hover:text-red-600 transition-colors focus:outline-none"
                    title="Báo cáo lỗi ví dụ"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {matchingExamples.length > visibleCount && (
        <button
          onClick={onLoadMore}
          className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-hover-bg hover:bg-outline/20 text-primary border border-outline font-bold text-sm transition-all flex items-center justify-center gap-1.5 focus:outline-none"
        >
          <span>Xem thêm</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
      {selectedExampleId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedExampleId(null);
          }}
          contentType={language === 'en' ? 'en_example' : 'zh_example'}
          objectId={selectedExampleId}
          defaultReportType="example"
          title="Báo cáo lỗi ví dụ"
        />
      )}
    </div>
  );
}
