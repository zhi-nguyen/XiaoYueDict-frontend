import { create } from 'zustand';
import { useAuthStore } from '@/store/useAuthStore';
import {
  getWalletBalance,
  getCoinConfig,
  getShopItems,
  WalletBalance,
  AllWalletBalances,
  CoinConfig,
  ShopItem,
} from '@/lib/api/coins';

interface CoinState {
  wallets: AllWalletBalances;
  config: CoinConfig | null;
  shopItems: ShopItem[];
  isInitialized: boolean;
  isLoading: boolean;
  isLoadingShopItems: boolean;
  isShopItemsInitialized: boolean;

  fetchWalletBalances: (force?: boolean) => Promise<void>;
  fetchCoinConfig: () => Promise<void>;
  fetchShopItems: (force?: boolean) => Promise<void>;
  setWallets: (data: AllWalletBalances) => void;
  optimisticSpend: (lang: string, amount: number) => void;
  resetStore: () => void;
}

const DEFAULT_BALANCE: WalletBalance = { paid: 0, free: 0, shop: 0, total: 0 };
const DEFAULT_WALLETS: AllWalletBalances = {
  zh: { ...DEFAULT_BALANCE },
  en: { ...DEFAULT_BALANCE },
};

export const useCoinStore = create<CoinState>((set, get) => ({
  wallets: DEFAULT_WALLETS,
  config: null,
  shopItems: [],
  isInitialized: false,
  isLoading: false,
  isLoadingShopItems: false,
  isShopItemsInitialized: false,

  fetchWalletBalances: async (force?: boolean) => {
    if (!force && get().isInitialized) return;
    if (!useAuthStore.getState().isAuthenticated) return;

    set({ isLoading: true });
    try {
      const data = await getWalletBalance();
      set({ wallets: data, isInitialized: true });
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCoinConfig: async () => {
    if (get().config) return;
    if (!useAuthStore.getState().isAuthenticated) return;

    try {
      const data = await getCoinConfig();
      set({ config: data });
    } catch (error) {
      console.error('Failed to fetch coin configs:', error);
    }
  },

  fetchShopItems: async (force?: boolean) => {
    if (!force && get().isShopItemsInitialized) return;

    set({ isLoadingShopItems: true });
    try {
      const data = await getShopItems();
      set({ shopItems: data, isShopItemsInitialized: true });
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    } finally {
      set({ isLoadingShopItems: false });
    }
  },

  setWallets: (data: AllWalletBalances) => {
    set({ wallets: data, isInitialized: true });
  },

  optimisticSpend: (lang: string, amount: number) => {
    set((state) => {
      const wallets = { ...state.wallets };
      const current = wallets[lang as 'zh' | 'en'];
      if (!current) return {};

      // Paid balance is deducted first, then free balance
      let remaining = amount;
      const deductPaid = Math.min(current.paid, remaining);
      remaining -= deductPaid;
      const deductFree = remaining;

      const newPaid = current.paid - deductPaid;
      const newFree = current.free - deductFree;

      wallets[lang as 'zh' | 'en'] = {
        paid: newPaid,
        free: newFree,
        shop: current.shop,
        total: newPaid + newFree,
      };

      return { wallets };
    });
  },

  resetStore: () => {
    set({
      wallets: DEFAULT_WALLETS,
      config: null,
      shopItems: [],
      isInitialized: false,
      isLoading: false,
      isLoadingShopItems: false,
      isShopItemsInitialized: false,
    });
  },
}));

// Subscribe to auth state changes to keep coin state in sync
let lastIsAuthenticated = useAuthStore.getState().isAuthenticated;
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated !== lastIsAuthenticated) {
    lastIsAuthenticated = state.isAuthenticated;
    if (state.isAuthenticated) {
      useCoinStore.getState().fetchWalletBalances();
      useCoinStore.getState().fetchCoinConfig();
      useCoinStore.getState().fetchShopItems();
    } else {
      useCoinStore.getState().resetStore();
    }
  }
});
