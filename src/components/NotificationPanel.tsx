'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotificationStore, NotificationItem } from '@/store/useNotificationStore';
import Link from 'next/link';
import { djangoClient } from '@/lib/apiClient';
import { getScoreResult } from '@/lib/scoreResultCache';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onShowScore: (data: any) => void;
}

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Guard against future dates or time skew
    if (diffMs < 0) return 'Vừa xong';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return '';
  }
}

export default function NotificationPanel({ isOpen, onClose, onShowScore }: NotificationPanelProps) {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || 'zh';

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside (Desktop only)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click was outside the panel AND not on the trigger bell button
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('#notification-bell-btn')
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter notifications for active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter((n) => !n.is_read);

  const triggerPDFDownload = async (taskId: string, downloadUrl: string) => {
    try {
      const res = await djangoClient.get(downloadUrl, {
        responseType: 'blob',
        timeout: 90000,
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `so-tay-tap-viet.pdf`);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi tải file PDF:', err);
      alert('Không thể tải file PDF. Liên kết tải xuống đã hết hạn.');
    }
  };

  const handleItemClick = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }

    const payload = notification.payload as any;

    if (notification.notification_type === 'pdf_complete' && payload.download_url) {
      const expiresAt = notification.expires_at ? new Date(notification.expires_at).getTime() : 0;
      if (expiresAt && Date.now() > expiresAt) {
        alert('Liên kết tải PDF đã hết hạn (quá 1 giờ). Vui lòng xuất lại.');
      } else {
        triggerPDFDownload(payload.task_id, payload.download_url);
      }
      onClose();
    } else if (notification.notification_type === 'score_complete') {
      let scoreData = getScoreResult(payload.task_id);
      if (!scoreData) {
        try {
          const res = await djangoClient.get(`/assessments/status/${payload.task_id}/`);
          scoreData = {
            task_id: payload.task_id,
            score: res.data.score,
            language: res.data.language,
            target_text: res.data.target_text,
            result_data: res.data.result_data,
            cached_at: Date.now(),
          };
        } catch (err) {
          console.error('Lỗi khi tải kết quả chấm điểm:', err);
        }
      }
      if (scoreData) {
        onShowScore(scoreData);
      } else {
        alert('Không tìm thấy kết quả chấm điểm này.');
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'score_complete':
      case 'pdf_complete':
        return { icon: 'check_circle', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' };
      case 'score_failed':
      case 'pdf_failed':
        return { icon: 'cancel', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' };
      case 'streak_update':
        return { icon: 'local_fire_department', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' };
      case 'subscription_change':
      case 'achievement':
        return { icon: 'emoji_events', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
      case 'system':
        return { icon: 'info', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' };
      default:
        return { icon: 'notifications', color: 'text-secondary bg-hover-bg' };
    }
  };

  return (
    <>
      {/* Background Overlay for mobile to block pointer events */}
      <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />

      {/* Main Container */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 w-full max-w-full bg-surface shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200 
          md:absolute md:top-[60px] md:right-0 md:bottom-auto md:w-96 md:max-w-none md:max-h-[500px] md:rounded-2xl md:border md:border-outline md:shadow-lg md:animate-in md:fade-in md:slide-in-from-top-2"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-outline flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-lexend font-bold text-lg text-primary">Thông báo</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadCount} mới
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-bold text-sage hover:opacity-80 transition-opacity px-2 py-1 rounded"
              >
                Đọc tất cả
              </button>
            )}
            
            {/* Close button for Mobile drawer */}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-hover-bg text-secondary flex md:hidden"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-2 pt-2 border-b border-outline flex shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-bold border-b-2 text-center transition-all ${
              activeTab === 'all'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 text-sm font-bold border-b-2 text-center transition-all ${
              activeTab === 'unread'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Chưa đọc
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline/50 sidebar-scroll">
          {filteredNotifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2 text-secondary/30">
                notifications_off
              </span>
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const style = getNotificationStyle(notification.notification_type);
              return (
                <div
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`p-4 flex gap-3 hover:bg-hover-bg cursor-pointer transition-colors relative ${
                    !notification.is_read ? 'bg-primary/5 dark:bg-white/5 font-semibold' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.color}`}>
                    <span className="material-symbols-outlined text-[20px] filled">
                      {style.icon}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm text-primary leading-snug tracking-tight truncate-2-lines">
                      {notification.title}
                    </p>
                    {notification.notification_type === 'pdf_complete' && (
                      <div className="text-xs font-bold mt-1">
                        {(() => {
                          const expiresAt = notification.expires_at ? new Date(notification.expires_at).getTime() : 0;
                          const isExpired = expiresAt ? Date.now() > expiresAt : false;
                          return isExpired ? (
                            <span className="text-rose-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">history_toggle_off</span>
                              Đã hết hạn tải (1h)
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">download</span>
                              Tải lại PDF (Còn hạn)
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    {notification.notification_type === 'score_complete' && (
                      <div className="text-xs font-bold mt-1 text-sage flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs font-bold">visibility</span>
                        Xem chi tiết kết quả
                      </div>
                    )}
                    <p className="text-xs text-secondary mt-1 font-normal">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread marker */}
                  {!notification.is_read && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer link to See All */}
        <div className="border-t border-outline p-3 shrink-0">
          <Link
            href={`/${lang}/dashboard/notifications`}
            onClick={onClose}
            className="block text-center w-full py-2.5 text-xs font-bold text-secondary bg-hover-bg hover:bg-outline/50 rounded-xl transition-colors"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </div>
    </>
  );
}
