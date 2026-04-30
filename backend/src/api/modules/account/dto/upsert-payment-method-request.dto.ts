import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paymentMethodSchema } from '../../orders/dto/create-order-request.dto';

export const upsertPaymentMethodRequestSchema = z
  .object({
    type: paymentMethodSchema,
    label: z.string().trim().min(1),
    cardholderName: z.string().trim().optional(),
    cardLast4: z
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .optional(),
    cardExpiryMonth: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])$/)
      .optional(),
    cardExpiryYear: z
      .string()
      .trim()
      .regex(/^\d{2}$/)
      .optional(),
    bankName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'CARD') {
      if (!data.cardholderName?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardholderName'],
          message: 'Cardholder name is required.',
        });
      }
      if (!data.cardLast4?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardLast4'],
          message: 'Card last four digits are required.',
        });
      }
      if (!data.cardExpiryMonth?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardExpiryMonth'],
          message: 'Card expiry month is required.',
        });
      }
      if (!data.cardExpiryYear?.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardExpiryYear'],
          message: 'Card expiry year is required.',
        });
      }
    }

    if (data.type === 'QR_PAYMENT' && !data.bankName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['bankName'],
        message: 'Bank name is required.',
      });
    }
  });

export type UpsertPaymentMethodRequest = z.infer<
  typeof upsertPaymentMethodRequestSchema
>;

export class UpsertPaymentMethodRequestDto extends createZodDto(
  upsertPaymentMethodRequestSchema,
) {}
