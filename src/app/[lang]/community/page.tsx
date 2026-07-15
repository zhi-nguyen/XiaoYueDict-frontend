'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ForumFeed } from '@/components/community/ForumFeed';
import { LeaderboardPanel } from '@/components/community/LeaderboardPanel';
import { CommunityManageTab } from '@/components/profile/CommunityManageTab';

interface CommunityPageProps {
  params: {
    lang: string;
  };
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = params.lang || 'zh';

  const activeTab = searchParams ? (searchParams.get('tab') || 'feed') : 'feed';

  const changeTab = (tabName: string) => {
    router.push(`/${lang}/community?tab=${tabName}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0b1c30] p-4 sm:p-6 md:p-8 flex flex-col gap-6 font-inter">
      {/* Title Header */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 text-center mt-4">
        <h1 className="text-3xl sm:text-4xl font-black font-lexend text-[#1d2b3e] flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[#426657] text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          Cộng đồng học tập
        </h1>
        <p className="text-xs sm:text-sm text-[#44474c] max-w-lg mx-auto">
          Nơi giao lưu, chia sẻ kinh nghiệm học tập và đua top học thuộc từ vựng cùng các đồng môn.
        </p>
      </div>



      {/* Dynamic Content Rendering */}
      <div className="w-full flex-1">
        {activeTab === 'feed' && (
          <ForumFeed lang={lang} />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardPanel lang={lang} />
        )}
        {activeTab === 'profile' && (
          <div className="w-full max-w-4xl mx-auto bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold font-lexend text-[#1d2b3e] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#426657]">person</span>
              Hoạt động cá nhân của bạn
            </h2>
            <CommunityManageTab lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
