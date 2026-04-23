import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { productListItemSchema } from './product-list-response.dto';

export const productDetailSchema = productListItemSchema.extend({
  subtitle: z.string().nullable(),
  howToUse: z.string(),
  benefits: z.array(z.string()),
  ingredients: z.array(z.string()),
  galleryImages: z.array(z.string()),
});

export const productDetailResponseSchema = z.object({
  product: productDetailSchema,
  relatedProducts: z.array(productListItemSchema),
});

export class ProductDetailResponseDto extends createZodDto(
  productDetailResponseSchema,
) {}
