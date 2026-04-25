'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth-store';

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    void refreshProfile();
  }, [isInitialized, refreshProfile]);

  return children;
}
