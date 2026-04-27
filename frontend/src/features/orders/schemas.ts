import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
]);

export const createOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

export const createOrderInputSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.email().trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\d{1,10}$/),
  addressLine: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
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

export const orderDetailSchema = z.object({
  orderNo: z.string(),
  status: orderStatusSchema,
  createdAt: z.string(),
  contact: orderDetailContactSchema,
  items: z.array(orderDetailItemSchema),
  subtotal: z.number().nonnegative(),
  shippingTotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
