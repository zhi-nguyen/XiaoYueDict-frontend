'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore, NotificationItem } from '@/store/useNotificationStore';
import { djangoClient } from '@/lib/apiClient';
import Link from 'next/link';
import { getScoreResult } from '@/lib/scoreResultCache';
import ScoreResultModal from '@/components/ScoreResultModal';

function formatFullTime(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
}

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || 'zh';

  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { markAsRead, markAllAsRead, fetchUnreadCount } = useNotificationStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const paramsObj: Record<string, any> = {
        page: currentPage,
        page_size: 15,
      };

      if (filter === 'unread') {
        paramsObj.is_read = 'false';
      } else if (filter === 'read') {
        paramsObj.is_read = 'true';
      }

      const { data } = await djangoClient.get('/notifications/', { params: paramsObj });
      
      setNotifications(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 15));
    } catch (error) {
      console.error('[NotificationsPage] Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filter]);

  // Load history on filter/page change
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, currentPage, filter, fetchHistory]);

  const [scoreModalData, setScoreModalData] = useState<any>(null);

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
    // Đánh dấu đã đọc trong store và cập nhật danh sách UI local
    if (!notification.is_read) {
      await markAsRead([notification.id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      fetchUnreadCount();
    }

    const payload = notification.payload as any;

    if (notification.notification_type === 'pdf_complete' && payload.download_url) {
      const expiresAt = notification.expires_at ? new Date(notification.expires_at).getTime() : 0;
      if (expiresAt && Date.now() > expiresAt) {
        alert('Liên kết tải PDF đã hết hạn (quá 1 giờ). Vui lòng xuất lại.');
      } else {
        triggerPDFDownload(payload.task_id, payload.download_url);
      }
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
        setScoreModalData(scoreData);
      } else {
        alert('Không tìm thấy kết quả chấm điểm này.');
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    // Locally update all to read
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    fetchUnreadCount();
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

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-content-bg">
        <div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-content-bg">
        <span className="material-symbols-outlined text-5xl text-secondary/40 mb-4">lock</span>
        <h2 className="font-lexend font-bold text-xl text-primary mb-2">Đăng nhập để xem thông báo</h2>
        <p className="text-secondary text-sm mb-6 max-w-sm">
          Vui lòng đăng nhập tài khoản của bạn để truy cập lịch sử thông báo cá nhân.
        </p>
        <button
          onClick={() => router.push(`/${lang}`)}
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity text-sm"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-content-bg py-8 px-4 md:px-8 max-w-4xl mx-auto w-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-secondary mb-4 font-semibold">
        <Link href={`/${lang}/dashboard`} className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-primary font-bold">Thông báo</span>
      </div>

      {/* Header Panel */}
      <div className="bg-surface rounded-2xl border border-outline p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-lexend font-bold text-2xl text-primary tracking-tight">Lịch sử thông báo</h1>
          <p className="text-secondary text-xs mt-1">Quản lý và xem lại tất cả các cập nhật học tập của bạn.</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 border border-outline hover:bg-hover-bg rounded-xl font-bold text-xs text-secondary transition-colors shrink-0 flex items-center gap-1.5 justify-center"
        >
          <span className="material-symbols-outlined text-[16px]">done_all</span>
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface border border-outline rounded-xl p-1 mb-4 gap-1 self-start shadow-sm shrink-0">
        <button
          onClick={() => { setFilter('all'); setCurrentPage(1); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => { setFilter('unread'); setCurrentPage(1); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'unread' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
          }`}
        >
          Chưa đọc
        </button>
        <button
          onClick={() => { setFilter('read'); setCurrentPage(1); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'read' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
          }`}
        >
          Đã đọc
        </button>
      </div>

      {/* List Content */}
      <div className="bg-surface border border-outline rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-secondary">
            <span className="material-symbols-outlined text-5xl mb-3 text-secondary/30">notifications_off</span>
            <p className="text-sm font-semibold">Không tìm thấy thông báo nào</p>
            <p className="text-xs text-secondary/70 mt-1">Danh sách thông báo trống hoặc đã được lọc hết.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-outline/50">
            {notifications.map((notification) => {
              const style = getNotificationStyle(notification.notification_type);
              return (
                <div
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={`p-5 flex gap-4 hover:bg-hover-bg transition-colors cursor-pointer relative ${
                    !notification.is_read ? 'bg-primary/5 dark:bg-white/5 font-semibold' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.color}`}>
                    <span className="material-symbols-outlined text-[22px] filled">
                      {style.icon}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm text-primary leading-relaxed tracking-tight">
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
                      {formatFullTime(notification.created_at)}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="border-t border-outline px-6 py-4 flex items-center justify-between bg-hover-bg/30 shrink-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 border border-outline hover:bg-hover-bg bg-surface rounded-xl font-bold text-xs text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="text-xs text-secondary font-bold">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-4 py-2 border border-outline hover:bg-hover-bg bg-surface rounded-xl font-bold text-xs text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </div>
      <ScoreResultModal
        isOpen={!!scoreModalData}
        onClose={() => setScoreModalData(null)}
        data={scoreModalData}
      />
    </div>
  );
}
