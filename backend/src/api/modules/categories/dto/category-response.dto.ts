import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categoryResponseSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  slug: z.string(),
});

export const categoriesResponseSchema = z.array(categoryResponseSchema);

export class CategoryResponseDto extends createZodDto(categoryResponseSchema) {}
