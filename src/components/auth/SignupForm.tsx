'use client';

import { useState, FormEvent } from 'react';
import { signupSchema, confirmSignupSchema } from '@/lib/validation/schemas';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

type FormStep = 'signup' | 'verify';

export default function SignupForm() {
  const [step, setStep] = useState<FormStep>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    consentAccepted?: string;
    code?: string;
    server?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const passwordRequirements = getPasswordRequirements(password);
  const showPasswordFeedback = password.length > 0;

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({ email, password, consentAccepted });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof typeof fieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, consentAccepted }),
      });

      if (response.ok) {
        setStep('verify');
        setSuccessMessage('Check your email for a verification code.');
        return;
      }

      if (response.status === 429) {
        setErrors({ server: 'Too many attempts. Please try again later.' });
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

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const result = confirmSignupSchema.safeParse({ email, code });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof typeof fieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        setSuccessMessage('Email verified! You can now sign in.');
        return;
      }

      if (response.status === 429) {
        setErrors({ server: 'Too many attempts. Please try again later.' });
        return;
      }

      const data = await response.json();
      setErrors({ server: data.error?.message || 'Invalid or expired code. Please try again.' });
    } catch {
      setErrors({ server: 'Unable to connect. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        {successMessage && !errors.server && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
          >
            {successMessage}
          </div>
        )}

        {successMessage === 'Email verified! You can now sign in.' ? (
          <div className="text-center">
            <p className="text-[var(--color-text)]/70 mb-4">
              Your account has been verified successfully.
            </p>
            <a
              href="/login"
              className="inline-block w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white text-center transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2"
            >
              Sign In
            </a>
          </div>
        ) : (
          <form onSubmit={handleVerify} noValidate className="space-y-6">
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
                htmlFor="verify-code"
                className="font-label block mb-2 text-[var(--color-text)]"
              >
                Verification Code
              </label>
              <input
                id="verify-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? 'verify-code-error' : 'verify-code-hint'}
                className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
                  errors.code ? 'border-red-400' : 'border-[var(--color-surface2)]'
                }`}
                placeholder="123456"
                maxLength={6}
              />
              {errors.code ? (
                <p id="verify-code-error" className="mt-1.5 text-sm text-red-600" role="alert">
                  {errors.code}
                </p>
              ) : (
                <p id="verify-code-hint" className="mt-1.5 text-sm text-[var(--color-text)]/50">
                  Enter the 6-digit code sent to {email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verifying…' : 'Verify Email'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--color-text)]/70">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} noValidate className="space-y-6">
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
          htmlFor="signup-email"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            errors.email ? 'border-red-400' : 'border-[var(--color-surface2)]'
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="signup-email-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby="signup-password-requirements"
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            errors.password ? 'border-red-400' : 'border-[var(--color-surface2)]'
          }`}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.password}
          </p>
        )}
        {showPasswordFeedback && (
          <ul
            id="signup-password-requirements"
            aria-label="Password requirements"
            className="mt-2 space-y-1"
          >
            {passwordRequirements.map((req) => (
              <li
                key={req.label}
                className={`flex items-center gap-2 text-sm ${
                  req.met ? 'text-green-700' : 'text-[var(--color-text)]/50'
                }`}
              >
                <span aria-hidden="true" className="text-xs">
                  {req.met ? '✓' : '○'}
                </span>
                <span>
                  {req.label}
                  <span className="sr-only">
                    {req.met ? ' — met' : ' — not met'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          id="signup-consent"
          name="consentAccepted"
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          aria-invalid={!!errors.consentAccepted}
          aria-describedby={errors.consentAccepted ? 'signup-consent-error' : undefined}
          className="mt-1 h-4 w-4 rounded border-[var(--color-surface2)] text-[var(--color-amber)] focus:ring-[var(--color-amber)]/40"
        />
        <label htmlFor="signup-consent" className="text-sm text-[var(--color-text)]/70">
          I agree to the{' '}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 underline"
          >
            Privacy Policy (v1.0)
          </a>
        </label>
      </div>
      {errors.consentAccepted && (
        <p id="signup-consent-error" className="text-sm text-red-600 -mt-4" role="alert">
          {errors.consentAccepted}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-[var(--color-text)]/70">
        Already have an account?{' '}
        <a
          href="/login"
          className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 font-medium"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
