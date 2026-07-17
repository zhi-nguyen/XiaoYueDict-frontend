'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationStore, ToastItem } from '@/store/useNotificationStore';

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out slightly before actual removal
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 3600);

    // Call store onClose after 4 seconds
    const closeTimer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  // Determine styles and icon based on notification type
  let bgClass = 'bg-white border-slate-200 text-slate-900';
  let icon = 'notifications';
  let iconColor = 'text-secondary';

  switch (toast.type) {
    case 'score_complete':
    case 'pdf_complete':
      bgClass = 'bg-white border-emerald-500/20 text-slate-900';
      icon = 'check_circle';
      iconColor = 'text-emerald-500';
      break;
    case 'score_failed':
    case 'pdf_failed':
      bgClass = 'bg-white border-rose-500/20 text-slate-900';
      icon = 'cancel';
      iconColor = 'text-rose-500';
      break;
    case 'streak_update':
      bgClass = 'bg-white border-orange-500/20 text-slate-900';
      icon = 'local_fire_department';
      iconColor = 'text-orange-500';
      break;
    case 'subscription_change':
    case 'achievement':
      bgClass = 'bg-white border-amber-500/20 text-slate-900';
      icon = 'emoji_events';
      iconColor = 'text-amber-500';
      break;
    case 'system':
      bgClass = 'bg-white border-blue-500/20 text-slate-900';
      icon = 'info';
      iconColor = 'text-blue-500';
      break;
    case 'exp_gain':
      bgClass = 'bg-white border-indigo-500/20 text-slate-900';
      icon = 'trending_up';
      iconColor = 'text-indigo-500';
      break;
    case 'exp_deduct':
      bgClass = 'bg-white border-rose-500/20 text-slate-900';
      icon = 'trending_down';
      iconColor = 'text-rose-500';
      break;
    case 'level_up':
      bgClass = 'bg-white border-yellow-500/20 text-slate-900';
      icon = 'workspace_premium';
      iconColor = 'text-amber-500';
      break;
    default:
      bgClass = 'bg-white border-slate-200 text-slate-900';
      icon = 'notifications';
      iconColor = 'text-secondary';
      break;
  }

  return (
    <div
      className={`flex items-start gap-2 md:gap-3 p-2.5 md:p-4 rounded-xl border shadow-lg w-full transition-all duration-300 font-lexend pointer-events-auto ${
        isFading ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'
      } ${bgClass}`}
    >
      <span className={`material-symbols-outlined shrink-0 text-lg md:text-xl filled ${iconColor}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm font-semibold tracking-tight leading-relaxed truncate-2-lines">
          {toast.title}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-secondary hover:text-primary transition-colors p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 shrink-0 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[14px] md:text-[16px]">close</span>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 bottom-auto md:top-auto md:bottom-4 md:right-4 z-[999] flex flex-col gap-2 w-full max-w-[280px] md:max-w-xs px-4 md:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
