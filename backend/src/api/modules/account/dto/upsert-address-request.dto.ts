import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const upsertAddressRequestSchema = z.object({
  label: z.string().trim().min(1),
  recipientFullName: z.string().trim().min(1),
  recipientEmail: z.email().trim().toLowerCase(),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^\d{1,10}$/),
  addressLine: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
});

export type UpsertAddressRequest = z.infer<typeof upsertAddressRequestSchema>;

export class UpsertAddressRequestDto extends createZodDto(
  upsertAddressRequestSchema,
) {}
