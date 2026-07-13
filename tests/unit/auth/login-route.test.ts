/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/auth/login/route.ts
 *
 * Mocks the Cognito signIn function, rate limiter, and jose decodeJwt
 * to test the route handler logic: validation, rate limiting, token decoding,
 * cookie setting, error handling, and response structure.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks — must be defined before any imports that depend on them
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth/config', () => ({
  authConfig: {
    cognito: {
      userPoolId: 'ap-southeast-2_TestPool',
      clientId: 'test-client-id-123',
      region: 'ap-southeast-2',
    },
    cookie: {
      domain: 'localhost',
      secure: true,
    },
    app: {
      url: 'https://example.com',
    },
  },
}));

const mockSignIn = jest.fn();
jest.mock('@/lib/auth/cognito', () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
}));

const mockLoginLimiter = jest.fn();
jest.mock('@/lib/rate-limit/limiter', () => ({
  loginLimiter: (...args: any[]) => mockLoginLimiter(...args),
}));

const mockSetAuthCookies = jest.fn((...args: any[]) => args[0]);
jest.mock('@/lib/auth/cookies', () => ({
  setAuthCookies: (...args: any[]) => mockSetAuthCookies(...args),
}));

const mockDecodeJwt = jest.fn();
jest.mock('jose', () => ({
  decodeJwt: (...args: any[]) => mockDecodeJwt(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: 'fan@example.com',
  password: 'Str0ng!Pass',
};

const mockTokens = {
  accessToken: 'mock-access-token',
  idToken: 'mock-id-token',
  refreshToken: 'mock-refresh-token',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: rate limiter allows the request
    mockLoginLimiter.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 900000,
    });

    // Default: signIn succeeds
    mockSignIn.mockResolvedValue(mockTokens);

    // Default: decodeJwt returns typical id token claims
    mockDecodeJwt.mockReturnValue({
      sub: 'user-sub-123',
      email: 'fan@example.com',
      email_verified: true,
      token_use: 'id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    // Import the route handler fresh
    const routeModule = await import('@/app/api/auth/login/route');
    POST = routeModule.POST;
  });

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      const { NextResponse } = await import('next/server');
      const rateLimitResponse = NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429 },
      );
      mockLoginLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 900000,
        response: rateLimitResponse,
      });

      const req = createRequest(validBody);
      const response = await POST(req);

      expect(response.status).toBe(429);
    });

    it('does not call signIn when rate limited', async () => {
      const { NextResponse } = await import('next/server');
      mockLoginLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 900000,
        response: NextResponse.json({}, { status: 429 }),
      });

      const req = createRequest(validBody);
      await POST(req);

      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('returns 400 for missing email', async () => {
      const req = createRequest({ password: 'Str0ng!Pass' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid email format', async () => {
      const req = createRequest({ email: 'not-an-email', password: 'Str0ng!Pass' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for password shorter than 8 characters', async () => {
      const req = createRequest({ email: 'fan@example.com', password: 'short' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing password', async () => {
      const req = createRequest({ email: 'fan@example.com' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('successful login', () => {
    it('returns 200 with success message and user info', async () => {
      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Login successful');
      expect(data.user).toEqual({
        email: 'fan@example.com',
        email_verified: true,
      });
    });

    it('calls signIn with email and password', async () => {
      const req = createRequest(validBody);
      await POST(req);

      expect(mockSignIn).toHaveBeenCalledWith('fan@example.com', 'Str0ng!Pass');
    });

    it('decodes the id token to extract user claims', async () => {
      const req = createRequest(validBody);
      await POST(req);

      expect(mockDecodeJwt).toHaveBeenCalledWith('mock-id-token');
    });

    it('sets auth cookies with the returned tokens', async () => {
      const req = createRequest(validBody);
      await POST(req);

      expect(mockSetAuthCookies).toHaveBeenCalledWith(
        expect.anything(),
        mockTokens,
      );
    });

    it('returns email_verified as false when token claim is false', async () => {
      mockDecodeJwt.mockReturnValue({
        sub: 'user-sub-456',
        email: 'unverified@example.com',
        email_verified: false,
        token_use: 'id',
      });

      const req = createRequest({ email: 'unverified@example.com', password: 'Str0ng!Pass' });
      const response = await POST(req);
      const data = await response.json();

      expect(data.user).toEqual({
        email: 'unverified@example.com',
        email_verified: false,
      });
    });
  });

  describe('error handling', () => {
    it('returns 401 with generic message for auth failures', async () => {
      mockSignIn.mockRejectedValue(new Error('Incorrect username or password'));

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('AUTH_FAILED');
      expect(data.error.message).toBe('Invalid email or password.');
    });

    it('does not reveal whether the email exists (no enumeration)', async () => {
      mockSignIn.mockRejectedValue(new Error('User does not exist'));

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).not.toContain('does not exist');
      expect(data.error.message).toBe('Invalid email or password.');
    });

    it('returns generic 401 for user not confirmed errors', async () => {
      mockSignIn.mockRejectedValue(new Error('User is not confirmed'));

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Invalid email or password.');
    });
  });
});
