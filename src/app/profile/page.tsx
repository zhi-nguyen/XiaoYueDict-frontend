"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { updateUserProfile, changeUserPassword } from '@/lib/api/users';
import { getSubscriptionHistory, SubscriptionHistoryItem } from '@/lib/api/subscriptions';
import { getStudyHistory, StudyHistoryResponse } from '@/lib/api/gamification';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ImageCropper from '@/components/profile/ImageCropper';

// We need a helper to generate dates for heatmap
const shiftDate = (date: Date, numDays: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + numDays);
  return newDate;
};

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { tier } = useSubscriptionStore();
  
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'stats' | 'subs'>('info');

  // Avatar upload states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Forms state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // History states
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [studyHistory, setStudyHistory] = useState<{date: string, count: number}[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || ''
      });
      if (user.avatar) {
        setPreviewAvatar(user.avatar);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'subs' && subHistory.length === 0) {
      getSubscriptionHistory().then(data => setSubHistory(data)).catch(console.error);
    }
    if (activeTab === 'stats' && studyHistory.length === 0) {
      getStudyHistory().then(data => {
        // Map history to { date, count }
        const mapped = data.map(item => ({
          date: item.study_date,
          count: item.vocabulary_learned
        }));
        setStudyHistory(mapped);
      }).catch(console.error);
    }
  }, [activeTab]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setSelectedImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedBlob: Blob) => {
    setAvatarBlob(croppedBlob);
    setPreviewAvatar(URL.createObjectURL(croppedBlob));
    setSelectedImageSrc(null); // Close modal
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('bio', formData.bio);
      if (avatarBlob) {
        formDataToSend.append('avatar', avatarBlob, 'avatar.jpg');
      }

      const res = await updateUserProfile(formDataToSend);
      updateProfile(res);
      setIsEditingInfo(false);
      alert("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    try {
      await changeUserPassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      alert("Đổi mật khẩu thành công!");
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      alert(err.response?.data?.old_password?.[0] || "Đổi mật khẩu thất bại!");
    }
  };

  const tabs = [
    { id: 'info', label: 'Thông tin cá nhân', icon: 'person' },
    { id: 'security', label: 'Bảo mật', icon: 'lock' },
    { id: 'stats', label: 'Thống kê', icon: 'monitoring' },
    { id: 'subs', label: 'Gói đăng ký', icon: 'stars' },
  ] as const;

  if (!user) return null;

  return (
    <>
      <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-16">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <h1 className="text-2xl font-lexend font-bold text-primary tracking-tight mb-6">Hồ sơ cá nhân</h1>
            <nav className="flex flex-col gap-1">
              {tabs.map(tab => (
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
            
            {/* Tab: Thông tin cá nhân */}
            {activeTab === 'info' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative group">
                    <label htmlFor="avatar-upload" className="cursor-pointer relative w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/50 transition-all">
                      {previewAvatar ? (
                        <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.username.substring(0, 2).toUpperCase()
                      )}
                      {isEditingInfo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-white">photo_camera</span>
                        </div>
                      )}
                    </label>
                    <input 
                      id="avatar-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={onFileChange} 
                      disabled={!isEditingInfo}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primary">{user.username}</h2>
                    <p className="text-secondary">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface border border-outline text-xs font-bold text-primary">
                      Gói hiện tại: <span className="text-yellow-600 uppercase tracking-wider">{tier || 'Free'}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">Họ (Last Name)</label>
                      <input 
                        type="text" 
                        disabled={!isEditingInfo}
                        value={formData.last_name}
                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none disabled:opacity-50 text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1">Tên (First Name)</label>
                      <input 
                        type="text" 
                        disabled={!isEditingInfo}
                        value={formData.first_name}
                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none disabled:opacity-50 text-sm text-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">Tiểu sử (Bio)</label>
                    <textarea 
                      disabled={!isEditingInfo}
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none disabled:opacity-50 text-sm text-primary min-h-[100px]"
                    />
                  </div>
                  
                  <div className="pt-4">
                    {isEditingInfo ? (
                      <div className="flex gap-2">
                        <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90">Lưu thay đổi</button>
                        <button type="button" onClick={() => setIsEditingInfo(false)} className="px-6 py-2.5 bg-surface text-primary border border-outline rounded-full font-bold text-sm hover:bg-hover-bg">Hủy</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setIsEditingInfo(true)} className="px-6 py-2.5 bg-surface text-primary border border-outline rounded-full font-bold text-sm hover:bg-hover-bg flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa hồ sơ
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Bảo mật */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 max-w-md">
                <h3 className="text-xl font-bold text-primary mb-6">Đổi mật khẩu</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      required
                      value={passwordData.old_password}
                      onChange={e => setPasswordData({...passwordData, old_password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      required
                      value={passwordData.new_password}
                      onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      required
                      value={passwordData.confirm_password}
                      onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
                    />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90">Cập nhật mật khẩu</button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Thống kê */}
            {activeTab === 'stats' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-bold text-primary mb-2">Lịch sử học tập (Heatmap)</h3>
                <p className="text-secondary text-sm mb-6">Theo dõi tần suất và mức độ chăm chỉ của bạn qua từng ngày.</p>
                
                <div className="w-full max-w-3xl overflow-x-auto">
                  <div className="min-w-[700px]">
                    <CalendarHeatmap
                      startDate={shiftDate(new Date(), -150)}
                      endDate={new Date()}
                      values={studyHistory}
                      classForValue={(value) => {
                        if (!value) {
                          return 'color-empty';
                        }
                        return `color-github-${Math.min(value.count, 4)}`;
                      }}
                      tooltipDataAttrs={(value: any) => {
                        return {
                          'data-tip': `${value?.date || 'Không có dữ liệu'} có ${value?.count || 0} từ được học`,
                        } as any;
                      }}
                      showWeekdayLabels={true}
                    />
                  </div>
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                  .react-calendar-heatmap .color-empty { fill: #f0f0f0; }
                  .react-calendar-heatmap .color-github-1 { fill: #d6e685; }
                  .react-calendar-heatmap .color-github-2 { fill: #8cc665; }
                  .react-calendar-heatmap .color-github-3 { fill: #44a340; }
                  .react-calendar-heatmap .color-github-4 { fill: #1e6823; }
                  .react-calendar-heatmap rect { rx: 2; ry: 2; }
                `}} />
              </div>
            )}

            {/* Tab: Lịch sử đăng ký */}
            {activeTab === 'subs' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xl font-bold text-primary mb-6">Lịch sử bản đăng ký</h3>
                {subHistory.length === 0 ? (
                  <div className="text-center py-10 bg-surface rounded-xl border border-outline border-dashed">
                    <span className="material-symbols-outlined text-4xl text-secondary/50 mb-2">history</span>
                    <p className="text-secondary font-medium">Chưa có lịch sử giao dịch nào.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-primary">
                      <thead className="text-xs uppercase bg-surface text-secondary">
                        <tr>
                          <th className="px-6 py-3 rounded-tl-xl">Ngày</th>
                          <th className="px-6 py-3">Hành động</th>
                          <th className="px-6 py-3">Gói</th>
                          <th className="px-6 py-3 rounded-tr-xl">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subHistory.map((item) => (
                          <tr key={item.id} className="border-b border-outline hover:bg-hover-bg transition-colors">
                            <td className="px-6 py-4">{new Date(item.changed_at).toLocaleDateString('vi-VN')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                item.action === 'UPGRADE' ? 'bg-green-100 text-green-700' :
                                item.action === 'DOWNGRADE' ? 'bg-orange-100 text-orange-700' :
                                item.action === 'RENEW' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-primary">{item.tier}</td>
                            <td className="px-6 py-4 text-secondary">{item.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Cropper Modal */}
      {selectedImageSrc && (
        <ImageCropper 
          imageSrc={selectedImageSrc} 
          onCropComplete={onCropComplete} 
          onCancel={() => setSelectedImageSrc(null)} 
        />
      )}
    </>
  );
}
