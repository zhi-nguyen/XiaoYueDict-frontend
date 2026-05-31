import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'zh' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh', // Default language
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'selected_language', // Matches previous localStorage key for continuity
    }
  )
);
