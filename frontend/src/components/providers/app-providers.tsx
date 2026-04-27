'use client';

import { AuthErrorFeedbackProvider } from '@/components/providers/auth-error-feedback-provider';
import { AuthSessionExpiryProvider } from '@/components/providers/auth-session-expiry-provider';
import { AuthSessionProvider } from '@/components/providers/auth-session-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <AuthErrorFeedbackProvider />
        <AuthSessionExpiryProvider />
        {children}
        <ToastProvider />
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
