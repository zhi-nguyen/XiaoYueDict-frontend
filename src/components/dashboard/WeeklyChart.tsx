'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WeeklyChartDataPoint } from '@/lib/dashboardUtils';

interface WeeklyChartProps {
  data: WeeklyChartDataPoint[];
  /** When true, renders a loading skeleton instead of the chart. */
  isLoading?: boolean;
}

// Deterministic skeleton bar heights to avoid hydration mismatch
// (Math.random() produces different values on server vs client)
const SKELETON_HEIGHTS = [45, 70, 55, 80, 35, 60, 90];

/**
 * Inner chart component loaded only on the client via next/dynamic.
 * This guarantees ResponsiveContainer never runs during SSR where
 * DOM measurements are unavailable (the root cause of the width(-1) warning).
 */
const WeeklyChartInner = dynamic(
  () => import('./WeeklyChartInner'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

/** Reusable loading skeleton with deterministic heights. */
function ChartSkeleton() {
  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm h-96 animate-pulse">
      <div className="h-4 w-56 bg-hover-bg rounded mb-6" />
      <div className="flex items-end gap-3 h-52 px-4">
        {SKELETON_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-hover-bg rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Weekly vocabulary bar chart with Recharts.
 * Today's bar is highlighted using the isToday flag on each data point.
 */
export default function WeeklyChart({ data, isLoading = false }: WeeklyChartProps) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  return <WeeklyChartInner data={data} />;
}
