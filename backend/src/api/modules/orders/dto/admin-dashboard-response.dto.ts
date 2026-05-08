import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { orderListItemSchema } from './order-list-response.dto';
import { cancellationReasonCodeSchema } from './order-detail-response.dto';

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
  requestedAt: z.string().datetime(),
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

export const adminDashboardResponseSchema = z.object({
  summary: adminDashboardSummarySchema,
  pendingCancellationRequests: z.array(
    adminDashboardCancellationQueueItemSchema,
  ),
  recentOrders: z.array(orderListItemSchema),
  stockAlerts: z.array(adminDashboardStockAlertSchema),
});

export class AdminDashboardResponseDto extends createZodDto(
  adminDashboardResponseSchema,
) {}
