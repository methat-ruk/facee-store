import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paymentMethodSchema } from '../../orders/dto/create-order-request.dto';

export const savedPaymentMethodSchema = z.object({
  id: z.cuid(),
  type: paymentMethodSchema,
  label: z.string(),
  isDefault: z.boolean(),
  cardholderName: z.string().nullable(),
  cardLast4: z.string().nullable(),
  cardExpiryMonth: z.string().nullable(),
  cardExpiryYear: z.string().nullable(),
  bankName: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const savedPaymentMethodListResponseSchema = z.object({
  items: z.array(savedPaymentMethodSchema),
});

export class SavedPaymentMethodDto extends createZodDto(
  savedPaymentMethodSchema,
) {}

export class SavedPaymentMethodListResponseDto extends createZodDto(
  savedPaymentMethodListResponseSchema,
) {}
