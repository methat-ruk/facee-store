import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  cancellationRequestStatusSchema,
  orderDetailContactSchema,
  refundStatusSchema,
} from './order-detail-response.dto';

export const orderListItemSchema = z.object({
  orderNo: z.string(),
  status: z.enum([
    'PENDING',
    'PAID',
    'PACKING',
    'SHIPPED',
    'DELIVERED',
    'CANCELED',
  ]),
  refundStatus: refundStatusSchema,
  createdAt: z.string().datetime(),
  total: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  previewItems: z.array(
    z.object({
      id: z.string(),
      productName: z.string(),
      productImageUrl: z.string().nullable(),
    }),
  ),
  contact: orderDetailContactSchema,
  hasPendingCancellationRequest: z.boolean(),
  latestCancellationRequestStatus: cancellationRequestStatusSchema.nullable(),
});

export const orderListResponseSchema = z.object({
  items: z.array(orderListItemSchema),
});

export class OrderListResponseDto extends createZodDto(
  orderListResponseSchema,
) {}
