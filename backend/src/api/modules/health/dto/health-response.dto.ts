import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { APP_CONSTANTS } from '../../../../config/app.constants';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal(APP_CONSTANTS.serviceName),
  timestamp: z.iso.datetime(),
});

export class HealthResponseDto extends createZodDto(healthResponseSchema) {}
