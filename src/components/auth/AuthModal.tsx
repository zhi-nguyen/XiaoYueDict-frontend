"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Call Next.js BFF login
        const { data } = await axios.post('/api/auth/login', { username, password });
        
        // Fetch user profile with the new token
        const userRes = await axios.get('/api/auth/me', { 
          headers: { Authorization: `Bearer ${data.access}` } 
        });
        
        setAuth(userRes.data, data.access);
        onClose();
      } else {
        // Call Next.js BFF for registration to avoid trailing slash 308 redirect issues
        await axios.post('/api/auth/register', { username, password, email });
        // Auto login after register
        const { data } = await axios.post('/api/auth/login', { username, password });
        
        const userRes = await axios.get('/api/auth/me', { 
          headers: { Authorization: `Bearer ${data.access}` } 
        });
        
        setAuth(userRes.data, data.access);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="bg-surface w-full max-w-md p-6 rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-2xl font-bold font-lexend text-primary mb-6 text-center">
          {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Tên đăng nhập</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline bg-hover-bg focus:bg-surface focus:border-sage focus:ring-1 focus:ring-sage transition-all outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-primary text-white font-bold hover:opacity-90 disabled:opacity-70 transition-opacity"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-secondary">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
