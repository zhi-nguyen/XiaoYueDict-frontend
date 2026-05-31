import { create } from 'zustand';
import { getMySubscription, SubscriptionInfo } from '@/lib/api/subscriptions';

interface SubscriptionState {
  tier: 'Free' | 'Plus' | 'Premium' | 'Pro' | null;
  isActive: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  fetchSubscription: () => Promise<void>;
  resetStore: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: null,
  isActive: false,
  isLoading: false,
  isInitialized: false,

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

  resetStore: () => {
    set({
      tier: null,
      isActive: false,
      isInitialized: false,
      isLoading: false
    });
  }
}));
