import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { adminProductCategorySchema } from './admin-product-category-response.dto';

export const adminProductListItemSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  sku: z.string(),
  slug: z.string(),
  subtitle: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isPublished: z.boolean(),
  isFlashSale: z.boolean(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable(),
  stock: z.number().int().nonnegative(),
  updatedAt: z.string(),
  category: adminProductCategorySchema,
});

export const adminProductListMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().min(1),
});

export const adminProductListSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  publishedCount: z.number().int().nonnegative(),
  unpublishedCount: z.number().int().nonnegative(),
  flashSaleCount: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
});

export const adminProductListResponseSchema = z.object({
  items: z.array(adminProductListItemSchema),
  meta: adminProductListMetaSchema,
  summary: adminProductListSummarySchema,
});

export class AdminProductListResponseDto extends createZodDto(
  adminProductListResponseSchema,
) {}
