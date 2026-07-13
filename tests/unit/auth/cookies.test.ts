/**
 * @jest-environment node
 */

/**
 * Unit tests for cookie helpers (src/lib/auth/cookies.ts)
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  setAuthCookies,
  getAuthCookies,
  clearAuthCookies,
  COOKIE_NAMES,
  AuthTokens,
} from '@/lib/auth/cookies';

// Mock authConfig to avoid env var requirements in tests
jest.mock('@/lib/auth/config', () => ({
  authConfig: {
    cognito: {
      userPoolId: 'ap-southeast-2_test',
      clientId: 'test-client-id',
      region: 'ap-southeast-2',
    },
    cookie: {
      domain: 'example.com',
      secure: true,
    },
    app: {
      url: 'https://example.com',
    },
  },
}));

const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token-value',
  idToken: 'mock-id-token-value',
  refreshToken: 'mock-refresh-token-value',
};

describe('Cookie Helpers', () => {
  describe('setAuthCookies', () => {
    it('sets access_token with correct attributes', () => {
      const response = NextResponse.json({ ok: true });
      setAuthCookies(response, mockTokens);

      const cookie = response.cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
      expect(cookie).toBeDefined();
      expect(cookie!.value).toBe(mockTokens.accessToken);
    });

    it('sets id_token with correct attributes', () => {
      const response = NextResponse.json({ ok: true });
      setAuthCookies(response, mockTokens);

      const cookie = response.cookies.get(COOKIE_NAMES.ID_TOKEN);
      expect(cookie).toBeDefined();
      expect(cookie!.value).toBe(mockTokens.idToken);
    });

    it('sets refresh_token with correct attributes', () => {
      const response = NextResponse.json({ ok: true });
      setAuthCookies(response, mockTokens);

      const cookie = response.cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
      expect(cookie).toBeDefined();
      expect(cookie!.value).toBe(mockTokens.refreshToken);
    });

    it('returns the same response object', () => {
      const response = NextResponse.json({ ok: true });
      const result = setAuthCookies(response, mockTokens);
      expect(result).toBe(response);
    });

    it('sets all three cookies on the response', () => {
      const response = NextResponse.json({ ok: true });
      setAuthCookies(response, mockTokens);

      const cookieNames = response.cookies
        .getAll()
        .map((c) => c.name);
      expect(cookieNames).toContain(COOKIE_NAMES.ACCESS_TOKEN);
      expect(cookieNames).toContain(COOKIE_NAMES.ID_TOKEN);
      expect(cookieNames).toContain(COOKIE_NAMES.REFRESH_TOKEN);
    });
  });

  describe('getAuthCookies', () => {
    it('reads all token cookies from a request', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: `access_token=${mockTokens.accessToken}; id_token=${mockTokens.idToken}; refresh_token=${mockTokens.refreshToken}`,
        },
      });

      const cookies = getAuthCookies(request);
      expect(cookies.accessToken).toBe(mockTokens.accessToken);
      expect(cookies.idToken).toBe(mockTokens.idToken);
      expect(cookies.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('returns undefined for missing cookies', () => {
      const request = new NextRequest('http://localhost/api/test');

      const cookies = getAuthCookies(request);
      expect(cookies.accessToken).toBeUndefined();
      expect(cookies.idToken).toBeUndefined();
      expect(cookies.refreshToken).toBeUndefined();
    });

    it('returns undefined for partially missing cookies', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          cookie: `access_token=${mockTokens.accessToken}`,
        },
      });

      const cookies = getAuthCookies(request);
      expect(cookies.accessToken).toBe(mockTokens.accessToken);
      expect(cookies.idToken).toBeUndefined();
      expect(cookies.refreshToken).toBeUndefined();
    });
  });

  describe('clearAuthCookies', () => {
    it('sets all cookies with empty value', () => {
      const response = NextResponse.json({ ok: true });
      clearAuthCookies(response);

      const accessCookie = response.cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
      const idCookie = response.cookies.get(COOKIE_NAMES.ID_TOKEN);
      const refreshCookie = response.cookies.get(COOKIE_NAMES.REFRESH_TOKEN);

      expect(accessCookie!.value).toBe('');
      expect(idCookie!.value).toBe('');
      expect(refreshCookie!.value).toBe('');
    });

    it('returns the same response object', () => {
      const response = NextResponse.json({ ok: true });
      const result = clearAuthCookies(response);
      expect(result).toBe(response);
    });

    it('clears all three auth cookie names', () => {
      const response = NextResponse.json({ ok: true });
      clearAuthCookies(response);

      const cookieNames = response.cookies
        .getAll()
        .map((c) => c.name);
      expect(cookieNames).toContain(COOKIE_NAMES.ACCESS_TOKEN);
      expect(cookieNames).toContain(COOKIE_NAMES.ID_TOKEN);
      expect(cookieNames).toContain(COOKIE_NAMES.REFRESH_TOKEN);
    });
  });

  describe('COOKIE_NAMES', () => {
    it('exports correct cookie name constants', () => {
      expect(COOKIE_NAMES.ACCESS_TOKEN).toBe('access_token');
      expect(COOKIE_NAMES.ID_TOKEN).toBe('id_token');
      expect(COOKIE_NAMES.REFRESH_TOKEN).toBe('refresh_token');
    });
  });
});
