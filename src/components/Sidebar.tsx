"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { href: '/study', icon: 'book', label: 'Tra từ & Học tập' },
  { href: '/translate', icon: 'g_translate', label: 'Dịch thông minh' },
  { href: '/speaking', icon: 'mic', label: 'Luyện Nói' },
  { href: '/writing', icon: 'edit', label: 'Luyện Viết' },
  { href: '/exam', icon: 'emoji_events', label: 'Luyện Thi' },
  { href: '/notes', icon: 'menu_book', label: 'Sổ Tay' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const language = (params?.lang as string) || 'zh';
  const { isSidebarOpen, setSidebarOpen, isDesktopSidebarCollapsed, toggleDesktopSidebar } = useUIStore();
  const { tier: subscriptionTier } = useSubscriptionStore();
  const sidebarRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isSidebarOpen) return;
      const target = event.target as HTMLElement;
      if (target.closest('#sidebar-toggle-btn') || target.closest('.sidebar-toggle-btn')) {
        return;
      }
      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, setSidebarOpen]);

  const items = navItems.map(item => {
    if (item.href === '/exam') {
      return {
        ...item,
        label: language === 'zh' ? 'Luyện Thi HSK' : 'Luyện Thi IELTS',
      };
    }
    return item;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside ref={sidebarRef} className={`fixed inset-y-0 left-0 z-50 h-full w-[260px] bg-surface border-r border-outline flex flex-col shrink-0 transition-all duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDesktopSidebarCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'}`}>
        {/* Toggle & Brand Section */}
        <div className={`h-[72px] flex items-center shrink-0 transition-all ${isDesktopSidebarCollapsed ? 'md:justify-center px-5 md:px-0' : 'px-5'}`}>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full hover:bg-hover-bg text-primary transition-colors flex items-center justify-center md:hidden">
            <span className="material-symbols-outlined">close</span>
          </button>
          <button onClick={toggleDesktopSidebar} className="p-2 rounded-full hover:bg-hover-bg text-primary transition-colors hidden md:flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">{isDesktopSidebarCollapsed ? 'menu' : 'menu_open'}</span>
          </button>
        <div className={`ml-3 font-lexend font-bold text-xl text-primary tracking-tight transition-all duration-300 whitespace-nowrap ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>
          XiaoYueDict
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 sidebar-scroll overflow-y-auto overflow-x-hidden pt-4">
        {items.map(item => {
          const targetHref = `/${language}${item.href}`;
          const isActive = pathname === targetHref || (item.href !== '/' && pathname.startsWith(targetHref));
          return (
            <Link 
              key={item.href}
              href={targetHref}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center h-12 rounded-full transition-all ${isDesktopSidebarCollapsed ? 'md:justify-center px-3 md:px-0' : 'px-3 justify-start'} ${isActive ? 'bg-primary text-white' : 'text-secondary hover:bg-hover-bg hover:text-primary'}`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''} w-6 flex justify-center shrink-0`}>{item.icon}</span>
              <span className={`font-medium text-[15px] whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>{item.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-6 border-t border-outline"></div>

        {/* Secondary Menu (Upcoming) */}
        <div className="space-y-1 opacity-50 px-3">
          <div className={`flex items-center h-12 text-secondary/70 ${isDesktopSidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}>
            <span className="material-symbols-outlined w-6 flex justify-center shrink-0">headphones</span>
            <div className={`flex flex-col justify-center whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>
              <span className="font-medium text-[15px] leading-tight">Luyện Nghe</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Sắp ra mắt</span>
            </div>
          </div>
          <div className={`flex items-center h-12 text-secondary/70 ${isDesktopSidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}>
            <span className="material-symbols-outlined w-6 flex justify-center shrink-0">videogame_asset</span>
            <div className={`flex flex-col justify-center whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>
              <span className="font-medium text-[15px] leading-tight">Mini Game</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Sắp ra mắt</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 shrink-0 border-t border-outline flex flex-col gap-2">
        {subscriptionTier === 'Free' && !isDesktopSidebarCollapsed && (
          <div className="bg-gradient-to-r from-orange/10 to-orange/5 border border-orange/20 rounded-xl p-3 mb-2 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-orange/20 rounded-full blur-xl"></div>
            <span className="material-symbols-outlined text-orange text-3xl mb-1">workspace_premium</span>
            <span className="font-bold text-sm text-primary mb-1 text-center">Nâng cấp Premium</span>
            <span className="text-[11px] text-secondary text-center mb-2 leading-tight">Mở khóa tính năng AI & Dịch thông minh không giới hạn</span>
            <button className="w-full py-1.5 bg-gradient-to-r from-orange to-red-500 hover:from-orange/90 hover:to-red-500/90 text-white rounded-lg font-semibold text-xs shadow-sm transition-all hover:shadow">
              Nâng cấp ngay
            </button>
          </div>
        )}
        
        {subscriptionTier === 'Free' && isDesktopSidebarCollapsed && (
           <div className="hidden md:flex justify-center mb-2">
             <button className="w-10 h-10 rounded-full bg-gradient-to-r from-orange to-red-500 text-white flex items-center justify-center shadow-sm hover:shadow transition-all" title="Nâng cấp Premium">
               <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
             </button>
           </div>
        )}

        <Link href="#" className={`flex items-center h-12 rounded-full text-secondary hover:bg-hover-bg hover:text-primary transition-all ${isDesktopSidebarCollapsed ? 'md:justify-center px-3 md:px-0' : 'px-3 justify-start'}`}>
          <span className="material-symbols-outlined w-6 flex justify-center shrink-0">settings</span>
          <span className={`font-medium text-[15px] whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>Cài đặt</span>
        </Link>
      </div>
    </aside>
    </>
  );
}
