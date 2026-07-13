/**
 * Cookie helpers for managing httpOnly secure JWT token cookies.
 * Uses Next.js NextRequest/NextResponse for reading and setting cookies.
 */

import { NextRequest, NextResponse } from 'next/server';

import { authConfig } from './config';

/** Cookie name constants */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  ID_TOKEN: 'id_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/** Max age constants (in seconds) */
const MAX_AGE = {
  ACCESS_TOKEN: 3600, // 1 hour
  ID_TOKEN: 3600, // 1 hour
  REFRESH_TOKEN: 2592000, // 30 days
} as const;

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

/**
 * Sets access_token, id_token, and refresh_token as httpOnly secure cookies
 * on the given NextResponse.
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: AuthTokens,
): NextResponse {
  const { domain, secure } = authConfig.cookie;

  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE.ACCESS_TOKEN,
    domain,
  });

  response.cookies.set(COOKIE_NAMES.ID_TOKEN, tokens.idToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE.ID_TOKEN,
    domain,
  });

  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: MAX_AGE.REFRESH_TOKEN,
    domain,
  });

  return response;
}

/**
 * Reads auth token cookies from a NextRequest.
 * Returns an object with the token values, or undefined for missing cookies.
 */
export function getAuthCookies(request: NextRequest): {
  accessToken: string | undefined;
  idToken: string | undefined;
  refreshToken: string | undefined;
} {
  return {
    accessToken: request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value,
    idToken: request.cookies.get(COOKIE_NAMES.ID_TOKEN)?.value,
    refreshToken: request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value,
  };
}

/**
 * Clears all auth cookies by setting maxAge=0 on the given NextResponse.
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  const { domain, secure } = authConfig.cookie;

  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, '', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
    domain,
  });

  response.cookies.set(COOKIE_NAMES.ID_TOKEN, '', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
    domain,
  });

  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, '', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 0,
    domain,
  });

  return response;
}
