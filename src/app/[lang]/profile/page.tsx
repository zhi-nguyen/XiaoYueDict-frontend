"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { updateUserProfile } from '@/lib/api/users';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import SecurityTab from '@/components/profile/SecurityTab';
import StudyStatsTab from '@/components/profile/StudyStatsTab';
import SubscriptionHistoryTab from '@/components/profile/SubscriptionHistoryTab';
import AlertModal from '@/components/AlertModal';

type ProfileTab = 'info' | 'security' | 'stats' | 'subs';

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: 'info', label: 'Thông tin cá nhân', icon: 'person' },
  { id: 'security', label: 'Bảo mật', icon: 'lock' },
  { id: 'stats', label: 'Thống kê', icon: 'monitoring' },
  { id: 'subs', label: 'Gói đăng ký', icon: 'stars' },
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
      handleAlert({ title: 'Lỗi', message: 'Có lỗi xảy ra khi cập nhật!', type: 'error' });
    }
  };

  return (
    <>
      <div className="w-full p-4 md:p-8 pb-16 font-lexend">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          
          {/* Header & Horizontal Navigation */}
          <div className="flex flex-col gap-4 border-b border-outline pb-5">
            <h1 className="text-3xl font-bold text-primary tracking-tight">Hồ sơ cá nhân</h1>
            <nav className="flex flex-wrap gap-2">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/10 scale-[1.01]'
                        : 'text-secondary hover:bg-hover-bg hover:text-primary'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>{tab.icon}</span>
                    {tab.label}
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
            {activeTab === 'security' && (
              <SecurityTab onAlert={handleAlert} />
            )}
            {activeTab === 'stats' && (
              <StudyStatsTab />
            )}
            {activeTab === 'subs' && (
              <SubscriptionHistoryTab />
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
