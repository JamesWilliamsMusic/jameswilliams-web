/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/auth/refresh/route.ts
 *
 * Mocks Cognito refreshSession, cookie helpers, and jose decodeJwt
 * to test: reading refresh_token from cookies, decoding id_token for email,
 * calling refreshSession, setting new cookies, returnTo support, and error handling.
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

const mockRefreshSession = jest.fn();
jest.mock('@/lib/auth/cognito', () => ({
  refreshSession: (...args: any[]) => mockRefreshSession(...args),
}));

const mockGetAuthCookies = jest.fn();
const mockSetAuthCookies = jest.fn((...args: any[]) => args[0]);
const mockClearAuthCookies = jest.fn((...args: any[]) => args[0]);
jest.mock('@/lib/auth/cookies', () => ({
  getAuthCookies: (...args: any[]) => mockGetAuthCookies(...args),
  setAuthCookies: (...args: any[]) => mockSetAuthCookies(...args),
  clearAuthCookies: (...args: any[]) => mockClearAuthCookies(...args),
}));

const mockDecodeJwt = jest.fn();
jest.mock('jose', () => ({
  decodeJwt: (...args: any[]) => mockDecodeJwt(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(url = 'http://localhost/api/auth/refresh'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
  });
}

const mockTokens = {
  accessToken: 'new-access-token',
  idToken: 'new-id-token',
  refreshToken: 'new-refresh-token',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/refresh', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: cookies contain refresh and id tokens
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'old-access-token',
      idToken: 'old-id-token',
      refreshToken: 'old-refresh-token',
    });

    // Default: decodeJwt returns email from id_token
    mockDecodeJwt.mockReturnValue({
      sub: 'user-sub-123',
      email: 'fan@example.com',
      email_verified: true,
      token_use: 'id',
    });

    // Default: refreshSession succeeds
    mockRefreshSession.mockResolvedValue(mockTokens);

    // Import fresh
    const routeModule = await import('@/app/api/auth/refresh/route');
    POST = routeModule.POST;
  });

  describe('missing refresh token', () => {
    it('returns 401 when refresh_token cookie is missing', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('NO_REFRESH_TOKEN');
    });

    it('clears all cookies when refresh token is missing', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
      });

      const req = createRequest();
      await POST(req);

      expect(mockClearAuthCookies).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('missing email (no id_token or invalid)', () => {
    it('returns 401 when id_token is missing', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: 'old-refresh-token',
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('REFRESH_FAILED');
    });

    it('returns 401 when id_token cannot be decoded', async () => {
      mockDecodeJwt.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('REFRESH_FAILED');
    });

    it('returns 401 when id_token has no email claim', async () => {
      mockDecodeJwt.mockReturnValue({
        sub: 'user-sub-123',
        token_use: 'id',
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('REFRESH_FAILED');
    });

    it('clears cookies when email cannot be extracted', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: 'old-refresh-token',
      });

      const req = createRequest();
      await POST(req);

      expect(mockClearAuthCookies).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('successful refresh', () => {
    it('returns 200 with success message', async () => {
      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Token refreshed');
    });

    it('decodes the id_token to extract email', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockDecodeJwt).toHaveBeenCalledWith('old-id-token');
    });

    it('calls refreshSession with email and refresh token', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockRefreshSession).toHaveBeenCalledWith('fan@example.com', 'old-refresh-token');
    });

    it('sets updated auth cookies with new tokens', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockSetAuthCookies).toHaveBeenCalledWith(expect.anything(), mockTokens);
    });

    it('includes returnTo in response when provided as query param', async () => {
      const req = createRequest('http://localhost/api/auth/refresh?returnTo=/exclusive');
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.returnTo).toBe('/exclusive');
    });

    it('does not include returnTo when not provided', async () => {
      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(data.returnTo).toBeUndefined();
    });
  });

  describe('refresh failure', () => {
    it('returns 401 when refreshSession throws', async () => {
      mockRefreshSession.mockRejectedValue(new Error('Token has been revoked'));

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('REFRESH_FAILED');
      expect(data.error.message).toBe('Session expired. Please log in again.');
    });

    it('clears all cookies on refresh failure', async () => {
      mockRefreshSession.mockRejectedValue(new Error('Token expired'));

      const req = createRequest();
      await POST(req);

      expect(mockClearAuthCookies).toHaveBeenCalledWith(expect.anything());
    });
  });
});
