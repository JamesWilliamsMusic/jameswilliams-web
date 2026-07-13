/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/auth/logout/route.ts
 *
 * Mocks globalSignOut and cookie helpers to test:
 * - Reading access_token from cookies
 * - Calling Cognito globalSignOut to revoke sessions
 * - Clearing all auth cookies
 * - Returning 200 on success
 * - Graceful degradation when globalSignOut fails
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
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

const mockGlobalSignOut = jest.fn();
jest.mock('@/lib/auth/cognito', () => ({
  globalSignOut: (...args: any[]) => mockGlobalSignOut(...args),
}));

const mockGetAuthCookies = jest.fn();
const mockClearAuthCookies = jest.fn((...args: any[]) => args[0]);
jest.mock('@/lib/auth/cookies', () => ({
  getAuthCookies: (...args: any[]) => mockGetAuthCookies(...args),
  clearAuthCookies: (...args: any[]) => mockClearAuthCookies(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/logout', {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: cookies contain an access token
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
    });

    // Default: globalSignOut succeeds
    mockGlobalSignOut.mockResolvedValue(undefined);

    // Import the route handler fresh
    const routeModule = await import('@/app/api/auth/logout/route');
    POST = routeModule.POST;
  });

  describe('successful logout', () => {
    it('returns 200 with success message', async () => {
      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });

    it('reads access token from cookies', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockGetAuthCookies).toHaveBeenCalledWith(req);
    });

    it('calls globalSignOut with the access token', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockGlobalSignOut).toHaveBeenCalledWith('mock-access-token');
    });

    it('clears all auth cookies', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockClearAuthCookies).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('graceful degradation', () => {
    it('still clears cookies when globalSignOut throws', async () => {
      mockGlobalSignOut.mockRejectedValue(new Error('Token revoked or expired'));

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
      expect(mockClearAuthCookies).toHaveBeenCalled();
    });

    it('returns 200 even when globalSignOut fails', async () => {
      mockGlobalSignOut.mockRejectedValue(new Error('Network error'));

      const req = createRequest();
      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });

  describe('no access token', () => {
    it('does not call globalSignOut when access token is missing', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
      });

      const req = createRequest();
      await POST(req);

      expect(mockGlobalSignOut).not.toHaveBeenCalled();
    });

    it('still clears cookies when no access token is present', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
      expect(mockClearAuthCookies).toHaveBeenCalled();
    });
  });
});
