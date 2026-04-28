import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.cuid(),
  quantity: z.number().int().positive(),
});

export const createOrderRequestSchema = z.object({
  addressId: z.cuid(),
  items: z.array(createOrderItemSchema).min(1),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export class CreateOrderRequestDto extends createZodDto(
  createOrderRequestSchema,
) {}
