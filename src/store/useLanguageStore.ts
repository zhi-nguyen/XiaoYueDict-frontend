import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiLanguage = 'vi' | 'en';

interface LanguageState {
  uiLanguage: UiLanguage;
  setUiLanguage: (lang: UiLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      uiLanguage: 'vi', // Default UI language
      setUiLanguage: (lang) => set({ uiLanguage: lang }),
    }),
    {
      name: 'ui_language', 
    }
  )
);
