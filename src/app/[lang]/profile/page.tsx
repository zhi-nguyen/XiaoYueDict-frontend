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
      <div className="w-full p-4 md:p-8 pb-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <h1 className="text-2xl font-lexend font-bold text-primary tracking-tight mb-6">Hồ sơ cá nhân</h1>
            <nav className="flex flex-col gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-secondary hover:bg-hover-bg hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white border border-outline rounded-2xl p-6 md:p-8 shadow-sm">
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
