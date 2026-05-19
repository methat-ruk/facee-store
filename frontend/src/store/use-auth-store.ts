'use client';

import { create } from 'zustand';
import {
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  getProfile,
  login,
  logout,
  refreshSession,
  register,
} from '@/services/auth';
import type { AuthErrorSource } from '@/features/auth/classify-auth-error';
import { type ApiError, toApiError } from '@/services/api-error';
import {
  clearStoredAuthTokens,
  getStoredRefreshToken,
  persistAuthTokens,
} from '@/lib/auth-tokens';

type AuthStore = {
  user: AuthUser | null;
  isInitialized: boolean;
  isRestoringProfile: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  error: ApiError | null;
  errorSource: AuthErrorSource | null;
  refreshProfile: () => Promise<void>;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isInitialized: false,
  isRestoringProfile: false,
  isLoggingIn: false,
  isRegistering: false,
  isLoggingOut: false,
  error: null,
  errorSource: null,
  refreshProfile: async () => {
    set({ isRestoringProfile: true, error: null, errorSource: null });

    const refreshToken = getStoredRefreshToken();
    const hadStoredSession = refreshToken !== null;

    if (!refreshToken) {
      set({
        user: null,
        isRestoringProfile: false,
        isInitialized: true,
      });
      return;
    }

    try {
      try {
        const user = await getProfile();
        set({
          user,
          isRestoringProfile: false,
          isInitialized: true,
        });
        return;
      } catch {
        const session = await refreshSession(refreshToken);
        persistAuthTokens({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          accessTokenExpiresAt: session.accessTokenExpiresAt,
          refreshTokenExpiresAt: session.refreshTokenExpiresAt,
        });
        set({
          user: session.user,
          isRestoringProfile: false,
          isInitialized: true,
        });
        return;
      }
    } catch (error) {
      clearStoredAuthTokens();

      if (!hadStoredSession) {
        set({
          user: null,
          isRestoringProfile: false,
          isInitialized: true,
        });
        return;
      }

      set({
        user: null,
        isRestoringProfile: false,
        isInitialized: true,
        error: toApiError(error, {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to restore the current session.',
          statusCode: 500,
        }),
        errorSource: 'profile-restore',
      });
    }
  },
  login: async (input) => {
    set({ isLoggingIn: true, error: null, errorSource: null });

    try {
      const session = await login(input);
      persistAuthTokens({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        accessTokenExpiresAt: session.accessTokenExpiresAt,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      });
      set({ user: session.user, isLoggingIn: false, isInitialized: true });
      return session.user;
    } catch (error) {
      const apiError = toApiError(error, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to sign in. Please try again.',
      });

      set({
        error: apiError,
        errorSource: 'login',
        isLoggingIn: false,
        isInitialized: true,
      });
      throw apiError;
    }
  },
  register: async (input) => {
    set({ isRegistering: true, error: null, errorSource: null });

    try {
      const session = await register(input);
      persistAuthTokens({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        accessTokenExpiresAt: session.accessTokenExpiresAt,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      });
      set({ user: session.user, isRegistering: false, isInitialized: true });
      return session.user;
    } catch (error) {
      const apiError = toApiError(error, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to create account. Please try again.',
      });

      set({
        error: apiError,
        errorSource: 'register',
        isRegistering: false,
        isInitialized: true,
      });
      throw apiError;
    }
  },
  logout: async () => {
    set({ isLoggingOut: true, error: null, errorSource: null });

    try {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        await logout(refreshToken);
      }
      clearStoredAuthTokens();
      set({
        user: null,
        isLoggingOut: false,
        isInitialized: true,
        errorSource: null,
      });
    } catch (error) {
      clearStoredAuthTokens();
      const apiError = toApiError(error, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to log out. Please try again.',
      });

      set({
        user: null,
        error: apiError,
        errorSource: 'logout',
        isLoggingOut: false,
        isInitialized: true,
      });
    }
  },
  clearError: () => set({ error: null, errorSource: null }),
  clearSession: () => {
    clearStoredAuthTokens();
    set({
      user: null,
      isInitialized: true,
      isRestoringProfile: false,
      error: null,
      errorSource: null,
    });
  },
}));
