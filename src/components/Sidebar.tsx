"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import SettingsPanel from '@/components/SettingsPanel';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { href: '/study', icon: 'book', label: 'Tra từ & Học tập' },
  { href: '/translate', icon: 'g_translate', label: 'Dịch thông minh' },
  { href: '/speaking', icon: 'mic', label: 'Luyện Nói' },
  { href: '/writing', icon: 'edit', label: 'Luyện Viết' },
  { href: '/ai-chat', icon: 'forum', label: 'Trò chuyện AI' },
  { href: '/exam', icon: 'emoji_events', label: 'Luyện Thi' },
  { href: '/notes', icon: 'menu_book', label: 'Sổ Tay' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const [isMounted, setIsMounted] = React.useState(false);
  const [activeExam, setActiveExam] = React.useState<any>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).__activeExam) {
        setActiveExam((window as any).__activeExam);
      }
      setIsSubmitted(!!(window as any).__activeExamSubmitted);
      setAnswers((window as any).__activeExamAnswers || {});

      const handleExamLoaded = () => {
        setActiveExam((window as any).__activeExam);
        setIsSubmitted(!!(window as any).__activeExamSubmitted);
        setAnswers((window as any).__activeExamAnswers || {});
      };

      const handleExamStateUpdate = () => {
        setIsSubmitted(!!(window as any).__activeExamSubmitted);
        setAnswers((window as any).__activeExamAnswers || {});
      };

      window.addEventListener('exam-loaded', handleExamLoaded);
      window.addEventListener('exam-state-update', handleExamStateUpdate);
      return () => {
        window.removeEventListener('exam-loaded', handleExamLoaded);
        window.removeEventListener('exam-state-update', handleExamStateUpdate);
      };
    }
  }, []);

  const language = isMounted ? ((params?.lang as string) || 'zh') : 'zh';
  const { isSidebarOpen, setSidebarOpen, isDesktopSidebarCollapsed, toggleDesktopSidebar, setSettingsOpen } = useUIStore();
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

  const isExamPage = isMounted && pathname?.includes('/exam/take/');

  const items = navItems.map(item => {
    if (item.href === '/exam') {
      return {
        ...item,
        label: language === 'zh' ? 'Luyện Thi HSK' : 'Luyện Thi IELTS',
      };
    }
    if (item.href === '/ai-chat') {
      return {
        ...item,
        label: language === 'zh' ? 'Ai Chat' : 'AI Chat',
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

      {isExamPage ? (
        /* Exam Sidebar Mode */
        <aside ref={sidebarRef} className={`fixed inset-y-0 left-0 z-50 h-full w-[260px] bg-surface border-r border-outline flex flex-col shrink-0 transition-all duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Back to list button */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('exam-sidebar-leave'));
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 mx-4 mt-4 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm text-left focus:outline-none"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Trở về luyện thi</span>
          </button>

          <div className="my-4 border-t border-outline/60 mx-4"></div>

          {/* Candidate Exam Info */}
          <div className="px-6 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] font-bold">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-lexend font-bold text-xs text-primary uppercase tracking-wide truncate">
                  {activeExam?.level || 'Đang thi'}
                </p>
                <p className="text-[13px] text-secondary font-medium mt-0.5 leading-tight truncate">
                  {activeExam?.exam_name || 'Đang tải đề thi...'}
                </p>
              </div>
            </div>
          </div>
          {/* Sections navigation or Map Question */}
          {isSubmitted ? (
            <nav className="flex-1 px-4 space-y-4 sidebar-scroll overflow-y-auto overflow-x-hidden pt-2">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3 font-lexend">
                  Bản đồ câu hỏi
                </p>
                <div className="grid grid-cols-4 gap-2 px-1">
                  {(() => {
                    const allQuestions = activeExam?.sections?.flatMap((s: any) => s.questions) || [];

                    const isQuestionCorrect = (q: any) => {
                      const isTextInput =
                        q.question_type === 'fill_blank' ||
                        (q.question_type === 'ordering' && (!q.options || q.options.length === 0));

                      const cleanAnswer = (str: string) => str?.trim().toLowerCase().replace(/[.。!！?？]+$/, '').trim() || '';
                      const formattedUserAnswer = cleanAnswer(answers[q.question_id] || '');
                      const correctAnswersList = (q.correct_answer || '').split('/').map((ans: string) => cleanAnswer(ans));

                      return isTextInput
                        ? correctAnswersList.includes(formattedUserAnswer)
                        : answers[q.question_id] === q.correct_answer;
                    };

                    return allQuestions.map((q: any, idx: number) => {
                      const correct = isQuestionCorrect(q);
                      const bgClass = correct
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200';

                      return (
                        <button
                          key={q.question_id}
                          onClick={() => {
                            const element = document.getElementById(`question-${q.question_id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            setSidebarOpen(false);
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-95 cursor-pointer ${bgClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Legend */}
              <div className="px-3 flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-outline/35">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                  <span>Đúng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span>
                  <span>Sai</span>
                </div>
              </div>
            </nav>
          ) : (
            <nav className="flex-1 px-4 space-y-1 sidebar-scroll overflow-y-auto overflow-x-hidden pt-2">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-lexend">Phần thi</p>
              {(() => {
                const sectionCounts: Record<string, number> = {};
                const sectionIndices: Record<string, number> = {};

                activeExam?.sections?.forEach((sec: any) => {
                  const key = `${sec.section_name}_${sec.part_number}`;
                  sectionCounts[key] = (sectionCounts[key] || 0) + 1;
                });

                return activeExam?.sections?.map((sec: any) => {
                  const nameLower = sec.section_name?.toLowerCase() || '';
                  const icon = nameLower.includes('listen')
                    ? 'headphones'
                    : nameLower.includes('read')
                      ? 'menu_book'
                      : 'edit';

                  const key = `${sec.section_name}_${sec.part_number}`;
                  sectionIndices[key] = (sectionIndices[key] || 0) + 1;
                  const isDuplicate = sectionCounts[key] > 1;
                  const suffix = isDuplicate ? `-${sectionIndices[key]}` : '';

                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        const element = document.getElementById(`section-${sec.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        setSidebarOpen(false);
                      }}
                      className="w-full flex items-center h-12 rounded-full px-3 text-secondary hover:bg-hover-bg hover:text-primary transition-all text-left focus:outline-none"
                    >
                      <span className="material-symbols-outlined w-6 flex justify-center shrink-0">{icon}</span>
                      <span className="font-medium text-[16px] whitespace-nowrap ml-3 truncate">
                        {sec.section_name} - P.{sec.part_number}{suffix}
                      </span>
                    </button>
                  );
                });
              })()}
            </nav>
          )}

          {/* Bottom Actions - Submit Exam */}
          {!isSubmitted && (
            <div className="p-4 shrink-0 border-t border-outline flex flex-col gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('exam-sidebar-submit'))}
                className="w-full bg-primary hover:bg-[#334155] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all focus:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Nộp Bài Thi</span>
              </button>
            </div>
          )}
        </aside>
      ) : (
        /* Normal Sidebar Mode */
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
              CnenDict
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 space-y-1 sidebar-scroll overflow-y-auto overflow-x-hidden pt-4">
            {items.map(item => {
              const targetHref = `/${language}${item.href}`;
              const isActive = isMounted && (pathname === targetHref || (item.href !== '/' && pathname.startsWith(targetHref)));
              return (
                <Link
                  key={item.href}
                  href={targetHref}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center h-12 rounded-full transition-all ${isDesktopSidebarCollapsed ? 'md:justify-center px-3 md:px-0' : 'px-3 justify-start'} ${isActive ? 'bg-primary text-white' : 'text-secondary hover:bg-hover-bg hover:text-primary'}`}
                >
                  <span className={`material-symbols-outlined ${isActive ? 'filled' : ''} w-6 flex justify-center shrink-0`}>{item.icon}</span>
                  <span className={`font-medium text-[17px] whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>{item.label}</span>
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
                  <span className="font-medium text-[17px] leading-tight">Cửa Hàng</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Sắp ra mắt</span>
                </div>
              </div>
              <div className={`flex items-center h-12 text-secondary/70 ${isDesktopSidebarCollapsed ? 'md:justify-center md:px-0' : ''}`}>
                <span className="material-symbols-outlined w-6 flex justify-center shrink-0">videogame_asset</span>
                <div className={`flex flex-col justify-center whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>
                  <span className="font-medium text-[17px] leading-tight">Mini Game</span>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Sắp ra mắt</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 shrink-0 border-t border-outline flex flex-col gap-2">
            <Link
              href={`/${language}/profile?tab=subs&subtab=coins`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center h-12 rounded-full text-secondary hover:bg-hover-bg hover:text-primary transition-all ${isDesktopSidebarCollapsed ? 'md:justify-center px-3 md:px-0' : 'px-3 justify-start'}`}
            >
              <span className="material-symbols-outlined w-6 flex justify-center shrink-0">toll</span>
              <span className={`font-medium text-[17px] whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>Nạp điểm</span>
            </Link>

            <button
              onClick={() => setSettingsOpen(true)}
              className={`flex items-center h-12 rounded-full text-secondary hover:bg-hover-bg hover:text-primary transition-all ${isDesktopSidebarCollapsed ? 'md:justify-center px-3 md:px-0' : 'px-3 justify-start'}`}
            >
              <span className="material-symbols-outlined w-6 flex justify-center shrink-0">settings</span>
              <span className={`font-medium text-[17px] whitespace-nowrap transition-all duration-300 ml-3 ${isDesktopSidebarCollapsed ? 'md:opacity-0 md:w-0 md:ml-0 overflow-hidden' : 'md:opacity-100 md:w-auto'}`}>Cài đặt</span>
            </button>
          </div>
        </aside>
      )}

      {/* Settings Panel (slide-over) */}
      <SettingsPanel />
    </>
  );
}

