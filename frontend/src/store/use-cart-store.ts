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

function clampCartQuantity(quantity: number, stock?: number | null) {
  const normalizedQuantity = Math.max(1, quantity);

  if (typeof stock === 'number' && stock > 0) {
    return Math.min(normalizedQuantity, stock);
  }

  return normalizedQuantity;
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
            const nextQuantity = clampCartQuantity(item.quantity, item.stock);

            return {
              items: [
                ...state.items,
                {
                  ...item,
                  quantity: nextQuantity,
                },
              ],
            };
          }

          const nextStock = item.stock ?? existingItem.stock;
          const nextQuantity = clampCartQuantity(
            existingItem.quantity + item.quantity,
            nextStock,
          );

          return {
            items: state.items.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    imageUrl: item.imageUrl,
                    name: item.name,
                    price: item.price,
                    slug: item.slug,
                    stock: nextStock,
                    quantity: nextQuantity,
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
                  quantity: clampCartQuantity(quantity, item.stock),
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
