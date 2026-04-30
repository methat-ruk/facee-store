import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

export const paymentMethodSchema = z.enum(['QR_PAYMENT', 'CARD']);

export const createOrderRequestSchema = z.object({
  addressId: z.string().trim().min(1),
  paymentMethod: paymentMethodSchema,
  items: z.array(createOrderItemSchema).min(1),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export class CreateOrderRequestDto extends createZodDto(
  createOrderRequestSchema,
) {}
