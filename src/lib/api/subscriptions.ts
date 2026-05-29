import { apiClient } from '@/lib/apiClient';

export interface SubscriptionInfo {
  tier: 'Free' | 'Plus' | 'Premium' | 'Pro';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

export interface SubscriptionHistoryItem {
  id: number;
  tier: string;
  action: string;
  changed_at: string;
  note: string;
}

export const getMySubscription = async (): Promise<SubscriptionInfo> => {
  const response = await apiClient.get('/subscriptions/me/');
  return response.data;
};

export const getSubscriptionHistory = async (): Promise<SubscriptionHistoryItem[]> => {
  const response = await apiClient.get('/subscriptions/history/');
  return response.data;
};
