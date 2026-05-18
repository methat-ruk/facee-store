import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { authProfileResponseSchema } from './auth-profile-response.dto';
import { authTokensResponseSchema } from './auth-tokens-response.dto';

export const authResponseSchema = z.object({
  user: authProfileResponseSchema,
  ...authTokensResponseSchema.shape,
});

export class AuthResponseDto extends createZodDto(authResponseSchema) {}
