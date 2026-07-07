'use client';

import { useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cacheScoreResult } from '@/lib/scoreResultCache';

// Danh sách event types cần lưu trữ và hiển thị cho người dùng (tác vụ dài)
const PERSISTENT_EVENT_TYPES = new Set([
  'score_complete',
  'score_failed',
  'pdf_complete',
  'pdf_failed',
  'streak_update',
  'subscription_change',
  'achievement',
  'system',
]);

/**
 * Bridge hook connecting the raw WebSocket to Zustand's useNotificationStore.
 * Triggers Toast alerts and syncs unread counts / notification logs on connect/reconnect.
 */
export function useNotificationWebSocket() {
  const { isAuthenticated } = useAuthStore();
  const {
    addNotification,
    setLastMessage,
    fetchNotifications,
    fetchUnreadCount,
    addToast,
  } = useNotificationStore();

  const handleMessage = useCallback(
    (msg: any) => {
      if (!isAuthenticated) return;

      // Ignore generic ping/pong messages
      if (msg.type === 'ping' || msg.type === 'pong') return;

      // Listen for avatar synced event to update user profile picture in real-time
      if (msg.type === 'avatar_complete' && msg.payload?.avatar_url) {
        useAuthStore.getState().updateProfile({ avatar: msg.payload.avatar_url });
        addToast('Đồng bộ ảnh đại diện thành công', 'success');
      }

      // Cache kết quả chấm điểm phát âm khi nhận sự kiện score_complete
      if (msg.type === 'score_complete' && msg.payload?.task_id) {
        cacheScoreResult({
          task_id: msg.payload.task_id,
          score: msg.payload.score,
          language: msg.payload.language,
          target_text: msg.payload.target_text,
          result_data: msg.payload.result_data,
        });
      }

      setLastMessage(msg);

      // Chỉ hiển thị toast và lưu thông báo cho các tác vụ dài
      if (PERSISTENT_EVENT_TYPES.has(msg.type)) {
        addNotification({
          id: msg.id,
          notification_type: msg.type,
          title: msg.title || 'Thông báo mới',
          payload: msg.payload || {},
          created_at: msg.created_at || new Date().toISOString(),
          expires_at: msg.payload?.expires_at || null,
        });

        addToast(msg.title || 'Thông báo mới', msg.type);
      }
    },
    [isAuthenticated, addNotification, addToast, setLastMessage]
  );

  const handleConnect = useCallback(() => {
    if (!isAuthenticated) return;
    // Safety Net: Fetch unread messages & counts on connect/reconnect to capture offline notifications
    fetchNotifications();
    fetchUnreadCount();
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Connect websocket using the core hook
  const { isConnected } = useWebSocket({
    onMessage: handleMessage,
    onConnect: handleConnect,
  });

  // Sync on initial load/auth change as a secondary sync trigger
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  return { isConnected };
}
