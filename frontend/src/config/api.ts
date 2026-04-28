import { appEnv } from '@/lib/env';

export const API_TIMEOUT_MS = 15_000;

export const apiConfig = {
  baseUrl: appEnv.apiUrl,
  endpoints: {
    health: '/health',
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/profile',
      logout: '/auth/logout',
    },
    account: {
      profile: '/account/profile',
      addresses: '/account/addresses',
      addressDetail: (addressId: string) => `/account/addresses/${addressId}`,
      addressDefault: (addressId: string) =>
        `/account/addresses/${addressId}/default`,
    },
    storefront: {
      products: '/products',
      productDetail: (slug: string) => `/products/${slug}`,
      categories: '/categories',
      collections: '/collections',
    },
    cart: '/cart',
    orders: '/orders',
    orderDetail: (orderNo: string) => `/orders/${orderNo}`,
    orderCancel: (orderNo: string) => `/orders/${orderNo}/cancel`,
    orderCancellationRequests: (orderNo: string) =>
      `/orders/${orderNo}/cancellation-requests`,
    admin: {
      orders: '/admin/orders',
      orderDetail: (orderNo: string) => `/admin/orders/${orderNo}`,
      cancellationReview: (requestId: string) =>
        `/admin/cancellation-requests/${requestId}/review`,
      refundStatus: (orderNo: string) =>
        `/admin/orders/${orderNo}/refund-status`,
    },
  },
} as const;

export function buildApiUrl(path: string) {
  return new URL(path, `${apiConfig.baseUrl}/`).toString();
}
