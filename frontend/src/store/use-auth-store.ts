'use client';

import axios from 'axios';
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

export type AuthErrorKey =
  | 'errorEmailExists'
  | 'errorInvalidCredentials'
  | 'errorLoginFailed'
  | 'errorRegisterFailed';

type AuthStore = {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  errorKey: AuthErrorKey | null;
  refreshProfile: () => Promise<void>;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
};

function getErrorKey(error: unknown, fallback: AuthErrorKey): AuthErrorKey {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401) {
      return 'errorInvalidCredentials';
    }

    if (status === 409) {
      return 'errorEmailExists';
    }
  }

  return fallback;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  errorKey: null,
  refreshProfile: async () => {
    set({ isLoading: true, errorKey: null });

    try {
      const user = await getProfile();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },
  login: async (input) => {
    set({ isLoading: true, errorKey: null });

    try {
      const user = await login(input);
      set({ user, isLoading: false, isInitialized: true });
      return user;
    } catch (error) {
      const errorKey = getErrorKey(error, 'errorLoginFailed');
      set({ errorKey, isLoading: false, isInitialized: true });
      throw errorKey;
    }
  },
  register: async (input) => {
    set({ isLoading: true, errorKey: null });

    try {
      const user = await register(input);
      set({ user, isLoading: false, isInitialized: true });
      return user;
    } catch (error) {
      const errorKey = getErrorKey(error, 'errorRegisterFailed');
      set({ errorKey, isLoading: false, isInitialized: true });
      throw errorKey;
    }
  },
  logout: async () => {
    set({ isLoading: true, errorKey: null });

    try {
      await logout();
    } finally {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },
  clearError: () => set({ errorKey: null }),
}));
