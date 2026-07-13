/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/preferences/route.ts
 *
 * Mocks token verification, cookie helpers, and DB preferences to test:
 * - GET: returns preferences for authenticated fan
 * - GET: returns 401 when not authenticated
 * - PUT: validates input and updates preferences
 * - PUT: returns 400 for invalid input
 * - Both: returns 401 for invalid token
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

const mockVerifyToken = jest.fn();
jest.mock('@/lib/auth/tokens', () => {
  class TokenVerificationError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'TokenVerificationError';
      this.code = code;
    }
  }
  return {
    verifyToken: (...args: any[]) => mockVerifyToken(...args),
    TokenVerificationError,
  };
});

const mockGetAuthCookies = jest.fn();
jest.mock('@/lib/auth/cookies', () => ({
  getAuthCookies: (...args: any[]) => mockGetAuthCookies(...args),
}));

const mockGetPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();
jest.mock('@/lib/db/preferences', () => ({
  getPreferences: (...args: any[]) => mockGetPreferences(...args),
  updatePreferences: (...args: any[]) => mockUpdatePreferences(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGetRequest(): NextRequest {
  return new NextRequest('http://localhost/api/preferences', {
    method: 'GET',
  });
}

function createPutRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockPreferences = {
  fanId: 'fan-123',
  email: 'fan@example.com',
  categories: { new_song: true, new_album: true, blog_post: false },
  unsubscribeToken: 'unsub-token-123',
  consentVersion: '1.0',
  consentDate: '2025-01-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/preferences', () => {
  let GET: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockGetAuthCookies.mockReturnValue({
      accessToken: 'mock-access-token',
      idToken: undefined,
      refreshToken: undefined,
    });

    mockVerifyToken.mockResolvedValue({ sub: 'fan-123', token_use: 'access' });
    mockGetPreferences.mockResolvedValue(mockPreferences);

    const routeModule = await import('@/app/api/preferences/route');
    GET = routeModule.GET;
  });

  it('returns preferences for an authenticated fan', async () => {
    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fanId).toBe('fan-123');
    expect(data.categories).toEqual({ new_song: true, new_album: true, blog_post: false });
  });

  it('calls verifyToken with access tokenUse', async () => {
    const req = createGetRequest();
    await GET(req);

    expect(mockVerifyToken).toHaveBeenCalledWith('mock-access-token', { tokenUse: 'access' });
  });

  it('returns 401 when no access token cookie is present', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: undefined,
      idToken: undefined,
      refreshToken: undefined,
    });

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 401 when token verification fails', async () => {
    const { TokenVerificationError } = await import('@/lib/auth/tokens');
    mockVerifyToken.mockRejectedValue(new TokenVerificationError('Token expired', 'TOKEN_EXPIRED'));

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 404 when preferences not found', async () => {
    mockGetPreferences.mockResolvedValue(null);

    const req = createGetRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Preferences not found');
  });
});

describe('PUT /api/preferences', () => {
  let PUT: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockGetAuthCookies.mockReturnValue({
      accessToken: 'mock-access-token',
      idToken: undefined,
      refreshToken: undefined,
    });

    mockVerifyToken.mockResolvedValue({ sub: 'fan-123', token_use: 'access' });
    mockUpdatePreferences.mockResolvedValue({
      ...mockPreferences,
      categories: { new_song: false, new_album: true, blog_post: true },
      updatedAt: '2025-07-14T10:00:00Z',
    });

    const routeModule = await import('@/app/api/preferences/route');
    PUT = routeModule.PUT;
  });

  it('returns 200 with updated preferences on success', async () => {
    const req = createPutRequest({
      categories: { new_song: false, new_album: true, blog_post: true },
    });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.categories).toEqual({ new_song: false, new_album: true, blog_post: true });
  });

  it('calls updatePreferences with fanId and categories', async () => {
    const categories = { new_song: false, new_album: true, blog_post: true };
    const req = createPutRequest({ categories });
    await PUT(req);

    expect(mockUpdatePreferences).toHaveBeenCalledWith('fan-123', categories);
  });

  it('returns 401 when no access token cookie is present', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: undefined,
      idToken: undefined,
      refreshToken: undefined,
    });

    const req = createPutRequest({ categories: { new_song: true, new_album: true, blog_post: true } });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 401 when token verification fails', async () => {
    const { TokenVerificationError } = await import('@/lib/auth/tokens');
    mockVerifyToken.mockRejectedValue(new TokenVerificationError('Invalid', 'INVALID_SIGNATURE'));

    const req = createPutRequest({ categories: { new_song: true, new_album: true, blog_post: true } });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 400 for invalid input (missing category)', async () => {
    const req = createPutRequest({ categories: { new_song: true } });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('returns 400 for invalid input (wrong types)', async () => {
    const req = createPutRequest({ categories: { new_song: 'yes', new_album: true, blog_post: true } });
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('returns 400 for empty body', async () => {
    const req = createPutRequest({});
    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });
});
