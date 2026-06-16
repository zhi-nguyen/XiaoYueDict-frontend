'use client';

import React, { useState } from 'react';
import { changeUserPassword } from '@/lib/api/users';

interface SecurityTabProps {
  onAlert: (config: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
}

/**
 * Security tab: change password form.
 */
export default function SecurityTab({ onAlert }: SecurityTabProps) {
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      onAlert({
        title: 'Lỗi bảo mật',
        message: 'Mật khẩu mới không khớp!',
        type: 'error'
      });
      return;
    }
    try {
      await changeUserPassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      onAlert({
        title: 'Thành công',
        message: 'Đổi mật khẩu thành công!',
        type: 'success'
      });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      onAlert({
        title: 'Lỗi',
        message: err.response?.data?.old_password?.[0] || 'Đổi mật khẩu thất bại!',
        type: 'error'
      });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 max-w-md">
      <h3 className="text-xl font-bold text-primary mb-6">Đổi mật khẩu</h3>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-primary mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            required
            value={passwordData.old_password}
            onChange={e => setPasswordData({ ...passwordData, old_password: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-primary mb-1">Mật khẩu mới</label>
          <input
            type="password"
            required
            value={passwordData.new_password}
            onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-primary mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            required
            value={passwordData.confirm_password}
            onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
          />
        </div>
        <div className="pt-4">
          <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90">Cập nhật mật khẩu</button>
        </div>
      </form>
    </div>
  );
}
