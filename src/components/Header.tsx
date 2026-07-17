"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { useCoinStore } from '@/store/useCoinStore';
import Link from 'next/link';
import Image from 'next/image';
import AuthModal from '@/components/auth/AuthModal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import NotificationPanel from '@/components/NotificationPanel';
import ToastContainer from '@/components/ToastContainer';
import ScoreResultModal from '@/components/ScoreResultModal';
import { getMediaUrl } from '@/lib/mediaUtils';
import UserAvatarContainer from '@/components/UserAvatarContainer';
import LevelProgressBar from '@/components/LevelProgressBar';

export default function Header() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();

  const switchLanguage = (newLang: string) => {
    if (typeof window !== 'undefined') {
      // Force a full page reload and kick back to Dashboard (or Homepage if guest)
      // to avoid displaying mismatched target language data.
      const targetUrl = isAuthenticated ? `/${newLang}/dashboard` : `/${newLang}`;
      window.location.href = targetUrl;
    }
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scoreModalData, setScoreModalData] = useState<any>(null);
  const [isPromoDismissed, setIsPromoDismissed] = useState(false);

  // Initialize notification WebSocket
  useNotificationWebSocket();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const language = isMounted ? ((params?.lang as string) || 'zh') : 'zh';
  const { currentStreak, fetchGamificationData, isInitialized: isGamificationInit } = useGamificationStore();
  const { tier: subscriptionTier, fetchSubscription, isInitialized: isSubInit } = useSubscriptionStore();
  const { wallets, fetchWalletBalances } = useCoinStore();

  const isHomeOrWritingPage = pathname === '/' || pathname === `/${language}` || pathname === `/${language}/writing` || pathname === `/writing`;
  const showPromoBubble = isMounted && !isAuthenticated && isHomeOrWritingPage && !isPromoDismissed;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGamificationData();
      fetchSubscription();
      fetchWalletBalances();
    }
  }, [isAuthenticated, fetchGamificationData, fetchSubscription, fetchWalletBalances]);

  if (pathname && pathname.includes('/exam/take/')) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 flex flex-col w-full shrink-0">
      <header className="h-[72px] bg-surface border-b border-outline px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Left section: Toggle Menu & Brand Name on Mobile */}
      <div className="flex items-center gap-2">
        <button id="sidebar-toggle-btn" onClick={toggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-hover-bg text-primary md:hidden flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Mobile Brand */}
        <div className="font-lexend font-bold text-lg text-primary tracking-tight md:hidden shrink-0">
          CnenDict
        </div>
      </div>

      {/* Right Actions section */}
      <div className="flex items-center space-x-2 md:space-x-4 ml-2 md:ml-6">
        {/* Language Toggle */}
        <div className="flex bg-hover-bg rounded-full p-1 border border-outline shrink-0">
          <button
            onClick={() => switchLanguage('zh')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${language === 'zh'
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary hover:text-primary'
              }`}
          >
            <span>🇨🇳</span>
            <span className="hidden sm:inline">Trung</span>
          </button>
          <button
            onClick={() => switchLanguage('en')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${language === 'en'
              ? 'bg-primary text-white shadow-sm'
              : 'text-secondary hover:text-primary'
              }`}
          >
            <span>🇬🇧</span>
            <span className="hidden sm:inline">Anh</span>
          </button>
        </div>

        {/* Level Badge */}
        {isMounted && isAuthenticated && user?.levels?.[language as 'zh' | 'en'] && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline hover:bg-hover-bg cursor-pointer transition-colors"
            title={`Kinh nghiệm: ${user.levels[language as 'zh' | 'en'].current_exp}/${user.levels[language as 'zh' | 'en'].exp_required} EXP`}
            id="header-level-badge"
          >
            <span className="material-symbols-outlined filled text-[18px] text-amber-500 select-none">
              star
            </span>
            <span className="font-bold text-sm text-primary">
              Cấp {user.levels[language as 'zh' | 'en'].level}
            </span>
          </div>
        )}

        {/* Gamification Streak */}
        {isMounted && isAuthenticated && isGamificationInit && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline hover:bg-hover-bg cursor-pointer transition-colors">
            <span className={`material-symbols-outlined text-[20px] filled ${currentStreak > 0 ? 'text-orange' : 'text-secondary/50'}`}>
              local_fire_department
            </span>
            <span className={`font-semibold text-sm ${currentStreak > 0 ? 'text-primary' : 'text-secondary'}`}>
              {currentStreak} Ngày
            </span>
          </div>
        )}



        {isMounted && isAuthenticated && (
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="flex w-10 h-10 items-center justify-center rounded-full hover:bg-hover-bg text-secondary relative transition-colors"
              title="Thông báo"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border border-surface">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationPanel
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onShowScore={(scoreData) => {
                setScoreModalData(scoreData);
                setIsNotificationOpen(false);
              }}
            />
          </div>
        )}

        {!isMounted ? (
          <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse"></div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            {isSubInit && subscriptionTier && subscriptionTier !== 'Free' && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                <span className="material-symbols-outlined text-yellow-600 text-[14px] filled">stars</span>
                <span className="text-[11px] font-bold text-yellow-700 tracking-wider uppercase">{subscriptionTier}</span>
              </div>
            )}
            <div className="relative">
              <UserAvatarContainer
                user={user}
                sizeClass="w-10 h-10"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              />

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-lg border border-outline py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-outline mb-1">
                      <p className="text-sm font-bold text-primary truncate">
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                      </p>
                      <p className="text-xs text-secondary truncate">{user.email}</p>
                    </div>

                    {/* Linh Thach Section */}
                    <div className="px-4 py-2 border-b border-outline/50">
                      <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <span>💎</span>
                          <span>Linh Thạch (ZH)</span>
                        </div>
                        {user.levels?.zh && (
                          <span className="text-[#6366F1] font-black normal-case">
                            Cấp {user.levels.zh.level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xl font-black text-primary leading-none">
                          {wallets?.zh?.total ?? 0}
                        </span>
                        <Link
                          href={`/${language}/profile?tab=subs&subtab=coins`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-6 h-6 rounded-md bg-hover-bg border border-outline hover:bg-outline/20 flex items-center justify-center transition-colors text-primary font-bold text-sm focus:outline-none"
                          title="Nạp Linh Thạch"
                        >
                          +
                        </Link>
                      </div>
                      <div className="text-[10px] text-secondary mt-1">
                        Paid: {wallets?.zh?.paid ?? 0} | Free: {wallets?.zh?.free ?? 0}
                      </div>
                    </div>

                    {/* Coin Section */}
                    <div className="px-4 py-2 border-b border-outline/50 mb-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <span>🪙</span>
                          <span>Coin (EN)</span>
                        </div>
                        {user.levels?.en && (
                          <span className="text-[#6366F1] font-black normal-case">
                            Cấp {user.levels.en.level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xl font-black text-primary leading-none">
                          {wallets?.en?.total ?? 0}
                        </span>
                        <Link
                          href={`/${language}/profile?tab=subs&subtab=coins`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-6 h-6 rounded-md bg-hover-bg border border-outline hover:bg-outline/20 flex items-center justify-center transition-colors text-primary font-bold text-sm focus:outline-none"
                          title="Nạp Coin"
                        >
                          +
                        </Link>
                      </div>
                      <div className="text-[10px] text-secondary mt-1">
                        Paid: {wallets?.en?.paid ?? 0} | Free: {wallets?.en?.free ?? 0}
                      </div>
                    </div>

                    <Link
                      href={`/${language}/profile`}
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
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
              onClick={() => setIsAuthModalOpen(true)}
              title="Đăng nhập"
            >
              <span className="material-symbols-outlined text-xl">person</span>
            </button>

            {showPromoBubble && (
              <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-yellow-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-2xl p-3.5 z-50 border border-yellow-300 animate-in fade-in slide-in-from-top-2">
                <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-yellow-500 rotate-45 transform"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPromoDismissed(true);
                  }}
                  className="absolute top-1 right-2 text-white/70 hover:text-white text-xs font-bold p-1"
                  title="Đóng"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1 flex items-center gap-1 text-yellow-100">
                  <span className="material-symbols-outlined text-xs filled">workspace_premium</span>
                  Quà tặng mới!
                </p>
                <p className="text-xs font-bold leading-snug pr-3">
                  Đăng ký tài khoản mới để nhận ngay <strong>3 ngày trải nghiệm gói PRO miễn phí</strong>!
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="mt-2.5 w-full py-1.5 bg-white font-extrabold text-[11px] rounded-lg shadow hover:bg-orange-50 transition-colors flex items-center justify-center gap-1"
                  style={{ color: '#ea580c' }}
                >
                  <span className="material-symbols-outlined text-xs font-bold" style={{ color: '#ea580c' }}>login</span>
                  Đăng nhập / Đăng ký
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ToastContainer />
      <ScoreResultModal
        isOpen={!!scoreModalData}
        onClose={() => setScoreModalData(null)}
        data={scoreModalData}
      />
      </header>
      <LevelProgressBar language={language} />
    </div>
  );
}
