import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const cancellationRequestParamSchema = z.object({
  requestId: z.cuid(),
});

export class CancellationRequestParamDto extends createZodDto(
  cancellationRequestParamSchema,
) {}
