'use client';

import React, { useState, useEffect } from 'react';
import { useCommunityStore } from '@/store/useCommunityStore';
import { LeaderboardTable } from './LeaderboardTable';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AlertModal from '@/components/AlertModal';

interface LeaderboardPanelProps {
  lang: string;
}

type BoardType = 'coin_paid' | 'coin_free' | 'total_likes' | 'weekly_words' | 'max_streak';

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ lang }) => {
  const [activeBoard, setActiveBoard] = useState<BoardType>('weekly_words');

  const leaderboardData = useCommunityStore((state) => state.leaderboard);
  const fetchLeaderboard = useCommunityStore((state) => state.fetchLeaderboard);
  const loading = useCommunityStore((state) => state.loading);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchLeaderboard(activeBoard, lang);
  }, [activeBoard, lang, fetchLeaderboard]);

  const BOARDS = [
    { id: 'weekly_words' as BoardType, label: 'Từ thuộc tuần', icon: 'auto_stories', scoreLabel: 'Từ thuộc', iconName: 'menu_book' },
    { id: 'max_streak' as BoardType, label: 'Streak ngày', icon: 'workspace_premium', scoreLabel: 'Ngày', iconName: 'local_fire_department' },
    { id: 'total_likes' as BoardType, label: 'Lượt thích', icon: 'favorite', scoreLabel: 'Lượt thích', iconName: 'favorite' },
    { id: 'coin_paid' as BoardType, label: lang === 'zh' ? 'Linh thạch (Paid)' : 'Coin (Paid)', icon: 'payments', scoreLabel: 'Tích lũy', iconName: 'monetization_on' },
    { id: 'coin_free' as BoardType, label: lang === 'zh' ? 'Linh thạch (Free)' : 'Coin (Free)', icon: 'toll', scoreLabel: 'Tích lũy', iconName: 'toll' },
  ];

  const currentBoardConfig = BOARDS.find(b => b.id === activeBoard)!;

  const formatSnapshotTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), "HH:mm, 'ngày' dd/MM/yyyy", { locale: vi });
    } catch (e) {
      return '';
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10 text-[#0b1c30]">
      {/* Category Segmented Control Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-[#e5eeff]/45 p-1.5 border border-[#E2E8F0] rounded-2xl w-full md:w-max mx-auto no-scrollbar shadow-sm">
        {BOARDS.map((board) => (
          <button
            key={board.id}
            onClick={() => setActiveBoard(board.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-lexend text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeBoard === board.id
                ? 'bg-[#1d2b3e] text-white shadow-md'
                : 'text-[#44474c] hover:bg-[#F1F5F9]'
            }`}
          >
            <span className="material-symbols-outlined text-base">{board.icon}</span>
            <span>{board.label}</span>
          </button>
        ))}
      </div>

      {/* Snapshot Timing Information Banner */}
      {leaderboardData?.created_at && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-xs text-[#44474c] font-inter shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-base">schedule</span>
            <span>Xếp hạng cập nhật định kỳ mỗi 4 tiếng</span>
          </div>
          <div className="font-bold text-slate-600">
            Cập nhật gần nhất: {formatSnapshotTime(leaderboardData.created_at)}
          </div>
        </div>
      )}

      {/* Table Data */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1d2b3e] rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-inter">Đang tải bảng xếp hạng...</span>
        </div>
      ) : !leaderboardData || leaderboardData.entries.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-2xl p-16 text-center flex flex-col items-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-slate-400 text-4xl">emoji_events</span>
          <h5 className="text-sm font-semibold text-[#1d2b3e] font-lexend">Bảng xếp hạng trống</h5>
          <p className="text-xs text-slate-400 max-w-sm font-inter">
            Chưa có đủ dữ liệu hoạt động của người dùng để xếp hạng cho phân bảng này trong ngày hôm nay.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          <LeaderboardTable
            entries={leaderboardData.entries}
            myEntry={leaderboardData.my_entry}
            scoreLabel={currentBoardConfig.scoreLabel}
            iconName={currentBoardConfig.iconName}
          />
          
          {/* Milestone Motivational Card */}
          {leaderboardData.my_entry && leaderboardData.my_entry.rank > 5 && (
            <div className="bg-[#1d2b3e] p-6 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[40px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider font-inter">Cột mốc tiếp theo</span>
                  <h4 className="text-sm font-bold font-lexend mt-0.5">Tích lũy thêm điểm để vượt qua đối thủ tiếp theo và tiến vào Top 5!</h4>
                </div>
              </div>
              <button 
                onClick={() => setAlertConfig({
                  isOpen: true,
                  type: 'info',
                  title: 'Học ngay cùng XiaoYue',
                  message: 'Hãy tiếp tục học từ vựng và đăng bài thảo luận để tích điểm nhé!'
                })}
                className="bg-white hover:bg-slate-100 text-[#1d2b3e] px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
              >
                <span>Học ngay</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
export default LeaderboardPanel;
