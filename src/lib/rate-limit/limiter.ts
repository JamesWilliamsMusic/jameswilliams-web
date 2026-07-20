/**
 * In-memory sliding window rate limiter for protecting auth endpoints
 * against brute-force attacks.
 *
 * Uses a Map-based store with per-IP tracking and automatic cleanup
 * of expired entries to prevent memory leaks.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of attempts allowed within the window */
  maxAttempts: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining attempts in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets for the oldest tracked attempt */
  resetAt: number;
  /** Pre-built 429 response when rate limit is exceeded */
  response?: NextResponse;
}

/** Stores timestamps of attempts per key (IP + path) */
const store = new Map<string, number[]>();

/** Interval between cleanup sweeps (60 seconds) */
const CLEANUP_INTERVAL_MS = 60_000;

let lastCleanup = Date.now();

/**
 * Removes expired entries from the store to prevent memory leaks.
 * Runs at most once per CLEANUP_INTERVAL_MS, triggered lazily on each check.
 */
function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of store) {
    // Remove timestamps outside the largest possible window
    const filtered = timestamps.filter((ts) => now - ts < windowMs);
    if (filtered.length === 0) {
      store.delete(key);
    } else {
      store.set(key, filtered);
    }
  }
}

/**
 * Extracts the client IP from the request headers.
 * Checks X-Forwarded-For (first entry) and X-Real-IP before falling back to 'unknown'.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

/**
 * Creates a configurable rate limiter using a sliding window algorithm.
 *
 * Each request records a timestamp. The window slides forward with time,
 * only counting attempts that fall within [now - windowMs, now].
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxAttempts } = config;

  return function checkRateLimit(request: NextRequest): RateLimitResult {
    cleanup(windowMs);

    const ip = getClientIp(request);
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = Date.now();

    // Get existing timestamps or initialize empty array
    let timestamps = store.get(key) ?? [];

    // Sliding window: filter to only include timestamps within the current window
    timestamps = timestamps.filter((ts) => now - ts < windowMs);

    // Record this attempt
    timestamps.push(now);
    store.set(key, timestamps);

    const attemptsInWindow = timestamps.length;
    const remaining = Math.max(0, maxAttempts - attemptsInWindow);

    // Reset time is when the oldest timestamp in the window will expire
    const oldestTimestamp = timestamps[0];
    const resetAt = oldestTimestamp + windowMs;

    if (attemptsInWindow > maxAttempts) {
      const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);
      const response = NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(maxAttempts),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          },
        },
      );

      return { allowed: false, remaining: 0, resetAt, response };
    }

    return { allowed: true, remaining, resetAt };
  };
}

/**
 * Applies rate limit headers to a successful response.
 * Call this after checkRateLimit returns allowed=true to include
 * remaining attempts and reset time in response headers.
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  maxAttempts: number,
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(maxAttempts));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil(result.resetAt / 1000)),
  );
  return response;
}

// --- Pre-configured limiters for auth endpoints ---

/** Login: 5 attempts per 15 minutes */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
});

/** Signup: 3 attempts per 1 hour */
export const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 3,
});

/** Forgot password: 3 attempts per 1 hour */
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxAttempts: 3,
});

/** Confirm signup: 5 attempts per 15 minutes */
export const confirmLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
});

/** Notification trigger webhook: 10 requests per 1 minute */
export const notificationTriggerLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxAttempts: 10,
});

/** Contact form: 5 submissions per 15 minutes */
export const contactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
});

// --- Test utilities (exported for unit testing) ---

/** Clears the in-memory store. Only use in tests. */
export function _resetStore(): void {
  store.clear();
  lastCleanup = Date.now();
}
