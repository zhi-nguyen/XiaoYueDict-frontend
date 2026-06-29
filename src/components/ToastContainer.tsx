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
  let bgClass = 'bg-surface border-outline';
  let icon = 'notifications';
  let iconColor = 'text-secondary';

  switch (toast.type) {
    case 'score_complete':
    case 'pdf_complete':
      bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/30';
      icon = 'check_circle';
      iconColor = 'text-emerald-500';
      break;
    case 'score_failed':
    case 'pdf_failed':
      bgClass = 'bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/30';
      icon = 'cancel';
      iconColor = 'text-rose-500';
      break;
    case 'streak_update':
      bgClass = 'bg-orange-50 border-orange-200 text-orange-950 dark:bg-orange-950/20 dark:border-orange-900/30';
      icon = 'local_fire_department';
      iconColor = 'text-orange-500';
      break;
    case 'subscription_change':
    case 'achievement':
      bgClass = 'bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950/20 dark:border-amber-900/30';
      icon = 'emoji_events';
      iconColor = 'text-amber-500';
      break;
    case 'system':
      bgClass = 'bg-blue-50 border-blue-200 text-blue-950 dark:bg-blue-950/20 dark:border-blue-900/30';
      icon = 'info';
      iconColor = 'text-blue-500';
      break;
    default:
      bgClass = 'bg-surface border-outline text-primary';
      icon = 'notifications';
      iconColor = 'text-secondary';
      break;
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg w-full max-w-sm transition-all duration-300 font-lexend pointer-events-auto ${
        isFading ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'
      } ${bgClass}`}
    >
      <span className={`material-symbols-outlined shrink-0 text-xl filled ${iconColor}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold tracking-tight leading-relaxed truncate-2-lines">
          {toast.title}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-secondary hover:text-primary transition-colors p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 shrink-0 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none md:max-w-xs sm:px-0">
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
