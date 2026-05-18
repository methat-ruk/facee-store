'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { useNotificationsStore } from '@/store/use-notifications-store';

type NotificationsProviderProps = {
  children: React.ReactNode;
};

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isRestoringProfile = useAuthStore((state) => state.isRestoringProfile);
  const connect = useNotificationsStore((state) => state.connect);
  const clear = useNotificationsStore((state) => state.clear);
  const refresh = useNotificationsStore((state) => state.refresh);

  useEffect(() => {
    if (!isInitialized || isRestoringProfile) {
      return;
    }

    if (!user) {
      clear();
      return;
    }

    connect(user.id);
  }, [clear, connect, isInitialized, isRestoringProfile, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh, user]);

  return children;
}
