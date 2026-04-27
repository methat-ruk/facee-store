import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const authProfileResponseSchema = z.object({
  id: z.cuid(),
  email: z.email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
});

export class AuthProfileResponseDto extends createZodDto(
  authProfileResponseSchema,
) {}
