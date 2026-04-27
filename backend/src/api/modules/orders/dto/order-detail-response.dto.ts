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

export const orderDetailResponseSchema = z.object({
  orderNo: z.string(),
  status: z.enum([
    'PENDING',
    'PAID',
    'PACKING',
    'SHIPPED',
    'DELIVERED',
    'CANCELED',
  ]),
  createdAt: z.string().datetime(),
  contact: orderDetailContactSchema,
  items: z.array(orderDetailItemSchema),
  subtotal: z.number().nonnegative(),
  shippingTotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export class OrderDetailResponseDto extends createZodDto(
  orderDetailResponseSchema,
) {}
