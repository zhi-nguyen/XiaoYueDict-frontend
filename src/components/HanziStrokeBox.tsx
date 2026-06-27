"use client";

import React, { useEffect, useRef } from 'react';

const charCache: Record<string, any | undefined> = {};
const pendingPromises: Record<string, Promise<any> | undefined> = {};

export const getCharData = (char: string): Promise<any> => {
  if (charCache[char]) {
    return Promise.resolve(charCache[char]);
  }
  if (pendingPromises[char]) {
    return pendingPromises[char];
  }

  const promise = fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then((data) => {
      charCache[char] = data;
      delete pendingPromises[char];
      return data;
    })
    .catch((err) => {
      delete pendingPromises[char];
      throw err;
    });

  pendingPromises[char] = promise;
  return promise;
};

interface HanziStrokeBoxProps {
  char: string;
}

export default function HanziStrokeBox({ char }: HanziStrokeBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!char || !container) return;

    // Clear previous elements
    container.innerHTML = '';

    const initHanziWriter = async () => {
      try {
        const HanziWriter = (await import('hanzi-writer')).default;
        if (!active) return;

        // Clear again to ensure no double-renders from concurrent calls
        container.innerHTML = '';

        writerRef.current = HanziWriter.create(container, char, {
          width: 200,
          height: 200,
          padding: 5,
          showOutline: true,
          strokeColor: '#1e3a8a', // Dark blue
          outlineColor: '#f3f4f6', // Light gray
          drawingColor: '#10b981', // Emerald green for writing quiz
          charDataLoader: (charToLoad, onLoad, onError) => {
            getCharData(charToLoad).then(onLoad).catch(onError);
          }
        });
        
        // Auto-play stroke order animation on render
        writerRef.current.animateCharacter();
      } catch (err) {
        console.error('Failed to initialize HanziWriter:', err);
      }
    };

    initHanziWriter();

    return () => {
      active = false;
      if (container) {
        container.innerHTML = '';
      }
      if (writerRef.current) {
        try {
          writerRef.current.cancelQuiz();
        } catch (e) {}
      }
    };
  }, [char]);

  const handleReplay = () => {
    if (writerRef.current) {
      writerRef.current.animateCharacter();
    }
  };

  const handleQuiz = () => {
    if (writerRef.current) {
      writerRef.current.quiz({
        onComplete: () => {
          alert('Chúc mừng! Bạn đã hoàn thành bài tập viết.');
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-[240px] h-[240px] bg-white border border-outline rounded-2xl flex items-center justify-center shadow-sm">
        {/* Replay button at top right */}
        <button
          type="button"
          onClick={handleReplay}
          className="absolute top-3 right-3 text-secondary/60 hover:text-primary transition-colors p-1.5 bg-hover-bg rounded-full border border-outline shadow-sm z-20"
          title="Xem lại hướng dẫn viết"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
        </button>

        {/* Tianzige grid lines */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 z-0">
          <div className="border-r border-b border-dashed border-outline/30"></div>
          <div className="border-b border-dashed border-outline/30"></div>
          <div className="border-r border-dashed border-outline/30"></div>
          <div></div>
        </div>
        <svg className="absolute inset-0 pointer-events-none w-full h-full text-outline/25 z-0" stroke="currentColor" strokeWidth="1" strokeDasharray="4">
          <line x1="0" y1="0" x2="240" y2="240" />
          <line x1="240" y1="0" x2="0" y2="240" />
        </svg>

        {/* Target container for HanziWriter SVG */}
        <div ref={containerRef} className="z-10" />
      </div>

      <button
        type="button"
        onClick={handleQuiz}
        className="w-full max-w-[240px] py-3 px-6 bg-hover-bg hover:bg-outline/20 border border-outline rounded-full text-primary font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 focus:outline-none"
      >
        <span className="material-symbols-outlined text-lg">edit</span>
        Tập viết
      </button>
    </div>
  );
}

interface HanziStrokeSequenceProps {
  char: string;
}

export function HanziStrokeSequence({ char }: HanziStrokeSequenceProps) {
  const [charData, setCharData] = React.useState<{ strokes: string[] } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!char) return;

    setIsLoading(true);
    const loadData = async () => {
      try {
        const data = await getCharData(char);
        if (active && data) {
          setCharData(data as { strokes: string[] });
        }
      } catch (err) {
        console.error('Failed to load character data for stroke sequence:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [char]);

  if (isLoading) {
    return <div className="text-secondary/60 text-sm animate-pulse py-2">Đang tải sơ đồ nét viết...</div>;
  }

  if (!charData) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-start mt-2">
      {charData.strokes.map((_, index) => (
        <div
          key={index}
          className="relative w-12 h-12 bg-white border border-outline rounded-lg flex items-center justify-center shadow-sm"
        >
          {/* Background grid */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-dashed border-outline/20"></div>
            <div className="border-b border-dashed border-outline/20"></div>
            <div className="border-r border-dashed border-outline/20"></div>
            <div></div>
          </div>
          
          {/* SVG strokes */}
          <svg
            viewBox="0 0 1024 1024"
            className="w-10 h-10"
          >
            <g transform="scale(1, -1) translate(0, -1024)">
              {charData.strokes.map((strokePath, strokeIdx) => {
                let color = '#f3f4f6'; // Light gray outline for future strokes
                if (strokeIdx < index) {
                  color = '#1e3a8a'; // Dark blue for past strokes
                } else if (strokeIdx === index) {
                  color = '#ef4444'; // Red for the current stroke
                }
                return (
                  <path
                    key={strokeIdx}
                    d={strokePath}
                    fill={color}
                  />
                );
              })}
            </g>
          </svg>
          
          {/* Step number badge */}
          <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-secondary/60">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
