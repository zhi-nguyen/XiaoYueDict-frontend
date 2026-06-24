'use client';

import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface SecurityTabProps {
  onAlert: (config: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
}

/**
 * Security tab: change password form using Firebase Auth directly.
 */
export default function SecurityTab({ onAlert }: SecurityTabProps) {
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, passwordData.new_password);
        onAlert({
          title: 'Thành công',
          message: 'Đổi mật khẩu thành công!',
          type: 'success'
        });
        setPasswordData({ new_password: '', confirm_password: '' });
      } else {
        onAlert({
          title: 'Lỗi',
          message: 'Không tìm thấy thông tin đăng nhập Firebase. Vui lòng đăng nhập lại.',
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error('Password change error', err);
      let msg = 'Đổi mật khẩu thất bại!';
      if (err.code === 'auth/requires-recent-login') {
        msg = 'Hành động này yêu cầu bạn phải vừa mới đăng nhập gần đây. Vui lòng đăng xuất rồi đăng nhập lại để thực hiện đổi mật khẩu.';
      } else if (err.message) {
        msg = err.message;
      }
      onAlert({
        title: 'Lỗi',
        message: msg,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 max-w-md">
      <h3 className="text-xl font-bold text-primary mb-6">Đổi mật khẩu</h3>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-primary mb-1">Mật khẩu mới</label>
          <input
            type="password"
            required
            value={passwordData.new_password}
            onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface border border-outline rounded-xl focus:border-sage focus:outline-none text-sm text-primary"
            placeholder="Tối thiểu 6 ký tự"
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
            placeholder="Xác nhận mật khẩu"
          />
        </div>
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 disabled:opacity-75 transition-opacity"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}
