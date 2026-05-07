import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminProductCategorySchema = z.object({
  id: z.cuid(),
  name: z.string(),
  slug: z.string(),
});

export const adminProductCategoriesResponseSchema = z.array(
  adminProductCategorySchema,
);

export class AdminProductCategoryResponseDto extends createZodDto(
  adminProductCategorySchema,
) {}
