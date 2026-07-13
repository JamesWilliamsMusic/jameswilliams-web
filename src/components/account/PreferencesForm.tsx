'use client';

import { useState, useEffect, useCallback } from 'react';

interface Categories {
  new_song: boolean;
  new_album: boolean;
  blog_post: boolean;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

const CATEGORY_LABELS: Record<keyof Categories, string> = {
  new_song: 'New Songs',
  new_album: 'New Albums',
  blog_post: 'Blog Posts',
};

const CATEGORY_DESCRIPTIONS: Record<keyof Categories, string> = {
  new_song: 'Get notified when a new song is released',
  new_album: 'Get notified when a new album drops',
  blog_post: 'Get notified about new exclusive blog posts',
};

export default function PreferencesForm() {
  const [categories, setCategories] = useState<Categories>({
    new_song: true,
    new_album: true,
    blog_post: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [hasError, setHasError] = useState(false);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch('/api/preferences');

      if (response.status === 401) {
        window.location.href = '/login?returnTo=/account/preferences';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      setCategories(data.categories);
    } catch {
      setHasError(true);
      showToast('error', 'Unable to load your preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
  }

  function handleToggle(category: keyof Categories) {
    setCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      });

      if (response.status === 401) {
        window.location.href = '/login?returnTo=/account/preferences';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      showToast('success', 'Preferences saved successfully.');
    } catch {
      showToast('error', 'Unable to save your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading preferences">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-[var(--color-surface2)] rounded animate-pulse" />
              <div className="h-3 w-48 bg-[var(--color-surface2)]/60 rounded animate-pulse" />
            </div>
            <div className="h-6 w-11 bg-[var(--color-surface2)] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-[var(--color-text)]/70 mb-4">
          Something went wrong loading your preferences.
        </p>
        <button
          onClick={fetchPreferences}
          className="rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-6 rounded-md px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.message}
        </div>
      )}

      <fieldset className="space-y-1">
        <legend className="sr-only">Notification preferences</legend>

        {(Object.keys(CATEGORY_LABELS) as Array<keyof Categories>).map(
          (category) => (
            <div
              key={category}
              className="flex items-center justify-between py-4 border-b border-[var(--color-surface2)]/60 last:border-b-0"
            >
              <div className="pr-4">
                <label
                  htmlFor={`toggle-${category}`}
                  className="font-label block text-[var(--color-text)] cursor-pointer"
                >
                  {CATEGORY_LABELS[category]}
                </label>
                <p className="text-sm text-[var(--color-text)]/60 mt-0.5">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
              </div>

              <button
                id={`toggle-${category}`}
                type="button"
                role="switch"
                aria-checked={categories[category]}
                aria-label={`${CATEGORY_LABELS[category]} notifications`}
                onClick={() => handleToggle(category)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 ${
                  categories[category]
                    ? 'bg-[var(--color-amber)]'
                    : 'bg-[var(--color-surface2)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    categories[category] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ),
        )}
      </fieldset>

      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
