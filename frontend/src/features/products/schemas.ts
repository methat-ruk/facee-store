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
  createdAt: z.iso.datetime(),
  sizeLabel: z.string().nullable(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  isFlashSale: z.boolean(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  stock: z.number().int(),
  soldCount: z.number().int(),
  category: categorySchema,
});

export const productDetailSchema = productSchema.extend({
  subtitle: z.string().nullable(),
  howToUse: z.string(),
  benefits: z.array(z.string()),
  ingredients: z.array(z.string()),
  galleryImages: z.array(z.string()),
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

export const productDetailResponseSchema = z.object({
  product: productDetailSchema,
  relatedProducts: z.array(productSchema),
});

export const catalogQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  query: z.string().trim().min(1).optional(),
  sort: productSortSchema.default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(24),
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
export type ProductDetailResponse = z.infer<typeof productDetailResponseSchema>;
export type ProductSort = z.infer<typeof productSortSchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
