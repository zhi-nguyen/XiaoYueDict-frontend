import { apiClient } from '@/lib/apiClient';

export interface GamificationStreak {
  current_streak: number;
  max_streak: number;
}

export interface GamificationTarget {
  target_words: number;
  target_duration: number;
  target_type: string;
}

export interface StudyHistoryPayload {
  vocabulary_learned: number;
  pronunciation_accuracy?: number;
  study_duration_seconds?: number;
}

export interface StudyHistoryResponse {
  study_date: string;
  vocabulary_learned: number;
  pronunciation_accuracy: number;
  study_duration_seconds: number;
}

export interface DailyActivityResponse {
  activity_date: string;
  is_target_met: boolean;
}

export const getStreaks = async (): Promise<GamificationStreak> => {
  const response = await apiClient.get('/gamification/streaks/');
  return response.data;
};

export const getTargets = async (): Promise<GamificationTarget> => {
  const response = await apiClient.get('/gamification/targets/');
  return response.data;
};

export const updateTargets = async (payload: Partial<GamificationTarget>): Promise<GamificationTarget> => {
  const response = await apiClient.patch('/gamification/targets/', payload);
  return response.data;
};

export const logStudyHistory = async (payload: StudyHistoryPayload): Promise<StudyHistoryResponse> => {
  const response = await apiClient.post('/gamification/history/', payload);
  return response.data;
};

export const getStudyHistory = async (): Promise<StudyHistoryResponse[]> => {
  const response = await apiClient.get('/gamification/history/');
  return response.data;
};

export const getActivities = async (): Promise<DailyActivityResponse[]> => {
  const response = await apiClient.get('/gamification/activities/');
  return response.data;
};

export interface GamificationDashboardResponse {
  streak: GamificationStreak;
  target: GamificationTarget;
  history: StudyHistoryResponse[];
}

export const getGamificationDashboard = async (): Promise<GamificationDashboardResponse> => {
  const response = await apiClient.get('/gamification/dashboard/');
  return response.data;
};
