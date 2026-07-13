'use client';

import { useState, useEffect, useCallback } from 'react';
import DeleteAccountDialog from './DeleteAccountDialog';

interface UserInfo {
  email: string;
  emailVerified: boolean;
  consentVersion: string | null;
  consentDate: string | null;
  createdAt: number;
}

function formatDate(input: string | number): string {
  const date = typeof input === 'number' ? new Date(input * 1000) : new Date(input);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AccountSettings() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch('/api/auth/me');

      if (response.status === 401) {
        window.location.href = '/login?returnTo=/account';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load account info');
      }

      const data: UserInfo = await response.json();
      setUser(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  function handleExport() {
    window.location.href = '/api/account/export';
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <a
              href="/"
              className="font-elegant text-3xl text-[var(--color-text)] hover:text-[var(--color-amber)] transition-colors duration-300 not-italic inline-block"
              style={{ fontStyle: 'italic' }}
            >
              James Williams
            </a>
          </div>

          <div
            className="bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-surface2)] p-8 shadow-sm"
            aria-busy="true"
            aria-label="Loading account settings"
          >
            <div className="space-y-6">
              <div className="h-7 w-48 mx-auto bg-[var(--color-surface2)] rounded animate-pulse" />
              <div className="h-4 w-32 mx-auto bg-[var(--color-surface2)]/60 rounded animate-pulse" />
              <div className="space-y-4 pt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 bg-[var(--color-surface2)]/60 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-[var(--color-surface2)] rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-px bg-[var(--color-surface2)]/60" />
              <div className="space-y-3">
                <div className="h-11 w-full bg-[var(--color-surface2)] rounded-md animate-pulse" />
                <div className="h-11 w-full bg-[var(--color-surface2)] rounded-md animate-pulse" />
                <div className="h-11 w-full bg-[var(--color-surface2)]/60 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <a
              href="/"
              className="font-elegant text-3xl text-[var(--color-text)] hover:text-[var(--color-amber)] transition-colors duration-300 not-italic inline-block"
              style={{ fontStyle: 'italic' }}
            >
              James Williams
            </a>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-surface2)] p-8 shadow-sm text-center">
            <p className="text-sm text-[var(--color-text)]/70 mb-4">
              Something went wrong loading your account settings.
            </p>
            <button
              onClick={fetchUser}
              className="rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a
            href="/"
            className="font-elegant text-3xl text-[var(--color-text)] hover:text-[var(--color-amber)] transition-colors duration-300 not-italic inline-block"
            style={{ fontStyle: 'italic' }}
          >
            James Williams
          </a>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-[var(--color-surface2)] p-8 shadow-sm">
          <h1 className="font-display text-3xl text-center text-[var(--color-text)] mb-2">
            Account
          </h1>
          <p className="font-elegant text-center text-[var(--color-text)]/60 text-lg mb-8">
            Manage your account and privacy
          </p>

          {/* Account Info */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs font-label uppercase tracking-wider text-[var(--color-text)]/50 mb-1">
                Email
              </p>
              <p className="text-[var(--color-text)] font-label">
                {user?.email}
                {user?.emailVerified ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 border border-green-200">
                    Verified
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700 border border-yellow-200">
                    Unverified
                  </span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-label uppercase tracking-wider text-[var(--color-text)]/50 mb-1">
                Member Since
              </p>
              <p className="text-[var(--color-text)] font-label">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
            </div>

            <div>
              <p className="text-xs font-label uppercase tracking-wider text-[var(--color-text)]/50 mb-1">
                Privacy Policy Consent
              </p>
              <p className="text-[var(--color-text)] font-label">
                {user?.consentVersion ? (
                  <>
                    Version {user.consentVersion}
                    {user.consentDate && (
                      <span className="text-[var(--color-text)]/60">
                        {' '}
                        · Accepted {formatDate(user.consentDate)}
                      </span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>

          <div className="border-b border-[var(--color-surface2)]/60 mb-6" />

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="/account/preferences"
              className="flex w-full items-center justify-between rounded-md border border-[var(--color-surface2)] px-4 py-3 font-label text-[var(--color-text)] transition-all duration-200 hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2"
            >
              <span>Notification Preferences</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>

            <button
              onClick={handleExport}
              className="flex w-full items-center justify-between rounded-md border border-[var(--color-surface2)] px-4 py-3 font-label text-[var(--color-text)] transition-all duration-200 hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2"
            >
              <span>Export My Data</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex w-full items-center justify-between rounded-md border border-red-200 px-4 py-3 font-label text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:ring-offset-2"
            >
              <span>Delete Account</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200"
          >
            ← Back to Home
          </a>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </main>
  );
}
