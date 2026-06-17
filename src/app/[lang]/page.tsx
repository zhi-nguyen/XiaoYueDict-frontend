"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import WelcomeBanner from '@/components/home/WelcomeBanner';
import StatsGrid from '@/components/home/StatsGrid';
import QuickActions from '@/components/home/QuickActions';

export default function HomePage() {
  const params = useParams();
  const language = (params?.lang as string) || 'zh';

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-16">
      <div className="max-w-[1280px] mx-auto space-y-8">
        <WelcomeBanner language={language} />
        <StatsGrid language={language} />
        <QuickActions language={language} />
      </div>
    </div>
  );
}

