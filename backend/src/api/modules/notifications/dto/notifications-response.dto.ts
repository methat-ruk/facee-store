import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'ORDER_CREATED',
  'QR_PAYMENT_SUBMITTED',
  'QR_PAYMENT_CONFIRMED',
  'CANCELLATION_REQUESTED',
  'CANCELLATION_APPROVED',
  'CANCELLATION_REJECTED',
  'REFUND_PENDING',
  'REFUND_COMPLETED',
]);

export const notificationItemSchema = z.object({
  id: z.cuid(),
  type: notificationTypeSchema,
  orderNo: z.string().nullable(),
  titleEn: z.string(),
  titleTh: z.string(),
  bodyEn: z.string(),
  bodyTh: z.string(),
  isRead: z.boolean(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const notificationsResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
  items: z.array(notificationItemSchema),
});

export class NotificationsResponseDto extends createZodDto(
  notificationsResponseSchema,
) {}
