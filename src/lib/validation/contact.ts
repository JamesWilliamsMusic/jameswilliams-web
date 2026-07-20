import { z } from 'zod';

/**
 * Contact form validation schema.
 * Validates and transforms user input for the /contact page submission.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .transform((v) => v.trim()),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be at most 254 characters')
    .transform((v) => v.trim().toLowerCase()),
  subject: z
    .string()
    .max(200, 'Subject must be at most 200 characters')
    .optional()
    .default('')
    .transform((v) => v.trim()),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters')
    .transform((v) => v.trim()),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
