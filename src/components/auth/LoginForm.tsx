'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@/lib/validation/schemas';

interface LoginFormProps {
  returnTo?: string;
}

export default function LoginForm({ returnTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'email' | 'password';
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push(returnTo || '/');
        return;
      }

      if (response.status === 429) {
        setErrors({ server: 'Too many login attempts. Please try again later.' });
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
          htmlFor="login-email"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            errors.email
              ? 'border-red-400'
              : 'border-[var(--color-surface2)]'
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="login-email-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            errors.password
              ? 'border-red-400'
              : 'border-[var(--color-surface2)]'
          }`}
          placeholder="••••••••"
        />
        {errors.password && (
          <p id="login-password-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-sm text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200"
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-[var(--color-text)]/70">
        Don&apos;t have an account?{' '}
        <a
          href="/signup"
          className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 font-medium"
        >
          Create account
        </a>
      </p>
    </form>
  );
}
