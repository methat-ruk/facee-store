'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  buildAuthNoticeHref,
  buildReturnTo,
} from '@/features/auth/auth-routing';
import { AUTH_UNAUTHORIZED_EVENT } from '@/services/api';
import { useAuthStore } from '@/store/use-auth-store';

export function AuthSessionExpiryProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearError = useAuthStore((state) => state.clearError);
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!user || pathname === '/login' || pathname === '/register') {
        return;
      }

      clearError();
      clearSession();
      router.replace(
        buildAuthNoticeHref(
          '/login',
          'session-expired',
          buildReturnTo(pathname, searchParams),
        ),
      );
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [clearError, clearSession, pathname, router, searchParams, user]);

  return null;
}
