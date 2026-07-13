/**
 * @jest-environment node
 */

/**
 * Unit tests for GET /api/account/export route handler.
 */

// Mock AWS SDK
const mockCognitoSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn(() => ({ send: mockCognitoSend })),
  AdminGetUserCommand: jest.fn((input) => ({ input })),
}));

// Mock auth modules
jest.mock('@/lib/auth/cookies', () => ({
  getAuthCookies: jest.fn(),
}));

jest.mock('@/lib/auth/tokens', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/auth/config', () => ({
  authConfig: {
    cognito: {
      userPoolId: 'ap-southeast-2_test123',
      clientId: 'test-client-id',
      region: 'ap-southeast-2',
    },
    cookie: { domain: 'localhost', secure: true },
    app: { url: 'http://localhost:3000' },
  },
}));

// Mock DynamoDB preferences
jest.mock('@/lib/db/preferences', () => ({
  getPreferences: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/account/export/route';
import { getAuthCookies } from '@/lib/auth/cookies';
import { verifyToken } from '@/lib/auth/tokens';
import { getPreferences } from '@/lib/db/preferences';

const mockGetAuthCookies = getAuthCookies as jest.MockedFunction<typeof getAuthCookies>;
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockGetPreferences = getPreferences as jest.MockedFunction<typeof getPreferences>;

function createRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/account/export', {
    method: 'GET',
  });
}

describe('GET /api/account/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if no access token cookie is present', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: undefined,
      idToken: undefined,
      refreshToken: undefined,
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 if token verification fails', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'invalid-token',
      idToken: undefined,
      refreshToken: undefined,
    });
    mockVerifyToken.mockRejectedValue(new Error('Token expired'));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns JSON export with correct headers on success', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'valid-token',
      idToken: undefined,
      refreshToken: undefined,
    });
    mockVerifyToken.mockResolvedValue({
      sub: 'user-123',
      iss: 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_test123',
      client_id: 'test-client-id',
      token_use: 'access' as const,
      scope: 'openid email',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    mockCognitoSend.mockResolvedValue({
      UserAttributes: [
        { Name: 'email', Value: 'fan@example.com' },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:consent_version', Value: '1.0' },
        { Name: 'custom:consent_date', Value: '2025-01-01T00:00:00Z' },
      ],
      UserCreateDate: new Date('2025-01-01T00:00:00Z'),
    });
    mockGetPreferences.mockResolvedValue({
      fanId: 'user-123',
      email: 'fan@example.com',
      categories: { new_song: true, new_album: true, blog_post: false },
      unsubscribeToken: 'token-123',
      consentVersion: '1.0',
      consentDate: '2025-01-01T00:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="jameswilliams-data-export.json"',
    );
    expect(body.exportVersion).toBe('1.0');
    expect(body.exportDate).toBeDefined();
    expect(body.account.email).toBe('fan@example.com');
    expect(body.account.emailVerified).toBe(true);
    expect(body.account.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(body.account.consentVersion).toBe('1.0');
    expect(body.account.consentDate).toBe('2025-01-01T00:00:00Z');
    expect(body.preferences).toEqual({
      new_song: true,
      new_album: true,
      blog_post: false,
    });
  });

  it('returns default preferences when no DynamoDB record exists', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'valid-token',
      idToken: undefined,
      refreshToken: undefined,
    });
    mockVerifyToken.mockResolvedValue({
      sub: 'user-123',
      iss: 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_test123',
      client_id: 'test-client-id',
      token_use: 'access' as const,
      scope: 'openid email',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    mockCognitoSend.mockResolvedValue({
      UserAttributes: [
        { Name: 'email', Value: 'fan@example.com' },
        { Name: 'email_verified', Value: 'true' },
      ],
      UserCreateDate: new Date('2025-01-01T00:00:00Z'),
    });
    mockGetPreferences.mockResolvedValue(null);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences).toEqual({
      new_song: false,
      new_album: false,
      blog_post: false,
    });
  });

  it('returns 500 if Cognito call fails', async () => {
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'valid-token',
      idToken: undefined,
      refreshToken: undefined,
    });
    mockVerifyToken.mockResolvedValue({
      sub: 'user-123',
      iss: 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_test123',
      client_id: 'test-client-id',
      token_use: 'access' as const,
      scope: 'openid email',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    mockCognitoSend.mockRejectedValue(new Error('Service unavailable'));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('EXPORT_FAILED');
  });
});
