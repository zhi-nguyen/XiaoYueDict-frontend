'use client';

import { useState, useEffect, useRef } from 'react';

let isInitializedGlobal = false;
let initPromise: Promise<boolean> | null = null;

// Hàm tải động hanzilookup-js và khởi tạo dữ liệu
const ensureHanziLookupInitialized = async (): Promise<boolean> => {
  if (isInitializedGlobal) return true;
  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve) => {
    try {
      const { init } = await import('hanzilookup-js');
      init('mmah', '/data/mmah.json', (success) => {
        if (success) {
          isInitializedGlobal = true;
          resolve(true);
        } else {
          console.error('Failed to load mmah.json data file');
          initPromise = null; // Cho phép thử lại
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error during hanzilookup initialization:', error);
      initPromise = null;
      resolve(false);
    }
  });

  return initPromise;
};

export interface MatchCandidate {
  character: string;
  score: number;
}

export function useHandwritingRecognition() {
  const [isInitialized, setIsInitialized] = useState(isInitializedGlobal);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [strokes, setStrokes] = useState<number[][][]>([]);

  // Đảm bảo thư viện được khởi tạo lúc render
  useEffect(() => {
    let active = true;
    if (!isInitializedGlobal) {
      ensureHanziLookupInitialized().then((success) => {
        if (active && success) {
          setIsInitialized(true);
        }
      });
    }
    return () => {
      active = false;
    };
  }, []);

  // Hàm chạy thuật toán nhận diện dựa trên nét vẽ
  const recognize = async (currentStrokes: number[][][]) => {
    if (currentStrokes.length === 0) {
      setCandidates([]);
      return;
    }

    const ready = await ensureHanziLookupInitialized();
    if (!ready) return;

    setIsRecognizing(true);
    try {
      const { Matcher, AnalyzedCharacter } = await import('hanzilookup-js');
      
      const char = new AnalyzedCharacter(currentStrokes);
      const matcher = new Matcher('mmah');
      
      matcher.match(char, 12, (matches: MatchCandidate[]) => {
        if (matches && matches.length > 0) {
          setCandidates(matches.map((m) => m.character));
        } else {
          setCandidates([]);
        }
        setIsRecognizing(false);
      });
    } catch (e) {
      console.error('Error matching handwriting:', e);
      setIsRecognizing(false);
    }
  };

  // Thêm một nét vẽ mới
  const addStroke = (newStroke: number[][]) => {
    const updatedStrokes = [...strokes, newStroke];
    setStrokes(updatedStrokes);
    recognize(updatedStrokes);
  };

  // Hoàn tác nét cuối cùng
  const undoLastStroke = () => {
    if (strokes.length === 0) return;
    const updatedStrokes = strokes.slice(0, -1);
    setStrokes(updatedStrokes);
    recognize(updatedStrokes);
  };

  // Xóa toàn bộ canvas và nét
  const clearStrokes = () => {
    setStrokes([]);
    setCandidates([]);
  };

  return {
    isInitialized,
    isRecognizing,
    candidates,
    strokes,
    addStroke,
    undoLastStroke,
    clearStrokes,
  };
}
