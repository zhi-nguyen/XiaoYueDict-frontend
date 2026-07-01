'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { WeeklyChartDataPoint } from '@/lib/dashboardUtils';

interface WeeklyChartInnerProps {
  data: WeeklyChartDataPoint[];
}

// Bar fill colors — today's bar uses the accent sage color, others use slate
const COLOR_TODAY = '#84a59d';
const COLOR_DEFAULT = '#cbd5e1';

/**
 * Pure chart rendering component — always client-only (imported via next/dynamic).
 * Separated so that ResponsiveContainer never executes during SSR.
 */
export default function WeeklyChartInner({ data }: WeeklyChartInnerProps) {
  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm h-96 flex flex-col">
      <h2 className="font-lexend font-semibold text-primary mb-6">
        Thống kê từ vựng (Tuần này)
      </h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [`${value ?? 0} từ`, 'Từ vựng']}
            />
            <Bar dataKey="words" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? COLOR_TODAY : COLOR_DEFAULT}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
