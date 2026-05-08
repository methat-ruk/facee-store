import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const orderDetailItemSchema = z.object({
  id: z.cuid(),
  productId: z.cuid(),
  productName: z.string(),
  productSlug: z.string(),
  productImageUrl: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const orderDetailContactSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  postalCode: z.string(),
});

export const refundStatusSchema = z.enum([
  'NONE',
  'PENDING_MANUAL',
  'REFUNDED',
]);

export const paymentMethodSchema = z.enum(['QR_PAYMENT', 'CARD']);

export const paymentDemoStatusSchema = z.enum([
  'NOT_STARTED',
  'QR_SUBMITTED',
  'CARD_COMPLETED',
]);

export const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
]);

export const cancellationReasonCodeSchema = z.enum([
  'WRONG_ADDRESS',
  'DUPLICATE_ORDER',
  'CHANGED_MIND',
  'PAYMENT_ISSUE',
  'ORDER_DELAY',
  'OTHER',
]);

export const cancellationRequestStatusSchema = z.enum([
  'REQUESTED',
  'APPROVED',
  'REJECTED',
]);

export const cancellationRequestSummarySchema = z.object({
  id: z.cuid(),
  reasonCode: cancellationReasonCodeSchema,
  details: z.string().nullable(),
  status: cancellationRequestStatusSchema,
  reviewNote: z.string().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const orderDetailResponseSchema = z.object({
  orderNo: z.string(),
  status: orderStatusSchema,
  refundStatus: refundStatusSchema,
  paymentMethod: paymentMethodSchema,
  paymentDemoStatus: paymentDemoStatusSchema,
  paymentSubmittedAt: z.string().datetime().nullable(),
  paymentCompletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  contact: orderDetailContactSchema,
  items: z.array(orderDetailItemSchema),
  subtotal: z.number().nonnegative(),
  shippingTotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  latestCancellationRequest: cancellationRequestSummarySchema.nullable(),
});

export class OrderDetailResponseDto extends createZodDto(
  orderDetailResponseSchema,
) {}
