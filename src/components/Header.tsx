"use client";

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import Link from 'next/link';
import AuthModal from '@/components/auth/AuthModal';

export default function Header() {
  const { language, setLanguage } = useLanguageStore();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  
  const { currentStreak, fetchGamificationData, isInitialized: isGamificationInit } = useGamificationStore();
  const { tier: subscriptionTier, fetchSubscription, isInitialized: isSubInit } = useSubscriptionStore();

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGamificationData();
      fetchSubscription();
    }
  }, [isAuthenticated, fetchGamificationData, fetchSubscription]);

  return (
    <header className="h-[72px] bg-surface border-b border-outline px-4 md:px-6 flex items-center justify-between shrink-0 top-0 sticky z-40">
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-surface z-20 flex items-center px-4">
          <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 mr-2 rounded-full hover:bg-hover-bg text-secondary">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="relative w-full">
            <input
              type="text"
              autoFocus
              placeholder={language === 'zh' ? "Nhập từ cần tra..." : "Nhập từ cần tra..."}
              className="w-full pl-4 pr-4 py-2.5 bg-hover-bg rounded-full border border-transparent focus:border-sage focus:outline-none focus:ring-0 text-sm font-lexend text-primary placeholder:text-secondary"
            />
          </div>
        </div>
      )}

      {/* Search Bar section */}
      <div className="flex items-center flex-1 max-w-[600px] gap-2">
        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-hover-bg text-primary md:hidden flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Mobile Brand */}
        <div className="font-lexend font-bold text-lg text-primary tracking-tight md:hidden shrink-0">
          XiaoYueDict
        </div>
        
        <div className="relative w-full hidden md:block ml-2">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl">
            search
          </span>
          <input
            type="text"
            placeholder={language === 'zh' ? "Nhập từ cần tra (Trung - Việt)..." : "Nhập từ cần tra (Anh - Việt)..."}
            className="w-full pl-12 pr-4 py-2.5 bg-hover-bg rounded-full border border-transparent focus:border-sage focus:outline-none focus:ring-0 text-sm font-lexend text-primary placeholder:text-secondary"
          />
        </div>
      </div>

      {/* Right Actions section */}
      <div className="flex items-center space-x-2 md:space-x-4 ml-2 md:ml-6">
        {/* Mobile Search Trigger */}
        <button onClick={() => setIsMobileSearchOpen(true)} className="w-10 h-10 rounded-full hover:bg-hover-bg text-primary md:hidden flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">search</span>
        </button>

        {/* Language Toggle */}
        <div className="flex bg-hover-bg rounded-full p-1 border border-outline shrink-0">
          <button
            onClick={() => setLanguage('zh')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              language === 'zh'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>🇨🇳</span>
            <span className="hidden sm:inline">Trung</span>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              language === 'en'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>🇬🇧</span>
            <span className="hidden sm:inline">Anh</span>
          </button>
        </div>

        {/* Gamification Streak */}
        {isAuthenticated && isGamificationInit && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline hover:bg-hover-bg cursor-pointer transition-colors">
            <span className={`material-symbols-outlined text-[20px] filled ${currentStreak > 0 ? 'text-orange' : 'text-secondary/50'}`}>
              local_fire_department
            </span>
            <span className={`font-semibold text-sm ${currentStreak > 0 ? 'text-primary' : 'text-secondary'}`}>
              {currentStreak} Ngày
            </span>
          </div>
        )}

        <button className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-hover-bg text-secondary relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-surface"></span>
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {isSubInit && subscriptionTier && subscriptionTier !== 'Free' && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                <span className="material-symbols-outlined text-yellow-600 text-[14px] filled">stars</span>
                <span className="text-[11px] font-bold text-yellow-700 tracking-wider uppercase">{subscriptionTier}</span>
              </div>
            )}
            <div className="relative">
              <button 
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold tracking-tight shadow-sm hover:opacity-90 overflow-hidden"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.username.substring(0, 2).toUpperCase()
                )}
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-outline py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-outline mb-1">
                      <p className="text-sm font-bold text-primary truncate">{user.username}</p>
                      <p className="text-xs text-secondary truncate">{user.email}</p>
                    </div>
                    <Link 
                      href="/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-hover-bg flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Hồ sơ cá nhân
                    </Link>
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <button 
            className="px-4 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Đăng nhập
          </button>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
