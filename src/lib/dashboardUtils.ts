import { StudyHistoryResponse } from '@/lib/api/gamification';

// Vietnamese weekday labels, Sunday = CN, Monday = T2, ..., Saturday = T7
const WEEKDAY_LABELS: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
};

/**
 * Returns the Vietnamese weekday short label for a given Date object.
 */
function getVietnameseWeekday(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()] ?? '??';
}

/**
 * Formats a Date to "YYYY-MM-DD" string in local time (not UTC)
 * to correctly match dates returned from the backend.
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface WeeklyChartDataPoint {
  name: string;
  words: number;
  /** True only for the current day — used to highlight today's bar in the chart. */
  isToday: boolean;
}

/**
 * Converts raw StudyHistory API response into 7-day chart data.
 *
 * Algorithm: O(N) Lookup Map — the history array is indexed once into a Map
 * keyed by "YYYY-MM-DD", then we iterate exactly 7 times (one per day).
 * This avoids an O(7×N) nested search even for users with years of history.
 *
 * @param history - Full history array from GET /gamification/history/
 * @returns Array of 7 data points ordered from 6 days ago → today.
 */
export function mapHistoryToWeeklyChart(
  history: StudyHistoryResponse[]
): WeeklyChartDataPoint[] {
  // Build O(1) lookup map: "YYYY-MM-DD" → vocabulary_learned
  const historyMap = new Map<string, number>();
  for (const item of history) {
    historyMap.set(item.study_date, item.vocabulary_learned);
  }

  // Generate 7 days [6 days ago … today] and look up each one
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // i=0 → 6 days ago, i=6 → today
    const dateStr = toLocalDateString(d);
    return {
      name: getVietnameseWeekday(d),
      words: historyMap.get(dateStr) ?? 0,
      isToday: i === 6,
    };
  });
}

export interface BadgeDefinition {
  icon: string;
  label: string;
  unlocked: boolean;
}

/**
 * Derives badge unlock status purely from client-side data.
 * No backend table required for MVP phase.
 *
 * Thresholds are intentional constants — do NOT extract to magic numbers
 * without naming them clearly here.
 */
const BADGE_RULES: {
  icon: string;
  label: string;
  condition: (params: { maxStreak: number; totalWords: number }) => boolean;
}[] = [
  {
    icon: 'school',
    label: 'Người mới bắt đầu',
    condition: ({ maxStreak }) => maxStreak >= 1,
  },
  {
    icon: 'local_fire_department',
    label: 'Kiên trì 3 ngày',
    condition: ({ maxStreak }) => maxStreak >= 3,
  },
  {
    icon: 'workspace_premium',
    label: 'Streak 1 tuần',
    condition: ({ maxStreak }) => maxStreak >= 7,
  },
  {
    icon: 'military_tech',
    label: 'Streak 30 ngày',
    condition: ({ maxStreak }) => maxStreak >= 30,
  },
  {
    icon: 'auto_stories',
    label: 'Từ vựng đa dạng',
    condition: ({ totalWords }) => totalWords >= 100,
  },
  {
    icon: 'star',
    label: 'Học giả',
    condition: ({ maxStreak }) => maxStreak >= 100,
  },
];

/**
 * Computes the badge list from the current gamification state.
 * Intended to be memoized (useMemo) at the call site.
 */
export function computeBadges(params: {
  maxStreak: number;
  totalWords: number;
}): BadgeDefinition[] {
  return BADGE_RULES.map((rule) => ({
    icon: rule.icon,
    label: rule.label,
    unlocked: rule.condition(params),
  }));
}
