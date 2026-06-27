'use client';

import React from 'react';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import SpeakerIcon from '@/components/dictionary/SpeakerIcon';
import WordCardZh from '@/components/WordCardZh';
import HanziStrokeBox, { HanziStrokeSequence } from '@/components/HanziStrokeBox';
import { ZhWord } from '@/types/dictionary';
import { getEtymology, speakChinese } from '@/lib/zhUtils';

interface HanziTabProps {
  hanziChars: string[];
  selectedHanziChar: string | null;
  onSelectChar: (char: string) => void;
  hanziWords: Record<string, ZhWord | null>;
  resolvedRadicals: Record<string, string>;
  isLoadingHanziDetails: boolean;
  onSearch: (query: string) => void;
  onPracticeClick: () => void;
}

/**
 * Hán tự (Chinese Character) tab panel for the Study page.
 * ZH-specific: shows stroke order, radicals, etymology, and character analysis.
 * Not applicable for EN service.
 */
export default function HanziTab({
  hanziChars,
  selectedHanziChar,
  onSelectChar,
  hanziWords,
  resolvedRadicals,
  isLoadingHanziDetails,
  onSearch,
  onPracticeClick,
}: HanziTabProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [visibleRowsCount, setVisibleRowsCount] = React.useState(1);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hanziCharsStr = hanziChars.join('');

  React.useEffect(() => {
    setVisibleRowsCount(1);
  }, [hanziCharsStr]);

  const gridCols = isMobile ? 5 : 20;
  const labelSpan = isMobile ? 1 : 2;
  const toggleSpan = 1;

  const characterRows = React.useMemo(() => {
    const rows: string[][] = [];
    if (hanziChars.length === 0) return rows;

    const limitNoToggle = gridCols - labelSpan; // 18 on desktop, 4 on mobile
    const limitWithToggle = gridCols - labelSpan - toggleSpan; // 17 on desktop, 3 on mobile

    const hasToggle = hanziChars.length > limitNoToggle;

    if (!hasToggle) {
      rows.push(hanziChars);
      return rows;
    }

    // Row 1
    rows.push(hanziChars.slice(0, limitWithToggle));

    // Subsequent rows (which don't have label & toggle button, so they use all gridCols slots)
    let index = limitWithToggle;
    while (index < hanziChars.length) {
      rows.push(hanziChars.slice(index, index + gridCols));
      index += gridCols;
    }

    return rows;
  }, [hanziChars, isMobile, labelSpan]);

  const totalRows = characterRows.length;
  const hasToggle = totalRows > 1;

  // No Chinese characters found in search query
  if (hanziChars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[400px] text-secondary">
        <p className="text-lg font-medium">Không tìm thấy chữ Hán tự nào trong từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hanzi selector buttons */}
      <div 
        className="p-3 bg-surface border border-outline rounded-2xl gap-y-2.5"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          alignItems: 'center'
        }}
      >
        {Array.from({ length: visibleRowsCount }).map((_, rowIndex) => {
          const isFirstRow = rowIndex === 0;
          const isLastVisibleRow = rowIndex === visibleRowsCount - 1;
          const hasMoreRows = visibleRowsCount < totalRows;

          // Determine characters to display in this row
          let rowChars = characterRows[rowIndex] || [];
          let showDotsButton = false;

          if (isLastVisibleRow && hasMoreRows && !isFirstRow) {
            // Last visible row with more rows ahead has a dots button at the end (unless it is Row 1)
            rowChars = rowChars.slice(0, rowChars.length - 1);
            showDotsButton = true;
          }

          return (
            <React.Fragment key={rowIndex}>
              {/* Row 1 Label */}
              {isFirstRow && (
                <div 
                  style={{ gridColumn: `span ${labelSpan}` }} 
                  className="text-sm font-semibold text-secondary select-none"
                >
                  Chữ Hán:
                </div>
              )}

              {/* Character buttons */}
              {rowChars.map((char, charIdx) => (
                <button
                  key={`${char}-${charIdx}`}
                  style={{ gridColumn: 'span 1' }}
                  onClick={() => onSelectChar(char)}
                  className={`w-full aspect-square max-w-[44px] rounded-xl text-lg font-bold transition-all border flex items-center justify-center focus:outline-none justify-self-center
                    ${selectedHanziChar === char
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-hover-bg hover:bg-outline/20 text-secondary border-transparent'
                    }`}
                >
                  {char}
                </button>
              ))}

              {/* Optional three-dots button at the end of last visible row */}
              {showDotsButton && (
                <button
                  type="button"
                  style={{ gridColumn: 'span 1' }}
                  onClick={() => setVisibleRowsCount((prev) => prev + 1)}
                  className="w-full aspect-square max-w-[44px] rounded-xl text-secondary hover:text-primary bg-hover-bg hover:bg-outline/20 transition-all border border-outline/50 font-bold flex items-center justify-center focus:outline-none justify-self-center"
                  title="Hiện thêm hàng tiếp theo"
                >
                  ...
                </button>
              )}

              {/* Toggle button at the end of Row 1 */}
              {isFirstRow && hasToggle && (
                <button
                  type="button"
                  style={{ gridColumn: 'span 1' }}
                  onClick={() => setVisibleRowsCount(visibleRowsCount > 1 ? 1 : 2)}
                  className="w-full aspect-square max-w-[44px] rounded-xl bg-hover-bg hover:bg-outline/20 text-secondary hover:text-primary transition-all border border-outline/50 flex items-center justify-center focus:outline-none justify-self-center"
                  title={visibleRowsCount > 1 ? "Thu gọn" : "Mở rộng"}
                >
                  {visibleRowsCount > 1 ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Hanzi details panel */}
      {selectedHanziChar && (
        isLoadingHanziDetails ? (
          <div className="flex flex-col items-center justify-center p-16 bg-surface border border-outline rounded-[1.5rem] min-h-[300px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <HanziDetailsPanel
            selectedHanziChar={selectedHanziChar}
            charWord={hanziWords[selectedHanziChar] || null}
            resolvedRadicals={resolvedRadicals}
            onSearch={onSearch}
            onPracticeClick={onPracticeClick}
          />
        )
      )}
    </div>
  );
}

// ── Sub-component: Hanzi Details Panel ────────────────────────────────────────

interface HanziDetailsPanelProps {
  selectedHanziChar: string;
  charWord: ZhWord | null;
  resolvedRadicals: Record<string, string>;
  onSearch: (query: string) => void;
  onPracticeClick: () => void;
}

function HanziDetailsPanel({
  selectedHanziChar,
  charWord,
  resolvedRadicals,
  onSearch,
  onPracticeClick,
}: HanziDetailsPanelProps) {
  const radicalName = charWord?.radical?.[0]
    ? (resolvedRadicals[charWord.radical[0]] || charWord.radical[0])
    : 'Chưa rõ';

  const popularityText = charWord
    ? (charWord.popularity_rank && charWord.popularity_rank <= 1000
      ? 'Rất cao'
      : charWord.popularity_rank && charWord.popularity_rank <= 3000
        ? 'Cao'
        : 'Trung bình')
    : 'Chưa rõ';

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Column: Visual details */}
      <div className="md:col-span-5 bg-surface border border-outline rounded-[1.5rem] p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <HanziStrokeBox char={selectedHanziChar} />

          <div className="w-full space-y-4 text-base text-secondary font-medium pt-4 border-t border-outline/50">
            <div className="flex items-center gap-2">
              <span className="text-secondary/70 font-normal">Bính âm:</span>
              <span className="text-primary font-bold text-xl">{charWord?.pinyin || 'Chưa rõ'}</span>
              <SpeakerIcon
                text={selectedHanziChar || ''}
                lang="zh"
                size={16}
                className="p-1.5 rounded-full hover:bg-hover-bg text-primary transition-colors focus:outline-none"
              />
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Thành phần:</span>
              <span className="text-primary font-semibold ml-1">
                {charWord?.components?.flat()?.join(', ') || 'Chưa rõ'}
              </span>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Lục thư:</span>
              <span className="text-primary font-semibold ml-1">
                {getEtymology(selectedHanziChar)}
              </span>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Bộ thủ:</span>
              <span className="text-primary font-bold ml-1 uppercase">{radicalName}</span>
            </div>
            <div>
              <span className="text-secondary/70 font-normal">Số nét:</span>
              <span className="text-primary font-bold ml-1">
                {charWord?.stroke_number?.[0] || 'Chưa rõ'}
              </span>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-outline/50">
            <span className="text-secondary/70 font-normal block mb-2">Sơ đồ nét viết (Nét bút):</span>
            <HanziStrokeSequence char={selectedHanziChar} />
          </div>

          <div className="w-full flex items-center gap-2 pt-2">
            <span className="text-secondary/70 font-normal">Độ phổ biến:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${popularityText === 'Rất cao'
              ? 'bg-red-50 text-red-700 border-red-200'
              : popularityText === 'Cao'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
              {popularityText}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: WordCard for character details (Meaning, Hán Việt, Examples) */}
      <div className="md:col-span-7">
        <WordCardZh word={charWord} onCharClick={onSearch} onPracticeClick={onPracticeClick} />
      </div>
    </div>
  );
}
