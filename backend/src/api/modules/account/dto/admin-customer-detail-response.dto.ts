import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { addressSchema } from './address.dto';
import {
  orderStatusSchema,
  paymentMethodSchema,
  refundStatusSchema,
} from '../../orders/dto/order-detail-response.dto';

export const adminCustomerProfileSchema = z.object({
  id: z.cuid(),
  fullName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const adminCustomerSummarySchema = z.object({
  orderCount: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  lastOrderAt: z.string().datetime().nullable(),
  pendingCancellationCount: z.number().int().nonnegative(),
});

export const adminCustomerRecentOrderSchema = z.object({
  orderNo: z.string(),
  status: orderStatusSchema,
  refundStatus: refundStatusSchema,
  paymentMethod: paymentMethodSchema,
  createdAt: z.string().datetime(),
  total: z.number().nonnegative(),
  hasPendingCancellationRequest: z.boolean(),
});

export const adminCustomerDetailResponseSchema = z.object({
  profile: adminCustomerProfileSchema,
  summary: adminCustomerSummarySchema,
  addresses: z.array(addressSchema),
  recentOrders: z.array(adminCustomerRecentOrderSchema),
});

export class AdminCustomerDetailResponseDto extends createZodDto(
  adminCustomerDetailResponseSchema,
) {}
