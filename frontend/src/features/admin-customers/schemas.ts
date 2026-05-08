import { z } from 'zod';
import {
  accountProfileSchema,
  addressSchema,
} from '@/features/account/schemas';
import {
  orderStatusSchema,
  paymentMethodSchema,
  refundStatusSchema,
} from '@/features/orders/schemas';

export const adminCustomerListItemSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  createdAt: z.string(),
  orderCount: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  lastOrderAt: z.string().nullable(),
  pendingCancellationCount: z.number().int().nonnegative(),
});

export const adminCustomerListSchema = z.object({
  items: z.array(adminCustomerListItemSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const adminCustomerProfileSchema = accountProfileSchema.extend({
  phone: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminCustomerSummarySchema = z.object({
  orderCount: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  lastOrderAt: z.string().nullable(),
  pendingCancellationCount: z.number().int().nonnegative(),
});

export const adminCustomerRecentOrderSchema = z.object({
  orderNo: z.string(),
  status: orderStatusSchema,
  refundStatus: refundStatusSchema,
  paymentMethod: paymentMethodSchema,
  createdAt: z.string(),
  total: z.number().nonnegative(),
  hasPendingCancellationRequest: z.boolean(),
});

export const adminCustomerDetailSchema = z.object({
  profile: adminCustomerProfileSchema,
  summary: adminCustomerSummarySchema,
  addresses: z.array(addressSchema),
  recentOrders: z.array(adminCustomerRecentOrderSchema),
});

export const adminCustomerQuerySchema = z.object({
  query: z.string().trim().optional(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type AdminCustomerListItem = z.infer<typeof adminCustomerListItemSchema>;
export type AdminCustomerList = z.infer<typeof adminCustomerListSchema>;
export type AdminCustomerDetail = z.infer<typeof adminCustomerDetailSchema>;
export type AdminCustomerProfile = z.infer<typeof adminCustomerProfileSchema>;
export type AdminCustomerQuery = z.infer<typeof adminCustomerQuerySchema>;
export type AdminCustomerRecentOrder = z.infer<
  typeof adminCustomerRecentOrderSchema
>;
export type AdminCustomerSummary = z.infer<typeof adminCustomerSummarySchema>;
