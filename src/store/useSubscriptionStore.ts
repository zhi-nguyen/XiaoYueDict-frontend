import { create } from 'zustand';
import { getMySubscription, SubscriptionInfo } from '@/lib/api/subscriptions';
import { djangoClient } from '@/lib/apiClient';
import { getGuestId } from '@/hooks/useWebSocket';

export interface VolumeUsageInfo {
  tier: string;
  limit_min: number;
  limit_hr: number;
  limit_day: number;
  used_min: number;
  used_hr: number;
  used_day: number;
}

interface SubscriptionState {
  tier: 'Free' | 'Plus' | 'Premium' | 'Pro' | null;
  isActive: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  usageData: VolumeUsageInfo | null;
  
  fetchSubscription: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  resetStore: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: null,
  isActive: false,
  isLoading: false,
  isInitialized: false,
  usageData: null,

  fetchSubscription: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const data: SubscriptionInfo = await getMySubscription();
      set({ 
        tier: data.tier, 
        isActive: data.is_active,
        isInitialized: true 
      });
    } catch (error) {
      console.error("Failed to fetch subscription data", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUsage: async () => {
    try {
      const guestId = getGuestId();
      const headers: Record<string, string> = {};
      if (guestId) {
        headers['X-Guest-ID'] = guestId;
      }
      const res = await djangoClient.get('/subscriptions/usage/', { headers });
      set({ usageData: res.data });
    } catch (error) {
      console.error("Failed to fetch subscription usage:", error);
    }
  },

  resetStore: () => {
    set({
      tier: null,
      isActive: false,
      isInitialized: false,
      isLoading: false,
      usageData: null
    });
  }
}));

