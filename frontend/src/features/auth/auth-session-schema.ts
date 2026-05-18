import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  postalCode: z.string().nullable(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.string().datetime(),
  refreshTokenExpiresAt: z.string().datetime(),
});

export const authResponseSchema = z.object({
  user: authUserSchema,
  ...authTokensSchema.shape,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
