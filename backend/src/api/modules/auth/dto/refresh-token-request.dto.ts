import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshTokenRequestDto extends createZodDto(
  refreshTokenRequestSchema,
) {}
