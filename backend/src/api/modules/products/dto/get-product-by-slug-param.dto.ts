import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const getProductBySlugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

export class GetProductBySlugParamDto extends createZodDto(
  getProductBySlugParamSchema,
) {}

export type GetProductBySlugParam = z.infer<typeof getProductBySlugParamSchema>;
