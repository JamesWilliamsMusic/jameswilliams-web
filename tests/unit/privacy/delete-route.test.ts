/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/account/delete/route.ts
 *
 * Tests the account deletion API endpoint:
 * - Returns 401 if not authenticated
 * - Returns 401 for invalid tokens
 * - Executes deletion workflow on valid request
 * - Clears auth cookies on success
 * - Returns 200 with step details
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

const mockGetAuthCookies = jest.fn();
const mockClearAuthCookies = jest.fn((...args: any[]) => args[0]);
jest.mock('@/lib/auth/cookies', () => ({
  getAuthCookies: (...args: any[]) => mockGetAuthCookies(...args),
  clearAuthCookies: (...args: any[]) => mockClearAuthCookies(...args),
}));

const mockVerifyToken = jest.fn();
jest.mock('@/lib/auth/tokens', () => ({
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
}));

const mockExecuteAccountDeletion = jest.fn();
jest.mock('@/lib/privacy/deletion', () => ({
  executeAccountDeletion: (...args: any[]) => mockExecuteAccountDeletion(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(): NextRequest {
  return new NextRequest('http://localhost/api/account/delete', {
    method: 'POST',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/account/delete', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: authenticated user
    mockGetAuthCookies.mockReturnValue({
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
    });

    mockVerifyToken.mockResolvedValue({
      sub: 'fan-id-123',
      token_use: 'access',
    });

    mockExecuteAccountDeletion.mockResolvedValue({
      success: true,
      steps: [
        { step: 'globalSignOut', success: true },
        { step: 'deletePreferences', success: true },
        { step: 'adminDeleteUser', success: true },
        { step: 'writeDeletionAudit', success: true },
      ],
    });

    const routeModule = await import('@/app/api/account/delete/route');
    POST = routeModule.POST;
  });

  describe('authentication', () => {
    it('returns 401 when no access token in cookies', async () => {
      mockGetAuthCookies.mockReturnValue({
        accessToken: undefined,
        idToken: undefined,
        refreshToken: undefined,
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Authentication required.');
    });

    it('returns 401 when token verification fails', async () => {
      mockVerifyToken.mockRejectedValue(new Error('Token expired'));

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('verifies the access token with tokenUse access', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockVerifyToken).toHaveBeenCalledWith('mock-access-token', {
        tokenUse: 'access',
      });
    });
  });

  describe('successful deletion', () => {
    it('returns 200 with success message', async () => {
      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Account deleted successfully.');
    });

    it('calls executeAccountDeletion with fanId and accessToken', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockExecuteAccountDeletion).toHaveBeenCalledWith(
        'fan-id-123',
        'mock-access-token',
      );
    });

    it('clears auth cookies on success', async () => {
      const req = createRequest();
      await POST(req);

      expect(mockClearAuthCookies).toHaveBeenCalledWith(expect.anything());
    });

    it('returns step details in response', async () => {
      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(data.details).toEqual([
        { step: 'globalSignOut', success: true },
        { step: 'deletePreferences', success: true },
        { step: 'adminDeleteUser', success: true },
        { step: 'writeDeletionAudit', success: true },
      ]);
    });
  });

  describe('partial failures', () => {
    it('still returns 200 when some steps fail', async () => {
      mockExecuteAccountDeletion.mockResolvedValue({
        success: true,
        steps: [
          { step: 'globalSignOut', success: false, error: 'Already revoked' },
          { step: 'deletePreferences', success: true },
          { step: 'adminDeleteUser', success: true },
          { step: 'writeDeletionAudit', success: true },
        ],
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Account deleted successfully.');
    });

    it('does not expose error details in response', async () => {
      mockExecuteAccountDeletion.mockResolvedValue({
        success: true,
        steps: [
          { step: 'globalSignOut', success: false, error: 'Sensitive error info' },
          { step: 'deletePreferences', success: true },
          { step: 'adminDeleteUser', success: true },
          { step: 'writeDeletionAudit', success: true },
        ],
      });

      const req = createRequest();
      const response = await POST(req);
      const data = await response.json();

      // Details only expose step and success, not error messages
      expect(data.details[0]).toEqual({ step: 'globalSignOut', success: false });
      expect(data.details[0].error).toBeUndefined();
    });

    it('still clears cookies even when steps fail', async () => {
      mockExecuteAccountDeletion.mockResolvedValue({
        success: true,
        steps: [
          { step: 'globalSignOut', success: false, error: 'Failed' },
          { step: 'deletePreferences', success: false, error: 'Failed' },
          { step: 'adminDeleteUser', success: false, error: 'Failed' },
          { step: 'writeDeletionAudit', success: false, error: 'Failed' },
        ],
      });

      const req = createRequest();
      await POST(req);

      expect(mockClearAuthCookies).toHaveBeenCalled();
    });
  });
});
