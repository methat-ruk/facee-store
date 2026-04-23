'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
};

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
                    quantity: currentItem.quantity + item.quantity,
                  }
                : currentItem,
            ),
          };
        }),
    }),
    {
      name: 'facee-cart-store',
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
