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

export type AccountProfile = z.infer<typeof accountProfileSchema>;
export type UpdateAccountProfileInput = z.infer<
  typeof updateAccountProfileInputSchema
>;
export type Address = z.infer<typeof addressSchema>;
export type AddressList = z.infer<typeof addressListSchema>;
export type UpsertAddressInput = z.infer<typeof upsertAddressInputSchema>;
