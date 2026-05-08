import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminCustomerListItemSchema = z.object({
  id: z.cuid(),
  fullName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  createdAt: z.string().datetime(),
  orderCount: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  lastOrderAt: z.string().datetime().nullable(),
  pendingCancellationCount: z.number().int().nonnegative(),
});

export const adminCustomerListResponseSchema = z.object({
  items: z.array(adminCustomerListItemSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export class AdminCustomerListResponseDto extends createZodDto(
  adminCustomerListResponseSchema,
) {}
