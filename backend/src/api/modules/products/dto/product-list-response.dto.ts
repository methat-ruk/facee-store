import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const productCategorySchema = z.object({
  id: z.cuid(),
  name: z.string(),
  slug: z.string(),
});

export const productListItemSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  isFlashSale: z.boolean(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable(),
  stock: z.number().int().nonnegative(),
  category: productCategorySchema,
});

export const productListMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().min(1),
});

export const productListResponseSchema = z.object({
  items: z.array(productListItemSchema),
  meta: productListMetaSchema,
});

export class ProductListResponseDto extends createZodDto(
  productListResponseSchema,
) {}
