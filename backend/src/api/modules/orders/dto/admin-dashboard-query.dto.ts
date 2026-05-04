import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const adminDashboardQuerySchema = z
  .object({
    preset: z.enum(['day', 'month', 'year', 'range']).default('month'),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.preset === 'range' && (!value.start || !value.end)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Start and end are required when preset is range.',
        path: ['start'],
      });
    }
  });

export class AdminDashboardQueryDto extends createZodDto(
  adminDashboardQuerySchema,
) {}

export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>;
