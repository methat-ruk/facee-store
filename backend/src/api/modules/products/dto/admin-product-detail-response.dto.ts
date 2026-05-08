import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { adminProductCategorySchema } from './admin-product-category-response.dto';

export const adminEditableProductSchema = z.object({
  id: z.cuid(),
  name: z.string(),
  sku: z.string(),
  slug: z.string(),
  subtitle: z.string().nullable(),
  sizeLabel: z.string().nullable(),
  description: z.string(),
  howToUse: z.string(),
  benefits: z.array(z.string()),
  ingredients: z.array(z.string()),
  imageUrl: z.string().nullable(),
  galleryImages: z.array(z.string()),
  isPublished: z.boolean(),
  isFlashSale: z.boolean(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable(),
  stock: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: adminProductCategorySchema,
  mediaAssets: z.array(
    z.object({
      originalName: z.string(),
      filename: z.string(),
      url: z.string(),
    }),
  ),
});

export const adminProductDetailResponseSchema = z.object({
  product: adminEditableProductSchema,
});

export class AdminProductDetailResponseDto extends createZodDto(
  adminProductDetailResponseSchema,
) {}
