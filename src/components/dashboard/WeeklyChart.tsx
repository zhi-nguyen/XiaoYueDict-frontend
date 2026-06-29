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

interface WeeklyChartProps {
  data: WeeklyChartDataPoint[];
  /** When true, renders a loading skeleton instead of the chart. */
  isLoading?: boolean;
}

// Bar fill colors — today's bar uses the accent sage color, others use slate
const COLOR_TODAY = '#84a59d';
const COLOR_DEFAULT = '#cbd5e1';

/**
 * Weekly vocabulary bar chart with Recharts.
 * Today's bar is highlighted using the isToday flag on each data point.
 */
export default function WeeklyChart({ data, isLoading = false }: WeeklyChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm h-96 animate-pulse">
        <div className="h-4 w-56 bg-hover-bg rounded mb-6" />
        <div className="flex items-end gap-3 h-52 px-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="flex-1 bg-hover-bg rounded-t"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm h-96">
      <h2 className="font-lexend font-semibold text-primary mb-6">
        Thống kê từ vựng (Tuần này)
      </h2>
      <ResponsiveContainer width="100%" height="100%">
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
  );
}
