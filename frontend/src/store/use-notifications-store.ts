'use client';

import { create } from 'zustand';
import type {
  NotificationItem,
  NotificationsSnapshot,
} from '@/features/notifications/schemas';
import {
  createNotificationsEventSource,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markOrderNotificationsAsRead,
  parseNotificationsEvent,
} from '@/services/notifications';

type NotificationsStore = {
  items: NotificationItem[];
  unreadCount: number;
  isInitialized: boolean;
  isConnecting: boolean;
  activeUserId: string | null;
  stream: EventSource | null;
  connect: (userId: string) => void;
  disconnect: () => void;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markOrderAsRead: (orderNo: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setSnapshot: (snapshot: NotificationsSnapshot) => void;
  clear: () => void;
};

function closeStream(stream: EventSource | null) {
  stream?.close();
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  items: [],
  unreadCount: 0,
  isInitialized: false,
  isConnecting: false,
  activeUserId: null,
  stream: null,
  connect: (userId) => {
    const current = get();

    if (current.activeUserId === userId && current.stream) {
      return;
    }

    closeStream(current.stream);
    set({
      activeUserId: userId,
      isConnecting: true,
      stream: null,
    });

    const stream = createNotificationsEventSource();
    stream.addEventListener('notifications.snapshot', (event) => {
      const snapshot = parseNotificationsEvent((event as MessageEvent).data);
      set({
        items: snapshot.items,
        unreadCount: snapshot.unreadCount,
        isInitialized: true,
        isConnecting: false,
      });
    });
    stream.addEventListener('error', () => {
      set({
        isConnecting: false,
      });
    });

    set({ stream });
  },
  disconnect: () => {
    const stream = get().stream;
    closeStream(stream);
    set({
      stream: null,
      activeUserId: null,
      isConnecting: false,
    });
  },
  refresh: async () => {
    const snapshot = await listNotifications();
    get().setSnapshot(snapshot);
  },
  markAsRead: async (notificationId) => {
    const snapshot = await markNotificationAsRead(notificationId);
    get().setSnapshot(snapshot);
  },
  markOrderAsRead: async (orderNo) => {
    const snapshot = await markOrderNotificationsAsRead(orderNo);
    get().setSnapshot(snapshot);
  },
  markAllAsRead: async () => {
    const snapshot = await markAllNotificationsAsRead();
    get().setSnapshot(snapshot);
  },
  setSnapshot: (snapshot) =>
    set({
      items: snapshot.items,
      unreadCount: snapshot.unreadCount,
      isInitialized: true,
      isConnecting: false,
    }),
  clear: () => {
    closeStream(get().stream);
    set({
      items: [],
      unreadCount: 0,
      isInitialized: false,
      isConnecting: false,
      activeUserId: null,
      stream: null,
    });
  },
}));
