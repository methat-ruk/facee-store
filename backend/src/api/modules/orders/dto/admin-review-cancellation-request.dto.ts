import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminReviewCancellationRequestSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().trim().optional(),
});

export type AdminReviewCancellationRequest = z.infer<
  typeof adminReviewCancellationRequestSchema
>;

export class AdminReviewCancellationRequestDto extends createZodDto(
  adminReviewCancellationRequestSchema,
) {}
