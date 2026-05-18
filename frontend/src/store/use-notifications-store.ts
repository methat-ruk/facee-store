'use client';

import { create } from 'zustand';
import type {
  NotificationItem,
  NotificationsSnapshot,
} from '@/features/notifications/schemas';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markOrderNotificationsAsRead,
  mergeNotificationsSnapshot,
} from '@/services/notifications';

const POLL_INTERVAL_MS = 30_000;

type NotificationsStore = {
  items: NotificationItem[];
  unreadCount: number;
  isInitialized: boolean;
  isConnecting: boolean;
  activeUserId: string | null;
  pollerId: number | null;
  connect: (userId: string) => void;
  disconnect: () => void;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markOrderAsRead: (orderNo: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setSnapshot: (snapshot: NotificationsSnapshot) => void;
  clear: () => void;
};

function clearPoller(pollerId: number | null) {
  if (pollerId !== null) {
    window.clearInterval(pollerId);
  }
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  items: [],
  unreadCount: 0,
  isInitialized: false,
  isConnecting: false,
  activeUserId: null,
  pollerId: null,
  connect: (userId) => {
    const current = get();

    if (current.activeUserId === userId && current.pollerId !== null) {
      return;
    }

    clearPoller(current.pollerId);
    set({
      activeUserId: userId,
      isConnecting: true,
      pollerId: null,
    });

    void get().refresh();

    const pollerId = window.setInterval(() => {
      void get().refresh();
    }, POLL_INTERVAL_MS);

    set({ pollerId });
  },
  disconnect: () => {
    clearPoller(get().pollerId);
    set({
      pollerId: null,
      activeUserId: null,
      isConnecting: false,
    });
  },
  refresh: async () => {
    try {
      const snapshot = await listNotifications();
      get().setSnapshot(snapshot);
    } catch {
      set({
        isConnecting: false,
      });
    }
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
  setSnapshot: (snapshot) => {
    const parsedSnapshot = mergeNotificationsSnapshot(snapshot);

    set({
      items: parsedSnapshot.items,
      unreadCount: parsedSnapshot.unreadCount,
      isInitialized: true,
      isConnecting: false,
    });
  },
  clear: () => {
    clearPoller(get().pollerId);
    set({
      items: [],
      unreadCount: 0,
      isInitialized: false,
      isConnecting: false,
      activeUserId: null,
      pollerId: null,
    });
  },
}));
