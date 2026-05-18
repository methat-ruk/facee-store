import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const authTokensResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accessTokenExpiresAt: z.string().datetime(),
  refreshTokenExpiresAt: z.string().datetime(),
});

export class AuthTokensResponseDto extends createZodDto(
  authTokensResponseSchema,
) {}
