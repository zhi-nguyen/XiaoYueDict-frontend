import { apiClient } from '@/lib/apiClient';

export interface SubscriptionInfo {
  tier: 'Free' | 'Plus' | 'Pro' | 'Premium';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  price?: string;
  vat?: string;
  total_price?: string;
  pending_downgrade_tier?: 'Free' | 'Plus' | 'Pro' | 'Premium' | null;
}

export interface SubscriptionPlan {
  id: string;
  tier: 'Free' | 'Plus' | 'Pro' | 'Premium';
  price: string;
  vat: string;
  total_price: string;
  description: string;
}

export interface SubscriptionHistoryItem {
  id: number;
  tier: string;
  action: string;
  changed_at: string;
  note: string;
}

export interface RegisterResponse {
  status: 'upgraded' | 'downgraded_immediately' | 'downgrade_scheduled';
  message: string;
  subscription: SubscriptionInfo;
}

export const getMySubscription = async (): Promise<SubscriptionInfo> => {
  const response = await apiClient.get('/subscriptions/me/');
  return response.data;
};

export const getSubscriptionHistory = async (): Promise<SubscriptionHistoryItem[]> => {
  const response = await apiClient.get('/subscriptions/history/');
  return response.data;
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get('/subscriptions/plans/');
  return response.data;
};

export const registerSubscription = async (tier: string): Promise<RegisterResponse> => {
  const response = await apiClient.post('/subscriptions/register/', { tier });
  return response.data;
};

export const cancelDowngrade = async (): Promise<RegisterResponse> => {
  const response = await apiClient.post('/subscriptions/cancel-downgrade/');
  return response.data;
};
