'use client';

import { create } from 'zustand';

export type ToastTone = 'error' | 'info' | 'success';

export type ToastItem = {
  id: string;
  title: string;
  description: string;
  durationMs?: number;
  tone: ToastTone;
};

type ToastStore = {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
