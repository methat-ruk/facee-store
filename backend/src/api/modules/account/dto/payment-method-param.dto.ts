import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const paymentMethodParamSchema = z.object({
  paymentMethodId: z.cuid(),
});

export class PaymentMethodParamDto extends createZodDto(
  paymentMethodParamSchema,
) {}
