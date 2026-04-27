import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { authProfileResponseSchema } from './auth-profile-response.dto';

export const authSessionResponseSchema = z.object({
  authenticated: z.boolean(),
  user: authProfileResponseSchema.nullable(),
});

export class AuthSessionResponseDto extends createZodDto(
  authSessionResponseSchema,
) {}
