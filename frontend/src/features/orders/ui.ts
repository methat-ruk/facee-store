import type { OrderDetail, OrderListItem } from '@/features/orders/schemas';

export function formatOrderPrice(value: number, locale = 'en') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatOrderDate(value: string, locale = 'en') {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getOrderStatusBadgeVariant(
  status: OrderListItem['status'] | OrderDetail['status'],
): 'outline' | 'secondary' | 'destructive' {
  switch (status) {
    case 'PENDING':
    case 'PAID':
    case 'PACKING':
      return 'secondary';
    case 'CANCELED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function getOrderStatusBadgeClassName(
  status: OrderListItem['status'] | OrderDetail['status'],
) {
  switch (status) {
    case 'PENDING':
      return 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100';
    case 'PAID':
      return 'border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-100';
    case 'PACKING':
      return 'border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-100';
    case 'SHIPPED':
      return 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-100';
    case 'DELIVERED':
      return 'border-teal-300 bg-teal-100 text-teal-900 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-100';
    case 'CANCELED':
      return 'border-destructive/30 bg-destructive/15 text-destructive dark:bg-destructive/20';
    default:
      return '';
  }
}

export function canDirectCancel(status: OrderDetail['status']) {
  return status === 'PENDING';
}

export function canRequestCancellation(status: OrderDetail['status']) {
  return status === 'PAID' || status === 'PACKING';
}
