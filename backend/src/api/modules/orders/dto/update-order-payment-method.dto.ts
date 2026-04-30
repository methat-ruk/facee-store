import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paymentMethodSchema } from './create-order-request.dto';

export const updateOrderPaymentMethodSchema = z.object({
  paymentMethod: paymentMethodSchema,
});

export type UpdateOrderPaymentMethod = z.infer<
  typeof updateOrderPaymentMethodSchema
>;

export class UpdateOrderPaymentMethodDto extends createZodDto(
  updateOrderPaymentMethodSchema,
) {}
