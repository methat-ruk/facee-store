import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminProductParamSchema = z.object({
  productId: z.cuid(),
});

export class AdminProductParamDto extends createZodDto(
  adminProductParamSchema,
) {}
