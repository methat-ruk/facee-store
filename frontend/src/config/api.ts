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
    storefront: {
      products: '/products',
      productDetail: (slug: string) => `/products/${slug}`,
      categories: '/categories',
      collections: '/collections',
    },
    cart: '/cart',
    orders: '/orders',
    orderDetail: (orderNo: string) => `/orders/${orderNo}`,
    admin: {
      dashboard: '/admin/dashboard',
      products: '/admin/products',
      categories: '/admin/categories',
      orders: '/admin/orders',
      customers: '/admin/customers',
      campaigns: '/admin/campaigns',
    },
  },
} as const;

export function buildApiUrl(path: string) {
  return new URL(path, `${apiConfig.baseUrl}/`).toString();
}
