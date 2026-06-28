import { create } from 'zustand';
import { 
  getMySubscription, 
  getSubscriptionPlans, 
  registerSubscription, 
  cancelDowngrade, 
  SubscriptionInfo, 
  SubscriptionPlan,
  RegisterResponse
} from '@/lib/api/subscriptions';
import { djangoClient } from '@/lib/apiClient';
import { getGuestId } from '@/lib/guest';
import { useAuthStore } from '@/store/useAuthStore';

export interface VolumeUsageInfo {
  tier: string;
  limit_min: number;
  limit_hr: number;
  limit_day: number;
  used_min: number;
  used_hr: number;
  used_day: number;
  service_available?: boolean;
}

interface SubscriptionState {
  tier: 'Free' | 'Plus' | 'Pro' | 'Premium' | null;
  isActive: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  usageData: VolumeUsageInfo | null;
  plans: SubscriptionPlan[];
  pendingDowngradeTier: 'Free' | 'Plus' | 'Pro' | 'Premium' | null;
  endDate: string | null;
  
  fetchSubscription: () => Promise<void>;
  fetchUsage: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  registerPlan: (tier: string) => Promise<RegisterResponse>;
  cancelPendingDowngrade: () => Promise<void>;
  resetStore: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: null,
  isActive: false,
  isLoading: false,
  isInitialized: false,
  usageData: null,
  plans: [],
  pendingDowngradeTier: null,
  endDate: null,

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
        pendingDowngradeTier: data.pending_downgrade_tier || null,
        endDate: data.end_date,
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

  fetchPlans: async () => {
    if (get().plans.length > 0) return;
    try {
      const plans = await getSubscriptionPlans();
      set({ plans });
    } catch (error) {
      console.error("Failed to fetch subscription plans:", error);
    }
  },

  registerPlan: async (tier: string) => {
    set({ isLoading: true });
    try {
      const res = await registerSubscription(tier);
      set({
        tier: res.subscription.tier,
        isActive: res.subscription.is_active,
        pendingDowngradeTier: res.subscription.pending_downgrade_tier || null,
        endDate: res.subscription.end_date,
      });
      get().fetchUsage();
      return res;
    } catch (error) {
      console.error(`Failed to register plan ${tier}:`, error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelPendingDowngrade: async () => {
    set({ isLoading: true });
    try {
      const res = await cancelDowngrade();
      set({
        tier: res.subscription.tier,
        isActive: res.subscription.is_active,
        pendingDowngradeTier: res.subscription.pending_downgrade_tier || null,
        endDate: res.subscription.end_date,
      });
    } catch (error) {
      console.error("Failed to cancel pending downgrade:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetStore: () => {
    set({
      tier: null,
      isActive: false,
      isInitialized: false,
      isLoading: false,
      usageData: null,
      plans: [],
      pendingDowngradeTier: null,
      endDate: null
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

