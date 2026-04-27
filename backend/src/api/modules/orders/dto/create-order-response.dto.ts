import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createOrderResponseSchema = z.object({
  orderNo: z.string(),
});

export class CreateOrderResponseDto extends createZodDto(
  createOrderResponseSchema,
) {}
