"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { updateUserProfile } from '@/lib/api/users';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import SecurityTab from '@/components/profile/SecurityTab';
import StudyStatsTab from '@/components/profile/StudyStatsTab';
import SubscriptionHistoryTab from '@/components/profile/SubscriptionHistoryTab';
import AlertModal from '@/components/AlertModal';
import { getErrorMessage } from '@/lib/errorHelper';
import { CommunityManageTab } from '@/components/profile/CommunityManageTab';
import InventoryTab from '@/components/profile/InventoryTab';

type ProfileTab = 'info' | 'inventory' | 'security' | 'stats' | 'subs' | 'community';

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: 'info', label: 'Thông tin cá nhân', icon: 'person' },
  { id: 'inventory', label: 'Kho đồ & Trang bị', icon: 'inventory_2' },
  { id: 'security', label: 'Bảo mật', icon: 'lock' },
  { id: 'stats', label: 'Thống kê', icon: 'monitoring' },
  { id: 'subs', label: 'Gói đăng ký', icon: 'stars' },
  { id: 'community', label: 'Hoạt động Cộng đồng', icon: 'groups' },
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { tier } = useSubscriptionStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'subs') {
        setActiveTab('subs');
      }
    }
  }, []);

  if (!user) return null;

  const handleAlert = (config: { title: string; message: string; type: 'success' | 'error' | 'info' }) => {
    setAlertConfig({ ...config, isOpen: true });
  };

  const handleUpdateProfile = async (formData: FormData) => {
    try {
      const res = await updateUserProfile(formData);
      updateProfile(res);
      handleAlert({ title: 'Thành công', message: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (err) {
      console.error(err);
      handleAlert({ title: 'Lỗi', message: getErrorMessage(err), type: 'error' });
    }
  };

  return (
    <>
      <div className="w-full p-4 md:p-8 pb-24 md:pb-16 font-lexend">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          
          {/* Header & Horizontal Navigation */}
          <div className="flex flex-col gap-4 border-b border-outline pb-5">
            <h1 className="text-3xl font-bold text-primary tracking-tight">Hồ sơ cá nhân</h1>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-1 py-2 flex justify-around shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] md:relative md:bottom-auto md:left-auto md:right-auto md:bg-transparent md:p-0 md:border-none md:shadow-none md:z-auto md:flex md:flex-row md:flex-wrap md:gap-2 md:justify-start">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const shortLabel = tab.label === 'Hoạt động Cộng đồng' ? 'Cộng đồng' 
                                 : tab.label === 'Kho đồ & Trang bị' ? 'Kho đồ' 
                                 : tab.label === 'Thông tin cá nhân' ? 'Cá nhân' 
                                 : tab.label === 'Gói đăng ký' ? 'Đăng ký' 
                                 : tab.label;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-1.5 px-0.5 md:px-5 md:py-2.5 rounded-xl md:rounded-full transition-all duration-200 flex-1 md:flex-none text-center ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/10 scale-[1.01]'
                        : 'text-secondary hover:bg-hover-bg hover:text-primary'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg md:text-[20px] ${isActive ? 'filled' : ''}`}>{tab.icon}</span>
                    <span className="text-[9px] md:text-sm font-semibold font-lexend block tracking-tight line-clamp-1">
                      {shortLabel}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="bg-white border border-outline rounded-3xl p-6 md:p-8 shadow-sm">
            {activeTab === 'info' && (
              <ProfileInfoTab user={user} tier={tier} onUpdateProfile={handleUpdateProfile} />
            )}
            {activeTab === 'inventory' && (
              <InventoryTab />
            )}
            {activeTab === 'security' && (
              <SecurityTab onAlert={handleAlert} />
            )}
            {activeTab === 'stats' && (
              <StudyStatsTab />
            )}
            {activeTab === 'subs' && (
              <SubscriptionHistoryTab />
            )}
            {activeTab === 'community' && (
              <div className="w-full">
                <CommunityManageTab lang="zh" />
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
