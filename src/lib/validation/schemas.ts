import { z } from 'zod';

/**
 * Reusable password schema with complexity rules.
 * Requires: 8-128 chars, uppercase, lowercase, number, special character.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

/**
 * Reusable email schema with max length per RFC 5321.
 */
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email must be at most 254 characters');

/**
 * Reusable 6-digit verification code schema.
 */
const verificationCodeSchema = z
  .string()
  .length(6, 'Code must be exactly 6 digits')
  .regex(/^\d{6}$/, 'Code must contain only digits');

/**
 * Login: validates email and password (no complexity rules — just length).
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

/**
 * Signup: validates email, password with complexity rules, and consent.
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy' }),
  }),
});

/**
 * Confirm signup: validates email and 6-digit verification code.
 */
export const confirmSignupSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema,
});

/**
 * Forgot password: validates email only.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password: validates email, 6-digit code, and new password with complexity rules.
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema,
  newPassword: passwordSchema,
});

/**
 * Notification preferences: validates categories with boolean values.
 */
export const preferencesSchema = z.object({
  categories: z.object({
    new_song: z.boolean({ required_error: 'new_song preference is required' }),
    new_album: z.boolean({ required_error: 'new_album preference is required' }),
    blog_post: z.boolean({ required_error: 'blog_post preference is required' }),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ConfirmSignupInput = z.infer<typeof confirmSignupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
