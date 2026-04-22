import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z.email('Please enter a valid email address.'),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
