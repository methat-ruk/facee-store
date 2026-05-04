'use client';

import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { getShippingFee } from '@/features/checkout/checkout-ui';
import { getLocalizedProduct } from '@/features/products/localized-content';
import type { Product } from '@/features/products/schemas';
import { getProducts } from '@/services/catalog';
import {
  type CartItem,
  getCartItemCount,
  getCartSubtotal,
  useCartStore,
} from '@/store/use-cart-store';

type RefreshResult =
  | {
      status: 'ready';
      product: Product;
    }
  | {
      status: 'unavailable';
    }
  | {
      status: 'snapshot';
    };

export type CartViewItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
  stock: number | null;
  quantity: number;
  lineTotal: number;
  isUnavailable: boolean;
  isSnapshot: boolean;
  wasAdjusted: boolean;
};

function getSnapshotStock(item: CartItem) {
  return typeof item.stock === 'number' ? item.stock : null;
}

export function getCartTotal(items: CartViewItem[]) {
  return getCartSubtotal(items.filter((item) => !item.isUnavailable));
}

export function useCartView() {
  const locale = useLocale();
  const items = useCartStore((state) => state.items);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [refreshResults, setRefreshResults] = useState<
    Record<string, RefreshResult>
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshError, setHasRefreshError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const cartKey = useMemo(
    () => items.map((item) => `${item.id}:${item.slug}`).join('|'),
    [items],
  );

  useEffect(() => {
    let isCancelled = false;

    if (items.length === 0) {
      window.queueMicrotask(() => {
        if (isCancelled) {
          return;
        }

        setRefreshResults({});
        setIsRefreshing(false);
        setHasRefreshError(false);
      });

      return () => {
        isCancelled = true;
      };
    }

    window.queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setIsRefreshing(true);
      setHasRefreshError(false);
    });

    void getProducts({
      sort: 'name-asc',
      page: 1,
      limit: 24,
    })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        const nextResults = items.reduce<Record<string, RefreshResult>>(
          (acc, item) => {
            const matchedProduct = response.items.find(
              (product) => product.id === item.id || product.slug === item.slug,
            );

            acc[item.id] = matchedProduct
              ? {
                  status: 'ready',
                  product: matchedProduct,
                }
              : {
                  status: 'unavailable',
                };

            return acc;
          },
          {},
        );

        setRefreshResults(nextResults);
        setHasRefreshError(false);
        setIsRefreshing(false);

        for (const item of items) {
          const result = nextResults[item.id];

          if (result?.status !== 'ready') {
            continue;
          }

          if (
            result.product.stock > 0 &&
            item.quantity > result.product.stock
          ) {
            updateItemQuantity(item.id, result.product.stock);
          }
        }
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        const hasNotFoundError =
          axios.isAxiosError(error) && error.response?.status === 404;
        const fallbackResults = items.reduce<Record<string, RefreshResult>>(
          (acc, item) => {
            acc[item.id] = hasNotFoundError
              ? {
                  status: 'unavailable',
                }
              : {
                  status: 'snapshot',
                };
            return acc;
          },
          {},
        );

        setRefreshResults(fallbackResults);
        setHasRefreshError(!hasNotFoundError);
        setIsRefreshing(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [cartKey, items, refreshToken, updateItemQuantity]);

  const viewItems = useMemo<CartViewItem[]>(() => {
    return items.map((item) => {
      const refreshResult = refreshResults[item.id];

      if (refreshResult?.status === 'ready') {
        const localizedProduct = getLocalizedProduct(
          refreshResult.product,
          locale,
        );
        const quantity = Math.min(item.quantity, localizedProduct.stock);
        const isUnavailable = localizedProduct.stock === 0;

        return {
          id: item.id,
          productId: localizedProduct.id,
          slug: localizedProduct.slug,
          name: localizedProduct.name,
          imageUrl: localizedProduct.imageUrl,
          price: localizedProduct.price,
          stock: localizedProduct.stock,
          quantity: isUnavailable ? item.quantity : quantity,
          lineTotal: isUnavailable ? 0 : localizedProduct.price * quantity,
          isUnavailable,
          isSnapshot: false,
          wasAdjusted: !isUnavailable && quantity !== item.quantity,
        };
      }

      const snapshotStock = getSnapshotStock(item);
      const isUnavailable = refreshResult?.status === 'unavailable';

      return {
        id: item.id,
        productId: item.id,
        slug: item.slug,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        stock: snapshotStock,
        quantity: item.quantity,
        lineTotal: isUnavailable ? 0 : item.price * item.quantity,
        isUnavailable,
        isSnapshot: refreshResult?.status === 'snapshot',
        wasAdjusted: false,
      };
    });
  }, [items, locale, refreshResults]);

  const subtotal = getCartTotal(viewItems);
  const shipping = getShippingFee(subtotal);
  const total = subtotal + shipping;

  return {
    items,
    viewItems,
    itemCount: getCartItemCount(items),
    subtotal,
    shipping,
    total,
    isRefreshing,
    hasRefreshError,
    hasSnapshotItems: viewItems.some((item) => item.isSnapshot),
    hasAdjustedItems: viewItems.some((item) => item.wasAdjusted),
    hasUnavailableItems: viewItems.some((item) => item.isUnavailable),
    refreshCart: () => setRefreshToken((current) => current + 1),
    updateItemQuantity,
    removeItem,
    clearCart,
  };
}
