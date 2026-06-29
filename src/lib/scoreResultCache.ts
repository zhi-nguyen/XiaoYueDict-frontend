const CACHE_PREFIX = 'score_result:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

export interface CachedScoreResult {
  task_id: string;
  score: number;
  language: string;
  target_text?: string;
  result_data: Record<string, any>;
  cached_at: number; // timestamp ms
}

/** Xóa các entries đã hết hạn */
export function evictOldEntries(): void {
  if (typeof window === 'undefined') return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (Date.now() - data.cached_at > CACHE_TTL_MS) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key!);
      }
    }
  }
}

/** Lưu kết quả chấm điểm vào localStorage */
export function cacheScoreResult(payload: {
  task_id: string;
  score: number;
  language: string;
  target_text?: string;
  result_data?: Record<string, any>;
}): void {
  if (typeof window === 'undefined') return;
  const key = `${CACHE_PREFIX}${payload.task_id}`;
  const data: CachedScoreResult = {
    task_id: payload.task_id,
    score: payload.score,
    language: payload.language,
    target_text: payload.target_text,
    result_data: payload.result_data || {},
    cached_at: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // QuotaExceededError or security restrictions
    console.warn('[scoreResultCache] Quota exceeded or error writing to localStorage, evicting old entries...');
    evictOldEntries();
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (retryError) {
      console.error('[scoreResultCache] Failed to save even after eviction:', retryError);
    }
  }
}

/** Lấy kết quả chấm điểm từ localStorage (null nếu expired hoặc không tồn tại) */
export function getScoreResult(taskId: string): CachedScoreResult | null {
  if (typeof window === 'undefined') return null;
  const key = `${CACHE_PREFIX}${taskId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data: CachedScoreResult = JSON.parse(raw);
    if (Date.now() - data.cached_at > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
