import { create } from 'zustand';
import {
  getStreaks,
  getTargets,
  getStudyHistory,
  logStudyHistory,
  StudyHistoryPayload,
  StudyHistoryResponse,
  GamificationTarget,
  getGamificationDashboard,
} from '@/lib/api/gamification';
import { useAuthStore } from '@/store/useAuthStore';
import { mapHistoryToWeeklyChart, WeeklyChartDataPoint } from '@/lib/dashboardUtils';

interface GamificationState {
  // --- Streak data ---
  currentStreak: number;
  maxStreak: number;

  // --- Daily target ---
  /** User's configured daily target. Fetched from GET /gamification/targets/ */
  dailyTarget: GamificationTarget;

  // --- Today's progress ---
  /** Number of vocabulary words learned today (aggregated from study history). */
  todayWords: number;
  /** Study duration in minutes for today (converted from study_duration_seconds). */
  todayDuration: number;

  // --- Weekly chart data (7 days) ---
  weeklyHistory: WeeklyChartDataPoint[];

  // --- Raw history (kept for totalWords calculation in badge logic) ---
  rawHistory: StudyHistoryResponse[];

  // --- Loading / init flags ---
  /** True while the initial streak fetch is in progress (used by StreakCard). */
  isLoading: boolean;
  /** True while the full dashboard data set (target + history) is being fetched. */
  isLoadingDashboard: boolean;
  isInitialized: boolean;

  // --- Actions ---
  fetchGamificationData: () => Promise<void>;
  /**
   * Fetches streak + target + study history in parallel.
   * Call this once when the Dashboard page mounts.
   */
  fetchDashboardData: () => Promise<void>;
  logActivity: (payload: StudyHistoryPayload) => Promise<StudyHistoryResponse>;
  resetStore: () => void;
}

const DEFAULT_TARGET: GamificationTarget = {
  target_words: 10,
  target_duration: 15,
  target_type: 'words',
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  currentStreak: 0,
  maxStreak: 0,
  dailyTarget: DEFAULT_TARGET,
  todayWords: 0,
  todayDuration: 0,
  weeklyHistory: [],
  rawHistory: [],
  isLoading: false,
  isLoadingDashboard: false,
  isInitialized: false,

  // ---------------------------------------------------------------------------
  // fetchGamificationData — lightweight fetch (streak only).
  // Kept for backward compatibility with the auth-state subscriber below.
  // ---------------------------------------------------------------------------
  fetchGamificationData: async () => {
    if (get().isInitialized) return;
    if (!useAuthStore.getState().isAuthenticated) return;

    set({ isLoading: true });
    try {
      const data = await getStreaks();
      set({
        currentStreak: data.current_streak,
        maxStreak: data.max_streak,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to fetch gamification data', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // ---------------------------------------------------------------------------
  // fetchDashboardData — parallel fetch of all data needed by the Dashboard.
  // Uses Promise.allSettled so a single failing endpoint does not block others.
  // ---------------------------------------------------------------------------
  fetchDashboardData: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;

    set({ isLoadingDashboard: true });
    try {
      const data = await getGamificationDashboard();

      const todayStr = new Date().toLocaleDateString('sv-SE'); // "YYYY-MM-DD" in local time
      const todayRecord = data.history.find((h) => h.study_date === todayStr);

      set({
        currentStreak: data.streak.current_streak,
        maxStreak: data.streak.max_streak,
        dailyTarget: data.target,
        rawHistory: data.history,
        weeklyHistory: mapHistoryToWeeklyChart(data.history),
        todayWords: todayRecord?.vocabulary_learned ?? 0,
        todayDuration: todayRecord ? Math.floor(todayRecord.study_duration_seconds / 60) : 0,
        isInitialized: true,
        isLoadingDashboard: false,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      set({ isLoadingDashboard: false });
    }
  },

  // ---------------------------------------------------------------------------
  // logActivity — post a study session and apply optimistic UI updates.
  // ---------------------------------------------------------------------------
  logActivity: async (payload: StudyHistoryPayload) => {
    try {
      const response = await logStudyHistory(payload);

      // Optimistic UI: reflect the new data immediately without a full re-fetch.
      set((state) => {
        // Update today's totals
        const newTodayWords = state.todayWords + (payload.vocabulary_learned ?? 0);
        const addedSeconds = payload.study_duration_seconds ?? 0;
        const newTodayDuration = Math.floor(
          (state.todayDuration * 60 + addedSeconds) / 60
        );

        // If the user had no streak, bump it to 1 as a hopeful optimistic value
        const newStreak = state.currentStreak === 0 ? 1 : state.currentStreak;

        // Update today's entry in the weekly chart without re-fetching
        const updatedWeekly = state.weeklyHistory.map((point) =>
          point.isToday
            ? { ...point, words: point.words + (payload.vocabulary_learned ?? 0) }
            : point
        );

        return {
          todayWords: newTodayWords,
          todayDuration: newTodayDuration,
          currentStreak: newStreak,
          weeklyHistory: updatedWeekly,
        };
      });

      return response;
    } catch (error) {
      console.error('Failed to log activity', error);
      throw error;
    }
  },

  // ---------------------------------------------------------------------------
  // resetStore — called on logout.
  // ---------------------------------------------------------------------------
  resetStore: () => {
    set({
      currentStreak: 0,
      maxStreak: 0,
      dailyTarget: DEFAULT_TARGET,
      todayWords: 0,
      todayDuration: 0,
      weeklyHistory: [],
      rawHistory: [],
      isInitialized: false,
      isLoading: false,
      isLoadingDashboard: false,
    });
  },
}));

// ---------------------------------------------------------------------------
// Subscribe to auth state changes to keep gamification in sync (login/logout)
// ---------------------------------------------------------------------------
let lastIsAuthenticated = useAuthStore.getState().isAuthenticated;
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated !== lastIsAuthenticated) {
    lastIsAuthenticated = state.isAuthenticated;
    if (state.isAuthenticated) {
      useGamificationStore.getState().fetchGamificationData();
    } else {
      useGamificationStore.getState().resetStore();
    }
  }
});
