import { z } from 'zod';

export const accountProfileSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
});

export const updateAccountProfileInputSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.email().trim().toLowerCase(),
});

export const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  recipientFullName: z.string(),
  recipientEmail: z.email(),
  recipientPhone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  postalCode: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const addressListSchema = z.object({
  items: z.array(addressSchema),
});

export const savedPaymentMethodTypeSchema = z.enum(['QR_PAYMENT', 'CARD']);

export const savedPaymentMethodSchema = z.object({
  id: z.string(),
  type: savedPaymentMethodTypeSchema,
  label: z.string(),
  isDefault: z.boolean(),
  cardholderName: z.string().nullable(),
  cardLast4: z.string().nullable(),
  cardExpiryMonth: z.string().nullable(),
  cardExpiryYear: z.string().nullable(),
  bankName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const savedPaymentMethodListSchema = z.object({
  items: z.array(savedPaymentMethodSchema),
});

export const upsertAddressInputSchema = z.object({
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

export const upsertSavedPaymentMethodInputSchema = z
  .object({
    type: savedPaymentMethodTypeSchema,
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

export type AccountProfile = z.infer<typeof accountProfileSchema>;
export type UpdateAccountProfileInput = z.infer<
  typeof updateAccountProfileInputSchema
>;
export type Address = z.infer<typeof addressSchema>;
export type AddressList = z.infer<typeof addressListSchema>;
export type UpsertAddressInput = z.infer<typeof upsertAddressInputSchema>;
export type SavedPaymentMethod = z.infer<typeof savedPaymentMethodSchema>;
export type SavedPaymentMethodList = z.infer<
  typeof savedPaymentMethodListSchema
>;
export type UpsertSavedPaymentMethodInput = z.infer<
  typeof upsertSavedPaymentMethodInputSchema
>;
