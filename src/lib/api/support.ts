import { djangoClient } from '@/lib/apiClient';

// ─── Feature Reports ───────────────────────────────────────────────

export interface CreateFeatureReportPayload {
  title: string;
  description: string;
  feature_area:
    | 'dictionary'
    | 'speaking'
    | 'writing'
    | 'exam'
    | 'notes'
    | 'translate'
    | 'ui_ux'
    | 'other';
  guest_id?: string;
}

export interface FeatureReportSummary {
  id: string;
  title: string;
  feature_area: string;
  status: string;
  created_at: string;
}

export async function createFeatureReport(
  payload: CreateFeatureReportPayload,
): Promise<{ detail: string; id: string }> {
  const response = await djangoClient.post('/reports/features/', payload);
  return response.data;
}

export async function getFeatureReports(): Promise<FeatureReportSummary[]> {
  const response = await djangoClient.get('/reports/features/');
  return response.data;
}

// ─── Support Requests ──────────────────────────────────────────────

export interface CreateSupportRequestPayload {
  title: string;
  description: string;
  category: 'bug' | 'billing' | 'account' | 'other';
  guest_id?: string;
  guest_name?: string;
  guest_email?: string;
}

export interface CreateSupportResponse {
  detail: string;
  id: string;
  signed_token?: string;
}

export interface SupportRequestSummary {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface TicketCommentItem {
  id: string;
  author_name: string;
  comment_text: string;
  created_at: string;
}

export interface SupportRequestDetail extends SupportRequestSummary {
  description: string;
  updated_at: string;
  comments: TicketCommentItem[];
}

export async function createSupportRequest(
  payload: CreateSupportRequestPayload,
): Promise<CreateSupportResponse> {
  const response = await djangoClient.post('/reports/support/', payload);
  return response.data;
}

export async function getSupportRequests(): Promise<SupportRequestSummary[]> {
  const response = await djangoClient.get('/reports/support/');
  return response.data;
}

export async function getSupportRequestDetail(
  id: string,
): Promise<SupportRequestDetail> {
  const response = await djangoClient.get(`/reports/support/${id}/`);
  return response.data;
}

export async function getGuestTicketDetail(
  token: string,
): Promise<SupportRequestDetail> {
  const response = await djangoClient.get('/reports/support/verify/', {
    params: { token },
  });
  return response.data;
}

export interface BulkVerifyResponse {
  tickets: SupportRequestSummary[];
  invalid_count: number;
}

export async function bulkVerifyGuestTickets(
  tokens: string[],
): Promise<BulkVerifyResponse> {
  const response = await djangoClient.post('/reports/support/verify-bulk/', {
    tokens,
  });
  return response.data;
}

// ─── Guest Token Management (LocalStorage) ─────────────────────────

const GUEST_TICKETS_KEY = 'guest_support_tokens';
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

interface GuestTokenEntry {
  id: string;
  token: string;
  createdAt: number;
}

export function saveGuestToken(ticketId: string, token: string): void {
  if (typeof window === 'undefined') return;
  const existing: GuestTokenEntry[] = JSON.parse(
    localStorage.getItem(GUEST_TICKETS_KEY) || '[]',
  );
  existing.push({ id: ticketId, token, createdAt: Date.now() });
  localStorage.setItem(GUEST_TICKETS_KEY, JSON.stringify(existing));
}

export function getValidGuestTokens(): GuestTokenEntry[] {
  if (typeof window === 'undefined') return [];
  const existing: GuestTokenEntry[] = JSON.parse(
    localStorage.getItem(GUEST_TICKETS_KEY) || '[]',
  );
  const valid = existing.filter((t) => Date.now() - t.createdAt < TOKEN_MAX_AGE_MS);
  // Dọn dẹp token hết hạn
  if (valid.length !== existing.length) {
    localStorage.setItem(GUEST_TICKETS_KEY, JSON.stringify(valid));
  }
  return valid;
}

export function clearGuestTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_TICKETS_KEY);
}
