'use client';

import { create } from 'zustand';
import {
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  getProfile,
  login,
  logout,
  register,
} from '@/services/auth';
import type { AuthErrorSource } from '@/features/auth/classify-auth-error';
import { type ApiError, toApiError } from '@/services/api-error';

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

    try {
      const session = await getProfile();
      set({
        user: session.user,
        isRestoringProfile: false,
        isInitialized: true,
      });
    } catch (error) {
      const apiError = toApiError(error, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to restore the current session.',
        statusCode: 500,
      });

      set({
        user: null,
        isRestoringProfile: false,
        isInitialized: true,
        error: apiError,
        errorSource: 'profile-restore',
      });
    }
  },
  login: async (input) => {
    set({ isLoggingIn: true, error: null, errorSource: null });

    try {
      const user = await login(input);
      set({ user, isLoggingIn: false, isInitialized: true });
      return user;
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
      const user = await register(input);
      set({ user, isRegistering: false, isInitialized: true });
      return user;
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
      await logout();
      set({
        user: null,
        isLoggingOut: false,
        isInitialized: true,
        errorSource: null,
      });
    } catch (error) {
      const apiError = toApiError(error, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unable to log out. Please try again.',
      });

      set({
        error: apiError,
        errorSource: 'logout',
        isLoggingOut: false,
        isInitialized: true,
      });
      throw apiError;
    }
  },
  clearError: () => set({ error: null, errorSource: null }),
}));
