import { create } from 'zustand';
import { djangoClient } from '@/lib/apiClient';

export interface NotificationItem {
  id: number;
  notification_type: string;
  title: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  lastMessage: any | null; // Stores the most recent raw WS message

  /** Add a new notification from WebSocket (real-time) */
  addNotification: (notification: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'> & Partial<NotificationItem>) => void;

  /** Set the raw last message received */
  setLastMessage: (msg: any) => void;

  /** Fetch unread notifications from server (on reconnect / initial load) */
  fetchUnread: () => Promise<void>;

  /** Mark specific notifications as read */
  markAsRead: (ids: number[]) => Promise<void>;

  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;

  /** Clear all notifications from local state */
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  lastMessage: null,

  addNotification: (notification) => {
    const newItem: NotificationItem = {
      id: notification.id ?? Date.now(),
      notification_type: notification.notification_type,
      title: notification.title,
      payload: notification.payload ?? {},
      is_read: false,
      created_at: notification.created_at ?? new Date().toISOString(),
    };

    set((state) => ({
      notifications: [newItem, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  setLastMessage: (msg) => set({ lastMessage: msg }),

  fetchUnread: async () => {
    try {
      const { data } = await djangoClient.get('/notifications/unread/');
      const items: NotificationItem[] = data;

      set({
        notifications: items,
        unreadCount: items.length,
      });
    } catch (error) {
      console.error('[NotificationStore] Failed to fetch unread:', error);
    }
  },

  markAsRead: async (ids: number[]) => {
    try {
      await djangoClient.post('/notifications/mark-read/', { ids });

      set((state) => ({
        notifications: state.notifications.map((n) =>
          ids.includes(n.id) ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - ids.length),
      }));
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

  clear: () => set({ notifications: [], unreadCount: 0, lastMessage: null }),
}));
