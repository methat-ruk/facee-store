import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
]);

export const refundStatusSchema = z.enum([
  'NONE',
  'PENDING_MANUAL',
  'REFUNDED',
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

export const createOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

export const createOrderInputSchema = z.object({
  addressId: z.string(),
  items: z.array(createOrderItemSchema).min(1),
});

export const createOrderResponseSchema = z.object({
  orderNo: z.string(),
});

export const orderDetailContactSchema = z.object({
  fullName: z.string(),
  email: z.email(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  postalCode: z.string(),
});

export const orderDetailItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  productSlug: z.string(),
  productImageUrl: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
});

export const cancellationRequestSummarySchema = z.object({
  id: z.string(),
  reasonCode: cancellationReasonCodeSchema,
  details: z.string().nullable(),
  status: cancellationRequestStatusSchema,
  reviewNote: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const orderDetailSchema = z.object({
  orderNo: z.string(),
  status: orderStatusSchema,
  refundStatus: refundStatusSchema,
  createdAt: z.string(),
  contact: orderDetailContactSchema,
  items: z.array(orderDetailItemSchema),
  subtotal: z.number().nonnegative(),
  shippingTotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  latestCancellationRequest: cancellationRequestSummarySchema.nullable(),
});

export const orderListItemSchema = z.object({
  orderNo: z.string(),
  status: orderStatusSchema,
  refundStatus: refundStatusSchema,
  createdAt: z.string(),
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

export const orderListSchema = z.object({
  items: z.array(orderListItemSchema),
});

export const createCancellationRequestInputSchema = z
  .object({
    reasonCode: cancellationReasonCodeSchema,
    details: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === 'OTHER' && !data.details?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['details'],
        message: 'Additional details are required.',
      });
    }
  });

export const reviewCancellationRequestInputSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().trim().optional(),
});

export const updateRefundStatusInputSchema = z.object({
  refundStatus: z.enum(['PENDING_MANUAL', 'REFUNDED']),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type OrderList = z.infer<typeof orderListSchema>;
export type OrderListItem = z.infer<typeof orderListItemSchema>;
export type CreateCancellationRequestInput = z.infer<
  typeof createCancellationRequestInputSchema
>;
export type ReviewCancellationRequestInput = z.infer<
  typeof reviewCancellationRequestInputSchema
>;
export type UpdateRefundStatusInput = z.infer<
  typeof updateRefundStatusInputSchema
>;
