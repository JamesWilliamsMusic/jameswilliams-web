'use client';

import { useState, FormEvent } from 'react';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation/schemas';

type Step = 'request' | 'reset' | 'success';

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep('reset');
        return;
      }

      if (response.status === 429) {
        setErrors({ server: 'Too many requests. Please try again later.' });
        return;
      }

      const data = await response.json();
      setErrors({ server: data.error?.message || 'Something went wrong. Please try again.' });
    } catch {
      setErrors({ server: 'Unable to connect. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ email, code, newPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      if (response.ok) {
        setStep('success');
        return;
      }

      if (response.status === 429) {
        setErrors({ server: 'Too many requests. Please try again later.' });
        return;
      }

      const data = await response.json();
      setErrors({ server: data.error?.message || 'Something went wrong. Please try again.' });
    } catch {
      setErrors({ server: 'Unable to connect. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="text-center space-y-4" role="status" aria-live="polite">
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Your password has been reset successfully.
        </div>
        <a
          href="/login"
          className="inline-block w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white text-center transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2"
        >
          Back to Sign In
        </a>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <form onSubmit={handleResetPassword} noValidate className="space-y-6">
        <p className="sr-only" role="status" aria-live="polite">
          Step 2 of 2: Enter the code sent to your email and choose a new password.
        </p>

        {errors.server && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
          >
            {errors.server}
          </div>
        )}

        <p className="text-sm text-[var(--color-text)]/70">
          We sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it below along with your new password.
        </p>

        <div>
          <label
            htmlFor="reset-code"
            className="font-label block mb-2 text-[var(--color-text)]"
          >
            Verification Code
          </label>
          <input
            id="reset-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'reset-code-error' : undefined}
            className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
              errors.code
                ? 'border-red-400'
                : 'border-[var(--color-surface2)]'
            }`}
            placeholder="123456"
          />
          {errors.code && (
            <p id="reset-code-error" className="mt-1.5 text-sm text-red-600" role="alert">
              {errors.code}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="reset-new-password"
            className="font-label block mb-2 text-[var(--color-text)]"
          >
            New Password
          </label>
          <input
            id="reset-new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={!!errors.newPassword}
            aria-describedby={errors.newPassword ? 'reset-password-error' : 'reset-password-hint'}
            className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
              errors.newPassword
                ? 'border-red-400'
                : 'border-[var(--color-surface2)]'
            }`}
            placeholder="••••••••"
          />
          {errors.newPassword ? (
            <p id="reset-password-error" className="mt-1.5 text-sm text-red-600" role="alert">
              {errors.newPassword}
            </p>
          ) : (
            <p id="reset-password-hint" className="mt-1.5 text-xs text-[var(--color-text)]/50">
              Min 8 characters, with uppercase, lowercase, number, and special character.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Resetting…' : 'Reset Password'}
        </button>

        <p className="text-center text-sm text-[var(--color-text)]/70">
          <a
            href="/login"
            className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 font-medium"
          >
            Back to Sign In
          </a>
        </p>
      </form>
    );
  }

  // Step 1: Request reset code
  return (
    <form onSubmit={handleRequestReset} noValidate className="space-y-6">
      <p className="sr-only" role="status" aria-live="polite">
        Step 1 of 2: Enter your email to receive a password reset code.
      </p>

      {errors.server && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
        >
          {errors.server}
        </div>
      )}

      <div>
        <label
          htmlFor="forgot-email"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'forgot-email-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            errors.email
              ? 'border-red-400'
              : 'border-[var(--color-surface2)]'
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="forgot-email-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending…' : 'Send Reset Code'}
      </button>

      <p className="text-center text-sm text-[var(--color-text)]/70">
        <a
          href="/login"
          className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 font-medium"
        >
          Back to Sign In
        </a>
      </p>
    </form>
  );
}
