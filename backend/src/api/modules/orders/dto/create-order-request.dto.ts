import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.cuid(),
  quantity: z.number().int().positive(),
});

export const createOrderRequestSchema = z.object({
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

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export class CreateOrderRequestDto extends createZodDto(
  createOrderRequestSchema,
) {}
