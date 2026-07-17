'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/mediaUtils';
import UserAvatarContainer from '@/components/UserAvatarContainer';

interface LeaderboardEntry {
  rank: number;
  score: number;
  username: string;
  avatar_url: string;
  user: string;
  equipped_frame?: any;
  equipped_title?: any;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  myEntry: any | null;
  scoreLabel: string;
  iconName: string;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ entries, myEntry, scoreLabel, iconName }) => {
  const { user: currentUser } = useAuthStore();

  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  // Tìm thông tin Rank 1, 2, 3
  const rank1 = top3.find(e => e.rank === 1);
  const rank2 = top3.find(e => e.rank === 2);
  const rank3 = top3.find(e => e.rank === 3);

  const isUserInTop3 = top3.some(e => e.user === currentUser?.id);
  const isUserInRemaining = remaining.some(e => e.user === currentUser?.id);
  const isUserInTop = isUserInTop3 || isUserInRemaining;

  const renderMedalOrNumber = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="flex flex-col gap-8 w-full text-[#0b1c30] font-inter">
      {/* 🏆 ASYMMETRIC PODIUM SECTION (TOP 3) */}
      {top3.length > 0 && (
        <div className="w-full max-w-4xl mx-auto">
          {/* PC Podium Layout (md:flex hidden) */}
          <div className="hidden md:flex items-end justify-center gap-6 pt-10 pb-4">
            {/* Rank 2 (Left) */}
            {rank2 && (
              <div className="flex flex-col justify-end w-1/3 max-w-[240px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] relative hover:translate-y-[-4px] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden text-center shadow-sm">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-bl-full -mr-6 -mt-6"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-3">
                      <UserAvatarContainer
                        user={{
                          avatar: rank2.avatar_url,
                          username: rank2.username,
                          equipped_frame: rank2.equipped_frame,
                        }}
                        sizeClass="w-16 h-16"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center border border-white shadow text-[10px] font-bold text-slate-800 z-20">
                        2
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-sm font-bold text-[#1d2b3e] truncate w-full">{rank2.username}</h3>
                    {rank2.equipped_title && (
                      <span className="inline-block px-2 py-0.5 mt-1 bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 rounded-full truncate max-w-full">
                        {rank2.equipped_title.title_text || rank2.equipped_title.name}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2 mt-1">Thứ 2</p>
                    <div className="flex items-center gap-1 font-bold text-base text-[#1d2b3e]">
                      <span>{rank2.score.toLocaleString()}</span>
                      <span className="material-symbols-outlined text-slate-400 text-sm">{iconName}</span>
                    </div>
                  </div>
                </div>
                {/* Column Base */}
                <div className="w-full h-12 bg-slate-200/50 border border-t-0 border-[#E2E8F0] rounded-b-2xl"></div>
              </div>
            )}

            {/* Rank 1 (Middle - Scaled and Premium) */}
            {rank1 && (
              <div className="flex flex-col justify-end w-1/3 max-w-[260px] transform scale-105 z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white rounded-2xl p-8 border-2 border-[#6366F1] relative hover:translate-y-[-4px] hover:shadow-[0_20px_35px_-8px_rgba(99,102,241,0.15)] transition-all duration-300 overflow-hidden text-center shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 to-[#8B5CF6]/5"></div>
                  <div className="absolute top-2 right-2 animate-pulse">
                    <span className="material-symbols-outlined text-[24px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-4">
                      <UserAvatarContainer
                        user={{
                          avatar: rank1.avatar_url,
                          username: rank1.username,
                          equipped_frame: rank1.equipped_frame,
                        }}
                        sizeClass="w-20 h-20"
                      />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center border border-white shadow-md text-xs font-bold text-white z-20">
                        1
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-base font-bold text-[#1d2b3e] truncate w-full">{rank1.username}</h3>
                    {rank1.equipped_title && (
                      <span className="inline-block px-2 py-0.5 mt-1 bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 rounded-full truncate max-w-full z-20">
                        {rank1.equipped_title.title_text || rank1.equipped_title.name}
                      </span>
                    )}
                    <p className="text-[10px] text-[#6366F1] font-black uppercase mb-3 tracking-widest mt-1">Quán Quân</p>
                    <div className="bg-[#1d2b3e] text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                      <span className="font-bold text-sm">{rank1.score.toLocaleString()}</span>
                      <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
                    </div>
                  </div>
                </div>
                {/* Column Base */}
                <div className="w-full h-20 bg-slate-300/40 border border-t-0 border-[#E2E8F0] rounded-b-2xl"></div>
              </div>
            )}

            {/* Rank 3 (Right) */}
            {rank3 && (
              <div className="flex flex-col justify-end w-1/3 max-w-[240px] animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] relative hover:translate-y-[-4px] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden text-center shadow-sm">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#503D1E]/5 rounded-bl-full -mr-6 -mt-6"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-3">
                      <UserAvatarContainer
                        user={{
                          avatar: rank3.avatar_url,
                          username: rank3.username,
                          equipped_frame: rank3.equipped_frame,
                        }}
                        sizeClass="w-16 h-16"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-300 rounded-full flex items-center justify-center border border-white shadow text-[10px] font-bold text-orange-850 z-20">
                        3
                      </div>
                    </div>
                    <h3 className="font-headline-sm text-sm font-bold text-[#1d2b3e] truncate w-full">{rank3.username}</h3>
                    {rank3.equipped_title && (
                      <span className="inline-block px-2 py-0.5 mt-1 bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 rounded-full truncate max-w-full">
                        {rank3.equipped_title.title_text || rank3.equipped_title.name}
                      </span>
                    )}
                    <p className="text-[10px] text-orange-500 font-semibold uppercase tracking-wider mb-2 mt-1">Thứ 3</p>
                    <div className="flex items-center gap-1 font-bold text-base text-[#1d2b3e]">
                      <span>{rank3.score.toLocaleString()}</span>
                      <span className="material-symbols-outlined text-slate-400 text-sm">{iconName}</span>
                    </div>
                  </div>
                </div>
                {/* Column Base */}
                <div className="w-full h-8 bg-slate-200/30 border border-t-0 border-[#E2E8F0] rounded-b-2xl"></div>
              </div>
            )}
          </div>

          {/* Mobile Podium Layout (md:hidden) */}
          <div className="flex md:hidden items-end justify-center gap-2 pt-12 pb-4">
            {/* Rank 2 */}
            {rank2 && (
              <div className="flex flex-col items-center w-1/3">
                <div className="relative mb-3">
                  <div className="relative">
                    <UserAvatarContainer
                      user={{
                        avatar: rank2.avatar_url,
                        username: rank2.username,
                        equipped_frame: rank2.equipped_frame,
                      }}
                      sizeClass="w-14 h-14"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center border border-white text-[9px] font-bold text-slate-800 z-20">
                      2
                    </div>
                  </div>
                </div>
                <div className="text-center flex flex-col items-center">
                  <p className="text-xs font-semibold text-on-surface truncate w-20">{rank2.username}</p>
                  {rank2.equipped_title && (
                    <span className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-bold max-w-[70px] truncate block">
                      {rank2.equipped_title.title_text || rank2.equipped_title.name}
                    </span>
                  )}
                  <p className="text-[11px] text-[#1d2b3e] font-bold mt-0.5">{rank2.score.toLocaleString()}</p>
                </div>
                <div className="w-full h-16 bg-[#e5eeff] rounded-t-xl mt-2 flex items-center justify-center border border-[#E2E8F0] border-b-0">
                  <span className="material-symbols-outlined text-slate-400/40" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {rank1 && (
              <div className="flex flex-col items-center w-1/3 z-10 -mt-6">
                <div className="relative mb-3 scale-105">
                  <div className="relative">
                    <UserAvatarContainer
                      user={{
                        avatar: rank1.avatar_url,
                        username: rank1.username,
                        equipped_frame: rank1.equipped_frame,
                      }}
                      sizeClass="w-16 h-16"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border border-white shadow text-[10px] font-bold text-white z-20">
                      1
                    </div>
                  </div>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="material-symbols-outlined text-amber-500 scale-125" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  </div>
                </div>
                <div className="text-center flex flex-col items-center">
                  <p className="text-xs font-bold text-[#1d2b3e] truncate w-24">{rank1.username}</p>
                  {rank1.equipped_title && (
                    <span className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-bold max-w-[80px] truncate block">
                      {rank1.equipped_title.title_text || rank1.equipped_title.name}
                    </span>
                  )}
                  <p className="text-xs text-amber-600 font-extrabold mt-0.5">{rank1.score.toLocaleString()}</p>
                </div>
                <div className="w-full h-24 bg-[#eff4ff] rounded-t-xl mt-2 flex items-center justify-center border border-[#E2E8F0] border-b-0">
                  <span className="material-symbols-outlined text-[#6366F1]/30" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {rank3 && (
              <div className="flex flex-col items-center w-1/3">
                <div className="relative mb-3">
                  <div className="relative">
                    <UserAvatarContainer
                      user={{
                        avatar: rank3.avatar_url,
                        username: rank3.username,
                        equipped_frame: rank3.equipped_frame,
                      }}
                      sizeClass="w-14 h-14"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-300 rounded-full flex items-center justify-center border border-white text-[9px] font-bold text-orange-850 z-20">
                      3
                    </div>
                  </div>
                </div>
                <div className="text-center flex flex-col items-center">
                  <p className="text-xs font-semibold text-on-surface truncate w-20">{rank3.username}</p>
                  {rank3.equipped_title && (
                    <span className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-bold max-w-[70px] truncate block">
                      {rank3.equipped_title.title_text || rank3.equipped_title.name}
                    </span>
                  )}
                  <p className="text-[11px] text-[#1d2b3e] font-bold mt-0.5">{rank3.score.toLocaleString()}</p>
                </div>
                <div className="w-full h-12 bg-[#e5eeff] rounded-t-xl mt-2 flex items-center justify-center border border-[#E2E8F0] border-b-0">
                  <span className="material-symbols-outlined text-slate-400/40" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📋 LIST VIEW (RANK 4+) */}
      {remaining.length > 0 && (
        <section className="w-full max-w-4xl mx-auto space-y-3">
          {remaining.map((entry) => {
            const isMe = entry.user === currentUser?.id;
            return (
              <div 
                key={entry.rank}
                className={`flex items-center bg-white p-4 rounded-2xl shadow-sm border transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.06)] ${
                  isMe 
                    ? 'border-[#6366F1] ring-2 ring-[#6366F1]/10 bg-indigo-50/5' 
                    : 'border-[#E2E8F0]'
                }`}
              >
                {/* Hạng */}
                <span className={`w-8 font-bold text-sm ${isMe ? 'text-[#6366F1]' : 'text-slate-500'}`}>
                  {entry.rank}
                </span>

                {/* Avatar */}
                <div className="mx-3 flex-shrink-0">
                  <UserAvatarContainer
                    user={{
                      avatar: entry.avatar_url,
                      username: entry.username,
                      equipped_frame: entry.equipped_frame,
                    }}
                    sizeClass="w-10 h-10"
                  />
                </div>

                {/* Tên & Status */}
                <div className="flex-grow min-w-0">
                  <h3 className={`text-xs font-bold truncate flex items-center flex-wrap gap-1.5 ${isMe ? 'text-[#6366F1]' : 'text-[#0b1c30]'}`}>
                    {entry.username}
                    {isMe && <span className="text-[9px] bg-indigo-100 text-[#6366F1] px-1.5 py-0.5 rounded-full font-normal">Bạn</span>}
                    {entry.equipped_title && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                        {entry.equipped_title.title_text || entry.equipped_title.name}
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-inter">
                    {isMe ? 'Hãy tiếp tục cố gắng thăng hạng!' : `Rank #${entry.rank} Scholar`}
                  </p>
                </div>

                {/* Điểm */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 font-bold text-sm text-[#1d2b3e]">
                    <span>{entry.score.toLocaleString()}</span>
                    <span className="material-symbols-outlined text-slate-400 text-base">{iconName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 🚀 FLOAT YOU CARD (WHEN OUTSIDE TOP 50) */}
      {!isUserInTop && myEntry && (
        <section className="w-full max-w-4xl mx-auto mt-4">
          <div className="bg-[#1d2b3e] text-white p-4 rounded-2xl shadow-lg border-2 border-[#1d2b3e] hover:translate-y-[-2px] transition-all flex justify-between items-center ring-4 ring-[#1d2b3e]/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs font-inter text-[#c4ebd9]">
                {myEntry.rank || '-'}
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0">
                  <UserAvatarContainer
                    user={{
                      avatar: myEntry.avatar_url,
                      username: myEntry.username,
                      equipped_frame: myEntry.equipped_frame,
                    }}
                    sizeClass="w-9 h-9"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white font-lexend flex items-center flex-wrap gap-1.5">
                    {myEntry.username}
                    <span className="text-[9px] bg-white/20 text-[#c4ebd9] px-1.5 py-0.5 rounded-full font-normal">Bạn</span>
                    {myEntry.equipped_title && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        {myEntry.equipped_title.title_text || myEntry.equipped_title.name}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-300 font-inter">Ngoài Top 50 bảng xếp hạng</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm font-bold text-white">
              <span>{myEntry.score.toLocaleString()}</span>
              <span className="material-symbols-outlined text-[#c4ebd9] text-base">{iconName}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
export default LeaderboardTable;
