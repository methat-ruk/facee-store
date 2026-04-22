import { z } from 'zod';

export const productSortValues = [
  'newest',
  'price-asc',
  'price-desc',
  'name-asc',
] as const;

export const productSortSchema = z.enum(productSortValues);

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const categoriesResponseSchema = z.array(categorySchema);

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  price: z.number(),
  stock: z.number().int(),
  category: categorySchema,
});

export const productListMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(1),
});

export const productListResponseSchema = z.object({
  items: z.array(productSchema),
  meta: productListMetaSchema,
});

export const catalogQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  sort: productSortSchema.default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(9),
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
export type ProductSort = z.infer<typeof productSortSchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
