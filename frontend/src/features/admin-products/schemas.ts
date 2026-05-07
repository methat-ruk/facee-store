import { z } from 'zod';

const productMediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.startsWith('/') || z.string().url().safeParse(value).success,
    'Invalid media URL.',
  );
const productSkuSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9-]+$/)
  .transform((value) => value.toUpperCase());

export const adminProductStatusFilterSchema = z.enum([
  'ALL',
  'PUBLISHED',
  'UNPUBLISHED',
]);

export const adminProductCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const adminProductSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  slug: z.string(),
  subtitle: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isPublished: z.boolean(),
  isFlashSale: z.boolean(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  stock: z.number().int(),
  updatedAt: z.string(),
  category: adminProductCategorySchema,
});

export const adminProductDetailSchema = adminProductSummarySchema.extend({
  description: z.string(),
  howToUse: z.string(),
  benefits: z.array(z.string()),
  ingredients: z.array(z.string()),
  galleryImages: z.array(z.string()),
  createdAt: z.string(),
});

export const adminProductListSummarySchema = z.object({
  totalCount: z.number().int(),
  publishedCount: z.number().int(),
  unpublishedCount: z.number().int(),
  flashSaleCount: z.number().int(),
  lowStockCount: z.number().int(),
});

export const adminProductListResponseSchema = z.object({
  items: z.array(adminProductSummarySchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
  }),
  summary: adminProductListSummarySchema,
});

export const adminProductDetailResponseSchema = z.object({
  product: adminProductDetailSchema,
});

export const adminProductUploadResponseSchema = z.object({
  items: z.array(
    z.object({
      key: z.string(),
      url: z.string().url(),
      fileName: z.string(),
      contentType: z.string(),
      size: z.number().int(),
    }),
  ),
});

export const adminProductsQuerySchema = z.object({
  query: z.string().trim().min(1).optional(),
  status: adminProductStatusFilterSchema.default('ALL'),
  flashSale: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  category: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export const adminProductUpsertSchema = z
  .object({
    name: z.string().trim().min(1),
    sku: productSkuSchema,
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    subtitle: z.string().trim().max(160).nullable(),
    description: z.string().trim().min(1),
    howToUse: z.string().trim().min(1),
    benefits: z.array(z.string().trim().min(1)),
    ingredients: z.array(z.string().trim().min(1)),
    imageUrl: productMediaUrlSchema.nullable(),
    galleryImages: z.array(productMediaUrlSchema),
    isPublished: z.boolean(),
    isFlashSale: z.boolean(),
    price: z.coerce.number().nonnegative(),
    compareAtPrice: z.coerce.number().nonnegative().nullable(),
    stock: z.coerce.number().int().nonnegative(),
    categoryId: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.compareAtPrice !== null && value.compareAtPrice <= value.price) {
      ctx.addIssue({
        code: 'custom',
        message: 'Compare-at price must be greater than price.',
        path: ['compareAtPrice'],
      });
    }
  });

export type AdminProductStatusFilter = z.infer<
  typeof adminProductStatusFilterSchema
>;
export type AdminProductCategory = z.infer<typeof adminProductCategorySchema>;
export type AdminProductSummary = z.infer<typeof adminProductSummarySchema>;
export type AdminProductDetail = z.infer<typeof adminProductDetailSchema>;
export type AdminProductListResponse = z.infer<
  typeof adminProductListResponseSchema
>;
export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;
export type AdminProductUpsertInput = z.infer<typeof adminProductUpsertSchema>;
