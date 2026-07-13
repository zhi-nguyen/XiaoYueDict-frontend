import { apiClient } from '@/lib/apiClient';

export interface WalletBalance {
  paid: number;
  free: number;
  total: number;
}

export interface AllWalletBalances {
  zh: WalletBalance;
  en: WalletBalance;
}

export interface CoinConfig {
  tier: string;
  weekly_refill_cap: number;
  words_per_coin: number;
  chat_create_cost: number;
  chat_message_cost: number;
  coin_price_vnd: number;
  purchase_presets: number[];
}

export interface CardResult {
  card_id: string;
  status: 'memorized' | 'skipped' | 'pending';
}

export interface FinishSessionResponse {
  status: string;
  session_id: string;
  memorized_count: number;
  coins_earned: number;
  is_capped?: boolean;
  wallet_balances: AllWalletBalances;
}

export interface CoinPurchaseResponse {
  status: 'payment_pending';
  order_id: string;
  order_code: string;
  coin_amount: number;
  price: number;
  qr_url: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  transfer_content: string;
  expires_at: string;
}

export interface CoinPurchaseStatusResponse {
  order_id: string;
  order_code: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  coin_amount: number;
  price: number;
  wallet_balances: AllWalletBalances;
}

export async function getWalletBalance(): Promise<AllWalletBalances> {
  const response = await apiClient.get('/gamification/wallet/');
  return response.data;
}

export async function getCoinConfig(): Promise<CoinConfig> {
  const response = await apiClient.get('/gamification/coin-config/');
  return response.data;
}

export async function initiateCoinPurchase(lang: 'zh' | 'en', coinAmount: number): Promise<CoinPurchaseResponse> {
  const response = await apiClient.post('/gamification/wallet/purchase/', { lang, coin_amount: coinAmount });
  return response.data;
}

export async function getCoinPurchaseStatus(orderId: string): Promise<CoinPurchaseStatusResponse> {
  const response = await apiClient.get(`/gamification/wallet/purchase/${orderId}/`);
  return response.data;
}

export async function createStudySession(cardIds: string[], lang: string): Promise<{ status: string; session_id: string; total_cards: number }> {
  const response = await apiClient.post('/gamification/study-session/', { card_ids: cardIds, lang });
  return response.data;
}

export async function finishStudySession(sessionId: string, cardResults: CardResult[]): Promise<FinishSessionResponse> {
  const response = await apiClient.post(`/gamification/study-session/${sessionId}/finish/`, { card_results: cardResults });
  return response.data;
}

export interface TierCoinConfig {
  tier: 'Free' | 'Plus' | 'Pro' | 'Premium';
  weekly_refill_cap: number;
  words_per_coin: number;
  daily_free_earn_limit: number;
  chat_create_cost: number;
  chat_message_cost: number;
}

export async function getAllCoinConfigs(): Promise<TierCoinConfig[]> {
  const response = await apiClient.get('/gamification/wallet/all-configs/');
  return response.data;
}
