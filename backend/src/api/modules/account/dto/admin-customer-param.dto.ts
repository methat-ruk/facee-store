import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminCustomerParamSchema = z.object({
  customerId: z.cuid(),
});

export class AdminCustomerParamDto extends createZodDto(
  adminCustomerParamSchema,
) {}
