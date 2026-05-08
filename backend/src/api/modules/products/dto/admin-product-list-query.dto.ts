import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminProductStatusFilterSchema = z.enum([
  'ALL',
  'PUBLISHED',
  'UNPUBLISHED',
]);

export const adminProductListQuerySchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: adminProductStatusFilterSchema.default('ALL'),
  flashSale: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  category: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export class AdminProductListQueryDto extends createZodDto(
  adminProductListQuerySchema,
) {}

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
