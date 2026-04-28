import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { cancellationReasonCodeSchema } from './order-detail-response.dto';

export const createCancellationRequestSchema = z
  .object({
    reasonCode: cancellationReasonCodeSchema,
    details: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === 'OTHER' && !data.details?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['details'],
        message: 'Additional details are required.',
      });
    }
  });

export type CreateCancellationRequest = z.infer<
  typeof createCancellationRequestSchema
>;

export class CreateCancellationRequestDto extends createZodDto(
  createCancellationRequestSchema,
) {}
