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
      paymentMethods: '/account/payment-methods',
      paymentMethodDetail: (paymentMethodId: string) =>
        `/account/payment-methods/${paymentMethodId}`,
      paymentMethodDefault: (paymentMethodId: string) =>
        `/account/payment-methods/${paymentMethodId}/default`,
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
    orderPaymentDemoConfirm: (orderNo: string) =>
      `/orders/${orderNo}/payment-demo/confirm`,
    orderPaymentMethod: (orderNo: string) =>
      `/orders/${orderNo}/payment-method`,
    orderCancellationRequests: (orderNo: string) =>
      `/orders/${orderNo}/cancellation-requests`,
    notifications: {
      list: '/notifications',
      stream: '/notifications/stream',
      readAll: '/notifications/read-all',
      read: (notificationId: string) => `/notifications/${notificationId}/read`,
      readOrder: (orderNo: string) => `/notifications/orders/${orderNo}/read`,
    },
    admin: {
      dashboard: '/admin/dashboard',
      orders: '/admin/orders',
      orderDetail: (orderNo: string) => `/admin/orders/${orderNo}`,
      cancellationReview: (requestId: string) =>
        `/admin/cancellation-requests/${requestId}/review`,
      refundStatus: (orderNo: string) =>
        `/admin/orders/${orderNo}/refund-status`,
      confirmQrPayment: (orderNo: string) =>
        `/admin/orders/${orderNo}/confirm-qr-payment`,
      customers: {
        list: '/admin/customers',
        detail: (customerId: string) => `/admin/customers/${customerId}`,
      },
      products: '/admin/products',
      productCategories: '/admin/products/categories',
      productDetail: (productId: string) => `/admin/products/${productId}`,
      productUpload: '/admin/products/upload',
    },
  },
} as const;

export function buildApiUrl(path: string) {
  const normalizedBaseUrl = apiConfig.baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  return `${normalizedBaseUrl}/${normalizedPath}`;
}
