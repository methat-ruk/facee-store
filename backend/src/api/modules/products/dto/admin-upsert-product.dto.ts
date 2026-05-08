import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const productTextSchema = z.string().trim().min(1);
const productStringArraySchema = z.array(productTextSchema).default([]);
const productSkuSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9-]+$/)
  .transform((value) => value.toUpperCase());
const productMediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.startsWith('/') || z.string().url().safeParse(value).success,
    'Invalid media URL.',
  );

export const adminProductBaseInputSchema = z
  .object({
    name: productTextSchema,
    sku: productSkuSchema,
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    subtitle: z.string().trim().max(160).nullable(),
    sizeLabel: z.string().trim().max(40).nullable().optional(),
    description: productTextSchema,
    howToUse: productTextSchema,
    benefits: productStringArraySchema,
    ingredients: productStringArraySchema,
    imageUrl: productMediaUrlSchema.nullable(),
    galleryImages: z.array(productMediaUrlSchema).default([]),
    isPublished: z.boolean(),
    isFlashSale: z.boolean(),
    price: z.coerce.number().nonnegative(),
    compareAtPrice: z.coerce.number().nonnegative().nullable(),
    stock: z.coerce.number().int().nonnegative(),
    categoryId: z.cuid(),
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

export const createAdminProductSchema = adminProductBaseInputSchema;

export class CreateAdminProductDto extends createZodDto(
  createAdminProductSchema,
) {}

export const updateAdminProductSchema = z
  .object({
    name: productTextSchema.optional(),
    sku: productSkuSchema.optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    subtitle: z.string().trim().max(160).nullable().optional(),
    sizeLabel: z.string().trim().max(40).nullable().optional(),
    description: productTextSchema.optional(),
    howToUse: productTextSchema.optional(),
    benefits: z.array(productTextSchema).optional(),
    ingredients: z.array(productTextSchema).optional(),
    imageUrl: productMediaUrlSchema.nullable().optional(),
    galleryImages: z.array(productMediaUrlSchema).optional(),
    isPublished: z.boolean().optional(),
    isFlashSale: z.boolean().optional(),
    price: z.coerce.number().nonnegative().optional(),
    compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    categoryId: z.cuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.compareAtPrice !== undefined &&
      value.compareAtPrice !== null &&
      value.price !== undefined &&
      value.compareAtPrice <= value.price
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Compare-at price must be greater than price.',
        path: ['compareAtPrice'],
      });
    }
  });

export class UpdateAdminProductDto extends createZodDto(
  updateAdminProductSchema,
) {}

export type CreateAdminProductInput = z.infer<typeof createAdminProductSchema>;
export type UpdateAdminProductInput = z.infer<typeof updateAdminProductSchema>;
