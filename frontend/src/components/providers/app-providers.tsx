'use client';

import { AuthErrorFeedbackProvider } from '@/components/providers/auth-error-feedback-provider';
import { AuthSessionExpiryProvider } from '@/components/providers/auth-session-expiry-provider';
import { AuthSessionProvider } from '@/components/providers/auth-session-provider';
import { NotificationsProvider } from '@/components/providers/notifications-provider';
import { ToastProvider } from '@/components/providers/toast-provider';

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthSessionProvider>
      <NotificationsProvider>
        <AuthErrorFeedbackProvider />
        <AuthSessionExpiryProvider />
        {children}
        <ToastProvider />
      </NotificationsProvider>
    </AuthSessionProvider>
  );
}
