"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import UserAvatarContainer from '@/components/UserAvatarContainer';

interface RewardItem {
  id: string;
  name: string;
  reward_type: 'avatar_frame' | 'title' | 'bonus_coins' | 'item' | 'badge';
  description: string;
  image_url: string;
  title_text: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  ui_metadata?: any;
}

interface InventoryItem {
  id: string;
  reward_item: RewardItem;
  quantity: number;
  is_equipped: boolean;
  acquired_at: string;
}

export default function InventoryTab() {
  const { user, updateProfile } = useAuthStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      const response = await apiClient.get('/gamification/inventory/');
      setItems(response.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEquip = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      // Toggle equip / unequip state
      await apiClient.post(`/gamification/inventory/${itemId}/equip/`);
      
      // 1. Refresh inventory UI
      await fetchInventory();

      // 2. Fetch updated user profile to sync equipped items globally (Header, etc.)
      const profileRes = await apiClient.get('/users/profile');
      updateProfile(profileRes.data);
    } catch (err) {
      console.error('Failed to equip item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-secondary">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm">Đang tải kho đồ...</p>
      </div>
    );
  }

  const frames = items.filter(item => item.reward_item.reward_type === 'avatar_frame');
  const titles = items.filter(item => item.reward_item.reward_type === 'title');

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'Huyền thoại';
      case 'epic': return 'Sử thi';
      case 'rare': return 'Hiếm';
      default: return 'Phổ thông';
    }
  };

  return (
    <div className="flex flex-col gap-8 font-lexend">
      {/* Intro */}
      <div>
        <h2 className="text-xl font-bold text-primary">Kho đồ & Trang bị</h2>
        <p className="text-sm text-secondary mt-1">Trang bị các khung ảnh đại diện và danh hiệu tu tiên bạn đã nhận được khi thăng cấp.</p>
      </div>

      {/* Avatar Frames Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-md font-bold text-primary flex items-center gap-2 border-b border-outline pb-2">
          <span className="material-symbols-outlined text-[20px] text-primary">face</span>
          Khung đại diện
        </h3>

        {frames.length === 0 ? (
          <div className="py-8 text-center text-sm text-secondary bg-hover-bg rounded-2xl border border-dashed border-outline">
            Chưa sở hữu khung đại diện nào. Hãy tích lũy EXP để thăng cấp và nhận thưởng!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {frames.map(item => {
              const previewFrameUser = {
                ...user,
                equipped_frame: item.reward_item
              };
              const lineBorderClass = item.is_equipped ? 'border-primary/20' : 'border-slate-200';

              return (
                <div 
                  key={item.id} 
                  className={`grid grid-cols-[1fr_120px] md:grid-cols-[1fr_130px] border rounded-2xl overflow-hidden transition-all duration-300 ${
                    item.is_equipped 
                      ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/5' 
                      : 'border-slate-200 hover:border-slate-350 bg-white hover:shadow-lg hover:shadow-slate-100/50'
                  }`}
                >
                  {/* Column 1: Left */}
                  <div className="flex flex-col">
                    {/* Top Cell: Avatar */}
                    <div className={`border-b ${lineBorderClass} flex items-center justify-center p-4 min-h-[96px] bg-slate-50/30`}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                        <UserAvatarContainer 
                          user={previewFrameUser} 
                          sizeClass="w-full h-full" 
                        />
                      </div>
                    </div>
                    {/* Bottom Cell: Frame Name */}
                    <div className="flex-1 flex items-center p-3 text-xs md:text-sm font-bold text-slate-800 bg-white">
                      {item.reward_item.name}
                    </div>
                  </div>

                  {/* Column 2: Right */}
                  <div className="flex flex-col">
                    {/* Top Cell: Action Button */}
                    <div className="flex-1 flex items-center justify-center p-4 min-h-[96px] bg-white">
                      <button
                        onClick={() => handleEquip(item.id)}
                        disabled={actionLoading !== null}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all shrink-0 border ${
                          item.is_equipped
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                            : 'bg-primary text-white border-primary hover:bg-primary-hover shadow-sm'
                        }`}
                      >
                        {actionLoading === item.id 
                          ? 'Đang xử lý...' 
                          : item.is_equipped ? 'Tháo ra' : 'Trang bị'
                        }
                      </button>
                    </div>
                    {/* Bottom Cell: Rarity Badge */}
                    <div className="flex items-center justify-center p-3 bg-white">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRarityBadgeColor(item.reward_item.rarity)}`}>
                        {getRarityText(item.reward_item.rarity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Titles Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-md font-bold text-primary flex items-center gap-2 border-b border-outline pb-2">
          <span className="material-symbols-outlined text-[20px] text-primary">military_tech</span>
          Danh hiệu tu tiên
        </h3>

        {titles.length === 0 ? (
          <div className="py-8 text-center text-sm text-secondary bg-hover-bg rounded-2xl border border-dashed border-outline">
            Chưa sở hữu danh hiệu nào. Hãy thăng cấp để gia tăng tu vi và nhận phong hiệu!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {titles.map(item => {
              const titleStyle = item.reward_item.ui_metadata?.style || {};
              const titleText = item.reward_item.ui_metadata?.text || item.reward_item.title_text;
              const lineBorderClass = item.is_equipped ? 'border-primary/20' : 'border-slate-200';

              return (
                <div 
                  key={item.id} 
                  className={`flex flex-col border rounded-2xl overflow-hidden transition-all duration-300 ${
                    item.is_equipped 
                      ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/5' 
                      : 'border-slate-200 hover:border-slate-350 bg-white hover:shadow-lg hover:shadow-slate-100/50'
                  }`}
                >
                  {/* Top section: 2 columns */}
                  <div className={`grid grid-cols-[1fr_120px] md:grid-cols-[1fr_130px] border-b ${lineBorderClass}`}>
                    {/* Top-left: Styled Title Text Display */}
                    <div className="flex items-center justify-center p-4 min-h-[64px] bg-slate-50/30">
                      <span 
                        style={titleStyle} 
                        className="text-base font-black uppercase tracking-widest text-center"
                      >
                        {titleText}
                      </span>
                    </div>
                    {/* Top-right: Action button */}
                    <div className="flex items-center justify-center p-4 bg-white">
                      <button
                        onClick={() => handleEquip(item.id)}
                        disabled={actionLoading !== null}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all shrink-0 border ${
                          item.is_equipped
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                            : 'bg-primary text-white border-primary hover:bg-primary-hover shadow-sm'
                        }`}
                      >
                        {actionLoading === item.id 
                          ? 'Đang xử lý...' 
                          : item.is_equipped ? 'Tháo ra' : 'Trang bị'
                        }
                      </button>
                    </div>
                  </div>

                  {/* Middle section: 2 columns */}
                  <div className={`grid grid-cols-[1fr_120px] md:grid-cols-[1fr_130px] border-b ${lineBorderClass}`}>
                    {/* Middle-left: Name */}
                    <div className="flex items-center p-3 text-xs md:text-sm font-bold text-slate-800 bg-white">
                      {item.reward_item.name}
                    </div>
                    {/* Middle-right: Rarity Badge */}
                    <div className="flex items-center justify-center p-3 bg-white">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRarityBadgeColor(item.reward_item.rarity)}`}>
                        {getRarityText(item.reward_item.rarity)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom section: Full width Description */}
                  <div className="p-3 text-[11px] md:text-xs text-secondary leading-snug bg-slate-50/10 font-inter flex-1 flex items-center">
                    {item.reward_item.description}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
