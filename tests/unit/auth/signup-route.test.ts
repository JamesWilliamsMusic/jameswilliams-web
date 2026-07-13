/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/auth/signup/route.ts
 *
 * Mocks the Cognito signUp function and rate limiter to test the route handler
 * logic: validation, rate limiting, error handling, and response structure.
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

const mockSignUp = jest.fn();
jest.mock('@/lib/auth/cognito', () => {
  const { CognitoAuthError } = jest.requireActual('@/lib/auth/cognito');
  return {
    signUp: (...args: any[]) => mockSignUp(...args),
    CognitoAuthError,
  };
});

const mockSignupLimiter = jest.fn();
const mockApplyRateLimitHeaders = jest.fn((...args: any[]) => args[0]);
jest.mock('@/lib/rate-limit/limiter', () => ({
  signupLimiter: (...args: any[]) => mockSignupLimiter(...args),
  applyRateLimitHeaders: (...args: any[]) => mockApplyRateLimitHeaders(...args),
}));

// Import CognitoAuthError for use in tests
import { CognitoAuthError } from '@/lib/auth/cognito';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createInvalidJsonRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not valid json{{{',
  });
}

const validBody = {
  email: 'fan@example.com',
  password: 'Str0ng!Pass',
  consentAccepted: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/signup', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: rate limiter allows the request
    mockSignupLimiter.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetAt: Date.now() + 3600000,
    });

    // Default: signUp succeeds
    mockSignUp.mockResolvedValue({ userSub: 'sub-123', userConfirmed: false });

    // Import the route handler
    const routeModule = await import('@/app/api/auth/signup/route');
    POST = routeModule.POST;
  });

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      const { NextResponse } = await import('next/server');
      const rateLimitResponse = NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
        { status: 429 },
      );
      mockSignupLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 3600000,
        response: rateLimitResponse,
      });

      const req = createRequest(validBody);
      const response = await POST(req);

      expect(response.status).toBe(429);
    });

    it('does not call signUp when rate limited', async () => {
      const { NextResponse } = await import('next/server');
      mockSignupLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 3600000,
        response: NextResponse.json({}, { status: 429 }),
      });

      const req = createRequest(validBody);
      await POST(req);

      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('returns 400 for missing email', async () => {
      const req = createRequest({ password: 'Str0ng!Pass', consentAccepted: true });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid email format', async () => {
      const req = createRequest({ email: 'not-an-email', password: 'Str0ng!Pass', consentAccepted: true });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for weak password (no uppercase)', async () => {
      const req = createRequest({ email: 'fan@example.com', password: 'str0ng!pass', consentAccepted: true });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when consentAccepted is false', async () => {
      const req = createRequest({ email: 'fan@example.com', password: 'Str0ng!Pass', consentAccepted: false });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid JSON body', async () => {
      const req = createInvalidJsonRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid JSON in request body');
    });
  });

  describe('successful signup', () => {
    it('returns 201 with success message', async () => {
      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Account created. Please check your email for a verification code.');
    });

    it('calls signUp with SignUpParams object', async () => {
      const req = createRequest(validBody);
      await POST(req);

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'fan@example.com',
          password: 'Str0ng!Pass',
          consentVersion: '1.0',
          consentDate: expect.any(String),
        }),
      );
    });

    it('passes consentDate as an ISO 8601 timestamp', async () => {
      const req = createRequest(validBody);
      await POST(req);

      const params = mockSignUp.mock.calls[0][0];
      // Verify it's a valid ISO 8601 date
      expect(new Date(params.consentDate).toISOString()).toBe(params.consentDate);
    });

    it('applies rate limit headers to successful response', async () => {
      const req = createRequest(validBody);
      await POST(req);

      expect(mockApplyRateLimitHeaders).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ allowed: true }),
        3,
      );
    });
  });

  describe('error handling', () => {
    it('returns 400 with generic message for UsernameExistsException', async () => {
      mockSignUp.mockRejectedValue(
        new CognitoAuthError('User already exists', 'UsernameExistsException'),
      );

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('SIGNUP_FAILED');
      expect(data.error.message).toBe('Unable to create account. Please try again.');
    });

    it('does not reveal that email exists (no enumeration)', async () => {
      mockSignUp.mockRejectedValue(
        new CognitoAuthError('User already exists', 'UsernameExistsException'),
      );

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      // Message should NOT contain words like "exists", "already", "registered"
      expect(data.error.message.toLowerCase()).not.toContain('exists');
      expect(data.error.message.toLowerCase()).not.toContain('already');
      expect(data.error.message.toLowerCase()).not.toContain('registered');
    });

    it('returns 500 for unexpected Cognito errors', async () => {
      mockSignUp.mockRejectedValue(
        new CognitoAuthError('Internal error', 'InternalErrorException'),
      );

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SIGNUP_FAILED');
    });

    it('returns 500 for non-CognitoAuthError exceptions', async () => {
      mockSignUp.mockRejectedValue(new Error('Network timeout'));

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SIGNUP_FAILED');
      expect(data.error.message).toBe('Unable to create account. Please try again.');
    });
  });
});
