import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const addressSchema = z.object({
  id: z.cuid(),
  label: z.string(),
  recipientFullName: z.string(),
  recipientEmail: z.email(),
  recipientPhone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  postalCode: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const addressListResponseSchema = z.object({
  items: z.array(addressSchema),
});

export class AddressDto extends createZodDto(addressSchema) {}

export class AddressListResponseDto extends createZodDto(
  addressListResponseSchema,
) {}
