import { create } from 'zustand';
import { djangoClient } from '@/lib/apiClient';

export interface NotificationItem {
  id: string; // Changed from number to string for UUID
  notification_type: string;
  title: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  expires_at?: string | null;
}

export interface ToastItem {
  id: string;
  title: string;
  type: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  lastMessage: any | null; // Stores the most recent raw WS message
  isInitialized: boolean;
  toasts: ToastItem[];

  /** Add a new notification from WebSocket (real-time) */
  addNotification: (notification: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'> & Partial<NotificationItem>) => void;

  /** Set the raw last message received */
  setLastMessage: (msg: any) => void;

  /** Fetch notifications (recent ones) from server */
  fetchNotifications: () => Promise<void>;

  /** Fetch unread count from server */
  fetchUnreadCount: () => Promise<void>;

  /** Mark specific notifications as read */
  markAsRead: (ids: string[]) => Promise<void>;

  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;

  /** Clear all notifications from local state */
  clear: () => void;

  /** Add an active toast notification */
  addToast: (title: string, type: string) => void;

  /** Remove an active toast notification */
  removeToast: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  lastMessage: null,
  isInitialized: false,
  toasts: [],

  addNotification: (notification) => {
    // Chặn hoàn toàn việc đưa các thông báo sinh ảnh và âm thanh vào UI notifications panel
    if (
      notification.notification_type === 'image_complete' ||
      notification.notification_type === 'image_failed' ||
      notification.notification_type === 'tts_complete' ||
      notification.notification_type === 'tts_failed'
    ) {
      return;
    }

    // Generate a temporary UUID string if not provided
    const id = notification.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    const newItem: NotificationItem = {
      id,
      notification_type: notification.notification_type,
      title: notification.title,
      payload: notification.payload ?? {},
      is_read: false,
      created_at: notification.created_at ?? new Date().toISOString(),
      expires_at: notification.expires_at ?? null,
    };

    set((state) => {
      // Avoid duplicate notifications (e.g. if WS and HTTP fetch overlap)
      const exists = state.notifications.some((n) => n.id === newItem.id);
      if (exists) return {};

      // Keep maximum 15 notifications in the quick access panel
      const newNotifications = [newItem, ...state.notifications].slice(0, 15);
      return {
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  setLastMessage: (msg) => set({ lastMessage: msg }),

  fetchNotifications: async () => {
    try {
      const { data } = await djangoClient.get('/notifications/', {
        params: { page_size: 15 }
      });
      // PageNumberPagination returns results inside "results"
      const items: NotificationItem[] = data.results || data;

      // Lọc bỏ các thông báo sinh ảnh và âm thanh cũ có thể tồn tại trong DB
      const filteredItems = items.filter(
        (item) =>
          item.notification_type !== 'image_complete' &&
          item.notification_type !== 'image_failed' &&
          item.notification_type !== 'tts_complete' &&
          item.notification_type !== 'tts_failed'
      );

      set({
        notifications: filteredItems,
        isInitialized: true,
      });
    } catch (error) {
      console.error('[NotificationStore] Failed to fetch notifications:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await djangoClient.get('/notifications/count/');
      set({
        unreadCount: data.unread_count ?? 0,
      });
    } catch (error) {
      console.error('[NotificationStore] Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await djangoClient.post('/notifications/mark-read/', { ids });

      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          ids.includes(n.id) ? { ...n, is_read: true } : n
        );
        // Calculate read count within notifications
        const newlyReadCount = state.notifications.filter(
          (n) => ids.includes(n.id) && !n.is_read
        ).length;

        return {
          notifications: updatedNotifications,
          unreadCount: Math.max(0, state.unreadCount - newlyReadCount),
        };
      });
    } catch (error) {
      console.error('[NotificationStore] Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await djangoClient.post('/notifications/mark-read/', { all: true });

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('[NotificationStore] Failed to mark all as read:', error);
    }
  },

  clear: () => set({ notifications: [], unreadCount: 0, lastMessage: null, toasts: [], isInitialized: false }),

  addToast: (title, type) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const newToast: ToastItem = { id, title, type };
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
