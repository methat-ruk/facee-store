import { z } from 'zod';
import {
  cancellationReasonCodeSchema,
  orderListItemSchema,
} from '@/features/orders/schemas';

export const adminDashboardPresetSchema = z.enum([
  'day',
  'month',
  'year',
  'range',
]);

export const adminDashboardSummarySchema = z.object({
  pendingOrdersCount: z.number().int().nonnegative(),
  pendingCancellationCount: z.number().int().nonnegative(),
  lowStockProductsCount: z.number().int().nonnegative(),
  paidTodayRevenue: z.number().nonnegative(),
});

export const adminDashboardCancellationQueueItemSchema = z.object({
  requestId: z.string(),
  orderNo: z.string(),
  customerName: z.string(),
  reasonCode: cancellationReasonCodeSchema,
  requestedAt: z.string(),
  orderTotal: z.number().nonnegative(),
});

export const adminDashboardStockAlertSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productSlug: z.string(),
  imageUrl: z.string().nullable(),
  stock: z.number().int().nonnegative(),
  categoryName: z.string(),
});

export const adminDashboardSchema = z.object({
  summary: adminDashboardSummarySchema,
  pendingCancellationRequests: z.array(
    adminDashboardCancellationQueueItemSchema,
  ),
  recentOrders: z.array(orderListItemSchema),
  stockAlerts: z.array(adminDashboardStockAlertSchema),
});

export type AdminDashboard = z.infer<typeof adminDashboardSchema>;
export type AdminDashboardPreset = z.infer<typeof adminDashboardPresetSchema>;
