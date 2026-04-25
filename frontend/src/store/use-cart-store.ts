'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  stock?: number | null;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (currentItem) => currentItem.id === item.id,
          );

          if (!existingItem) {
            return {
              items: [...state.items, item],
            };
          }

          return {
            items: state.items.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    imageUrl: item.imageUrl,
                    name: item.name,
                    price: item.price,
                    slug: item.slug,
                    stock: item.stock ?? currentItem.stock,
                    quantity: currentItem.quantity + item.quantity,
                  }
                : currentItem,
            ),
          };
        }),
      updateItemQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.max(1, quantity),
                }
              : item,
          ),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearCart: () =>
        set(() => ({
          items: [],
        })),
    }),
    {
      name: 'facee-cart-store',
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
