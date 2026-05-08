import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const productSortSchema = z.enum([
  'newest',
  'price-asc',
  'price-desc',
  'name-asc',
]);

export const getProductsQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  query: z.string().trim().min(1).optional(),
  sort: productSortSchema.default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(24),
});

export class GetProductsQueryDto extends createZodDto(getProductsQuerySchema) {}

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
