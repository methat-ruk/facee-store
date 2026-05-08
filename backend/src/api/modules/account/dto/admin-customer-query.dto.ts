import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminCustomerQuerySchema = z.object({
  query: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(25),
});

export type AdminCustomerQuery = z.infer<typeof adminCustomerQuerySchema>;

export class AdminCustomerQueryDto extends createZodDto(
  adminCustomerQuerySchema,
) {}
