'use client';

import { AuthSessionProvider } from '@/components/providers/auth-session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </ThemeProvider>
  );
}
