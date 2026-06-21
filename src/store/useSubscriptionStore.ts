import { create } from 'zustand';
import { getMySubscription, SubscriptionInfo } from '@/lib/api/subscriptions';
import { djangoClient } from '@/lib/apiClient';
import { getGuestId } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';

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
    
    // Return early if not authenticated yet to avoid failed requests
    if (!useAuthStore.getState().isAuthenticated) return;

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
    const authState = useAuthStore.getState();
    
    if (authState.isLoading) {
      // If auth is checking (e.g. on page reload), defer fetchUsage until checkAuth is complete
      const unsubscribe = useAuthStore.subscribe((state) => {
        if (!state.isLoading) {
          unsubscribe();
          get().fetchUsage();
        }
      });
      return;
    }

    try {
      const guestId = getGuestId();
      const headers: Record<string, string> = {};
      // Only attach guest ID if not authenticated
      if (guestId && !authState.isAuthenticated) {
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

// Subscribe to auth state changes to keep subscription and usage in sync (login / logout / page reload)
let lastIsAuthenticated = useAuthStore.getState().isAuthenticated;
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated !== lastIsAuthenticated) {
    lastIsAuthenticated = state.isAuthenticated;
    if (state.isAuthenticated) {
      // User just logged in or loaded session, fetch subscription and usage
      useSubscriptionStore.getState().fetchSubscription();
      useSubscriptionStore.getState().fetchUsage();
    } else {
      // User logged out, reset store and fetch guest usage
      useSubscriptionStore.getState().resetStore();
      useSubscriptionStore.getState().fetchUsage();
    }
  }
});

