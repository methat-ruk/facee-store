import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const accountProfileSchema = z.object({
  id: z.cuid(),
  email: z.email(),
  fullName: z.string(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
});

export class AccountProfileDto extends createZodDto(accountProfileSchema) {}
