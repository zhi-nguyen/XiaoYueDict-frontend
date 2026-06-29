import { create } from 'zustand';
import { ZhWord } from '@/types/dictionary';

interface HanziCacheState {
  hanziWords: Record<string, ZhWord | null>;
  resolvedRadicals: Record<string, string>;
  addHanziWords: (newWords: Record<string, ZhWord | null>) => void;
  addResolvedRadicals: (newRadicals: Record<string, string>) => void;
}

export const useHanziCacheStore = create<HanziCacheState>((set) => ({
  hanziWords: {},
  resolvedRadicals: {},
  addHanziWords: (newWords) => set((state) => ({
    hanziWords: { ...state.hanziWords, ...newWords }
  })),
  addResolvedRadicals: (newRadicals) => set((state) => ({
    resolvedRadicals: { ...state.resolvedRadicals, ...newRadicals }
  })),
}));
