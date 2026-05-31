"use client";

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { getActivities } from '@/lib/api/gamification';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { currentStreak, maxStreak } = useGamificationStore();
  const { tier } = useSubscriptionStore();
  
  // Dummy data for the chart since the backend doesn't currently provide aggregated stats endpoint
  // In a real scenario, we would fetch this from a new endpoint like /api/v1/gamification/stats/
  const chartData = [
    { name: 'T2', words: 12 },
    { name: 'T3', words: 19 },
    { name: 'T4', words: 3 },
    { name: 'T5', words: 5 },
    { name: 'T6', words: 2 },
    { name: 'T7', words: 20 },
    { name: 'CN', words: 10 },
  ];

  // Daily target dummy data (assume 10 words target)
  const targetWords = 10;
  const currentWords = 7;
  const progressPercentage = Math.min((currentWords / targetWords) * 100, 100);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scroll">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-lexend font-bold text-primary tracking-tight">Tổng quan học tập</h1>
            <p className="text-secondary mt-2">Theo dõi tiến độ và thành tựu của bạn, {user?.username}!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Daily Target Ring */}
            <div className="bg-white border border-outline rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
              <h2 className="font-lexend font-semibold text-primary mb-6 w-full text-left">Mục tiêu hôm nay</h2>
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-hover-bg"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-sage transition-all duration-1000 ease-in-out"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * progressPercentage) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-primary">{currentWords}</span>
                  <span className="text-xs text-secondary uppercase tracking-wider font-semibold">/ {targetWords} Từ</span>
                </div>
              </div>
              <p className="mt-6 text-sm text-secondary text-center">Bạn đã hoàn thành <span className="font-bold text-primary">{progressPercentage}%</span> mục tiêu</p>
            </div>

            {/* Streak & Subscription Status */}
            <div className="flex flex-col gap-6">
              {/* Streak Card */}
              <div className="bg-white border border-outline rounded-2xl p-6 flex items-center justify-between shadow-sm flex-1">
                <div>
                  <h2 className="font-lexend font-semibold text-primary mb-1">Chuỗi ngày học</h2>
                  <p className="text-sm text-secondary mb-4">Duy trì ngọn lửa!</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-orange">{currentStreak}</span>
                    <span className="text-sm font-semibold text-secondary uppercase">Ngày</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${currentStreak > 0 ? 'bg-orange/10' : 'bg-hover-bg'}`}>
                  <span className={`material-symbols-outlined text-4xl ${currentStreak > 0 ? 'text-orange filled' : 'text-secondary/30'}`}>local_fire_department</span>
                </div>
              </div>

              {/* Max Streak Card */}
              <div className="bg-white border border-outline rounded-2xl p-6 flex items-center justify-between shadow-sm flex-1">
                <div>
                  <h2 className="font-lexend font-semibold text-primary mb-1">Kỷ lục Chuỗi</h2>
                  <p className="text-sm text-secondary mb-4">Thành tích cao nhất</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{maxStreak}</span>
                    <span className="text-sm font-semibold text-secondary uppercase">Ngày</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-blue-500 filled">emoji_events</span>
                </div>
              </div>
            </div>

            {/* Badges/Achievements (Placeholder) */}
            <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm">
              <h2 className="font-lexend font-semibold text-primary mb-4">Huy hiệu đạt được</h2>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item, idx) => (
                  <div key={item} className="flex flex-col items-center gap-2">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${idx < 3 ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-hover-bg border border-outline border-dashed'}`}>
                      <span className={`material-symbols-outlined text-2xl ${idx < 3 ? 'text-yellow-600 filled' : 'text-secondary/30'}`}>
                        {idx === 0 ? 'workspace_premium' : idx === 1 ? 'school' : idx === 2 ? 'star' : 'lock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bar Chart Section */}
          <div className="bg-white border border-outline rounded-2xl p-6 shadow-sm h-96">
            <h2 className="font-lexend font-semibold text-primary mb-6">Thống kê từ vựng (Tuần này)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="words" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {
                    chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#84a59d' : '#cbd5e1'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}
