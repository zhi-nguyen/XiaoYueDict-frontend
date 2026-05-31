import { create } from 'zustand';
import { getStreaks, logStudyHistory, StudyHistoryPayload, StudyHistoryResponse } from '@/lib/api/gamification';

interface GamificationState {
  currentStreak: number;
  maxStreak: number;
  isLoading: boolean;
  isInitialized: boolean;
  
  fetchGamificationData: () => Promise<void>;
  logActivity: (payload: StudyHistoryPayload) => Promise<StudyHistoryResponse>;
  resetStore: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  currentStreak: 0,
  maxStreak: 0,
  isLoading: false,
  isInitialized: false,

  fetchGamificationData: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const data = await getStreaks();
      set({ 
        currentStreak: data.current_streak, 
        maxStreak: data.max_streak,
        isInitialized: true 
      });
    } catch (error) {
      console.error("Failed to fetch gamification data", error);
    } finally {
      set({ isLoading: false });
    }
  },

  logActivity: async (payload: StudyHistoryPayload) => {
    try {
      const response = await logStudyHistory(payload);
      
      // Optimistic UI updates
      // Here we assume that if the response is successful and they sent at least 1 word/second
      // the streak might increase if they met the target. 
      // Actually the backend could return if the target was met, but currently it just returns StudyHistoryResponse.
      // For immediate gratification (Optimistic UI), if their currentStreak was 0, we can bump it to 1
      // or just assume any activity might keep the flame alive today.
      
      const current = get().currentStreak;
      if (current === 0) {
          set({ currentStreak: 1 });
      }
      
      return response;
    } catch (error) {
      console.error("Failed to log activity", error);
      throw error;
    }
  },

  resetStore: () => {
    set({
      currentStreak: 0,
      maxStreak: 0,
      isInitialized: false,
      isLoading: false
    });
  }
}));
