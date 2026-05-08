import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminProductUploadItemSchema = z.object({
  originalName: z.string(),
  filename: z.string(),
  url: z.string().url(),
  contentType: z.string(),
  size: z.number().int().nonnegative(),
});

export const adminProductUploadResponseSchema = z.object({
  items: z.array(adminProductUploadItemSchema),
});

export class AdminProductUploadResponseDto extends createZodDto(
  adminProductUploadResponseSchema,
) {}
