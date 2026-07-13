/**
 * @jest-environment node
 */

/**
 * Unit tests for the in-memory sliding window rate limiter.
 */

import { NextRequest } from 'next/server';

import {
  createRateLimiter,
  applyRateLimitHeaders,
  loginLimiter,
  signupLimiter,
  forgotPasswordLimiter,
  confirmLimiter,
  notificationTriggerLimiter,
  _resetStore,
} from '@/lib/rate-limit/limiter';

function makeRequest(
  path: string,
  ip = '192.168.1.1',
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: {
      'x-forwarded-for': ip,
    },
  });
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    _resetStore();
  });

  describe('createRateLimiter', () => {
    it('allows requests within the limit', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 3 });
      const request = makeRequest('/api/auth/login');

      const result1 = limiter(request);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = limiter(request);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = limiter(request);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('blocks requests exceeding the limit', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 2 });
      const request = makeRequest('/api/auth/login');

      limiter(request);
      limiter(request);
      const result = limiter(request);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.response).toBeDefined();
    });

    it('returns 429 status when limit is exceeded', async () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
      const request = makeRequest('/api/auth/login');

      limiter(request);
      const result = limiter(request);

      expect(result.response!.status).toBe(429);

      const body = await result.response!.json();
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(body.error.message).toBe(
        'Too many requests. Please try again later.',
      );
    });

    it('includes Retry-After header in 429 response', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
      const request = makeRequest('/api/auth/login');

      limiter(request);
      const result = limiter(request);

      const retryAfter = result.response!.headers.get('Retry-After');
      expect(retryAfter).toBeDefined();
      expect(Number(retryAfter)).toBeGreaterThan(0);
      expect(Number(retryAfter)).toBeLessThanOrEqual(60);
    });

    it('includes rate limit headers in 429 response', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 2 });
      const request = makeRequest('/api/auth/login');

      limiter(request);
      limiter(request);
      const result = limiter(request);

      expect(result.response!.headers.get('X-RateLimit-Limit')).toBe('2');
      expect(result.response!.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result.response!.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('tracks different IPs independently', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });

      const request1 = makeRequest('/api/auth/login', '10.0.0.1');
      const request2 = makeRequest('/api/auth/login', '10.0.0.2');

      limiter(request1);
      const result1 = limiter(request1);
      const result2 = limiter(request2);

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });

    it('tracks different paths independently for the same IP', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });
      const ip = '10.0.0.1';

      const loginReq = makeRequest('/api/auth/login', ip);
      const signupReq = makeRequest('/api/auth/signup', ip);

      limiter(loginReq);
      const loginBlocked = limiter(loginReq);
      const signupAllowed = limiter(signupReq);

      expect(loginBlocked.allowed).toBe(false);
      expect(signupAllowed.allowed).toBe(true);
    });

    it('uses sliding window — allows requests after oldest attempt expires', () => {
      jest.useFakeTimers();

      const windowMs = 10_000; // 10 seconds
      const limiter = createRateLimiter({ windowMs, maxAttempts: 2 });
      const request = makeRequest('/api/auth/login');

      // Use up all attempts
      limiter(request);
      limiter(request);

      // Should be blocked now
      const blocked = limiter(request);
      expect(blocked.allowed).toBe(false);

      // Advance time past the window for the oldest attempt
      jest.advanceTimersByTime(windowMs + 1);

      // Should be allowed again (sliding window expired old entries)
      const allowed = limiter(request);
      expect(allowed.allowed).toBe(true);

      jest.useRealTimers();
    });

    it('returns resetAt as unix timestamp (ms)', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 5 });
      const request = makeRequest('/api/auth/login');

      const result = limiter(request);
      const now = Date.now();

      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetAt).toBeLessThanOrEqual(now + 60_000);
    });

    it('uses x-real-ip when x-forwarded-for is absent', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });

      const request = new NextRequest('http://localhost/api/auth/login', {
        headers: {
          'x-real-ip': '172.16.0.1',
        },
      });

      limiter(request);
      const result = limiter(request);
      expect(result.allowed).toBe(false);
    });

    it('falls back to "unknown" when no IP headers are present', () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxAttempts: 1 });

      const request = new NextRequest('http://localhost/api/auth/login');

      limiter(request);
      const result = limiter(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('applyRateLimitHeaders', () => {
    it('adds rate limit headers to a response', () => {
      const { NextResponse } = require('next/server');
      const response = NextResponse.json({ ok: true });

      const result = { allowed: true, remaining: 3, resetAt: Date.now() + 60_000 };
      applyRateLimitHeaders(response, result, 5);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('3');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('pre-configured limiters', () => {
    it('loginLimiter allows 5 attempts', () => {
      const request = makeRequest('/api/auth/login');

      for (let i = 0; i < 5; i++) {
        const result = loginLimiter(request);
        expect(result.allowed).toBe(true);
      }

      const blocked = loginLimiter(request);
      expect(blocked.allowed).toBe(false);
    });

    it('signupLimiter allows 3 attempts', () => {
      const request = makeRequest('/api/auth/signup');

      for (let i = 0; i < 3; i++) {
        const result = signupLimiter(request);
        expect(result.allowed).toBe(true);
      }

      const blocked = signupLimiter(request);
      expect(blocked.allowed).toBe(false);
    });

    it('forgotPasswordLimiter allows 3 attempts', () => {
      const request = makeRequest('/api/auth/forgot-password');

      for (let i = 0; i < 3; i++) {
        const result = forgotPasswordLimiter(request);
        expect(result.allowed).toBe(true);
      }

      const blocked = forgotPasswordLimiter(request);
      expect(blocked.allowed).toBe(false);
    });

    it('confirmLimiter allows 5 attempts', () => {
      const request = makeRequest('/api/auth/confirm-signup');

      for (let i = 0; i < 5; i++) {
        const result = confirmLimiter(request);
        expect(result.allowed).toBe(true);
      }

      const blocked = confirmLimiter(request);
      expect(blocked.allowed).toBe(false);
    });

    it('notificationTriggerLimiter allows 10 requests', () => {
      const request = makeRequest('/api/notifications/trigger');

      for (let i = 0; i < 10; i++) {
        const result = notificationTriggerLimiter(request);
        expect(result.allowed).toBe(true);
      }

      const blocked = notificationTriggerLimiter(request);
      expect(blocked.allowed).toBe(false);
    });
  });
});
