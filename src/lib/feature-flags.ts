/**
 * Feature flags for toggling functionality across environments.
 *
 * Set NEXT_PUBLIC_ENABLE_AUTH=true to enable login/signup UI.
 * Set NEXT_PUBLIC_ENABLE_MERCH=true to show the merch store.
 *
 * Defaults: auth disabled, merch disabled (shows "coming soon").
 */

export const featureFlags = {
  /** Whether to show login/signup buttons and auth-related UI */
  auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',

  /** Whether to show the merch store (false = "coming soon" message) */
  merch: process.env.NEXT_PUBLIC_ENABLE_MERCH === 'true',
} as const;
