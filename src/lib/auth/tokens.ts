/**
 * JWT verification utilities for Cognito tokens.
 *
 * Uses the `jose` library to:
 * - Fetch and cache Cognito JWKS (JSON Web Key Set)
 * - Verify JWT signatures against the correct public key (kid)
 * - Validate standard claims: iss, token_use, exp
 * - Return typed decoded payloads for access and id tokens
 */

import {
  createRemoteJWKSet,
  jwtVerify,
  errors as joseErrors,
  type FlattenedJWSInput,
  type GetKeyFunction,
  type JWSHeaderParameters,
  type JWTPayload,
} from 'jose';
import { authConfig } from './config';

// ---------------------------------------------------------------------------
// Token claim interfaces
// ---------------------------------------------------------------------------

export interface AccessTokenClaims {
  sub: string;
  iss: string;
  client_id: string;
  token_use: 'access';
  scope: string;
  exp: number;
  iat: number;
}

export interface IdTokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  'custom:consent_version': string;
  'custom:consent_date': string;
  token_use: 'id';
  exp: number;
  iat: number;
}

export type TokenClaims = AccessTokenClaims | IdTokenClaims;

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

export class TokenVerificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}

export class TokenExpiredError extends TokenVerificationError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
    this.name = 'TokenExpiredError';
  }
}

export class InvalidSignatureError extends TokenVerificationError {
  constructor() {
    super('Token signature is invalid', 'INVALID_SIGNATURE');
    this.name = 'InvalidSignatureError';
  }
}

export class InvalidIssuerError extends TokenVerificationError {
  constructor(expected: string, received: string | undefined) {
    super(
      `Invalid token issuer. Expected "${expected}", received "${received ?? 'undefined'}"`,
      'INVALID_ISSUER',
    );
    this.name = 'InvalidIssuerError';
  }
}

export class InvalidTokenUseError extends TokenVerificationError {
  constructor(expected: string, received: string | undefined) {
    super(
      `Invalid token_use claim. Expected "${expected}", received "${received ?? 'undefined'}"`,
      'INVALID_TOKEN_USE',
    );
    this.name = 'InvalidTokenUseError';
  }
}

export class JwksFetchError extends TokenVerificationError {
  constructor(cause?: unknown) {
    const message =
      cause instanceof Error
        ? `Failed to fetch JWKS: ${cause.message}`
        : 'Failed to fetch JWKS';
    super(message, 'JWKS_FETCH_ERROR');
    this.name = 'JwksFetchError';
  }
}

export class MalformedTokenError extends TokenVerificationError {
  constructor() {
    super('Token is malformed or cannot be decoded', 'MALFORMED_TOKEN');
    this.name = 'MalformedTokenError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JWKSGetKeyFn = GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;

// ---------------------------------------------------------------------------
// JWKS cache
// ---------------------------------------------------------------------------

interface JwksCache {
  jwks: JWKSGetKeyFn | null;
  createdAt: number;
  ttlMs: number;
}

const DEFAULT_JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let jwksCache: JwksCache = {
  jwks: null,
  createdAt: 0,
  ttlMs: DEFAULT_JWKS_CACHE_TTL_MS,
};

/**
 * Configure the JWKS cache TTL. Useful for testing.
 */
export function setJwksCacheTtl(ttlMs: number): void {
  jwksCache.ttlMs = ttlMs;
}

/**
 * Clear the JWKS cache. Useful for testing or forced refresh.
 */
export function clearJwksCache(): void {
  jwksCache = {
    jwks: null,
    createdAt: 0,
    ttlMs: jwksCache.ttlMs,
  };
}

/**
 * Override the JWKS getter (for testing with local key sets).
 * Pass `null` to reset to default (remote fetch) behaviour.
 */
let jwksOverride: JWKSGetKeyFn | null = null;

export function setJwksForTesting(jwks: JWKSGetKeyFn | null): void {
  jwksOverride = jwks;
  clearJwksCache();
}

/**
 * Build the Cognito JWKS URL for the configured user pool.
 */
export function getJwksUrl(region?: string, userPoolId?: string): string {
  const r = region ?? authConfig.cognito.region;
  const poolId = userPoolId ?? authConfig.cognito.userPoolId;
  return `https://cognito-idp.${r}.amazonaws.com/${poolId}/.well-known/jwks.json`;
}

/**
 * Build the expected issuer URL for the configured user pool.
 */
export function getIssuerUrl(region?: string, userPoolId?: string): string {
  const r = region ?? authConfig.cognito.region;
  const poolId = userPoolId ?? authConfig.cognito.userPoolId;
  return `https://cognito-idp.${r}.amazonaws.com/${poolId}`;
}

/**
 * Get or create the cached JWKS keyset.
 * Fetches from the Cognito well-known endpoint and caches in memory with TTL.
 */
function getJwks(): JWKSGetKeyFn {
  // If a test override is set, always use it
  if (jwksOverride) {
    return jwksOverride;
  }

  const now = Date.now();
  const isExpired = now - jwksCache.createdAt > jwksCache.ttlMs;

  if (jwksCache.jwks && !isExpired) {
    return jwksCache.jwks;
  }

  const jwksUrl = new URL(getJwksUrl());
  const jwks = createRemoteJWKSet(jwksUrl);

  jwksCache = {
    jwks,
    createdAt: now,
    ttlMs: jwksCache.ttlMs,
  };

  return jwks;
}

// ---------------------------------------------------------------------------
// Token verification
// ---------------------------------------------------------------------------

export interface VerifyTokenOptions {
  /** Expected token_use claim ('access' or 'id'). */
  tokenUse: 'access' | 'id';
}

/**
 * Verify a Cognito JWT token.
 *
 * Performs full verification:
 * 1. Fetches JWKS (from cache or Cognito endpoint)
 * 2. Verifies signature against the correct kid
 * 3. Validates `iss` matches Cognito user pool URL
 * 4. Validates `token_use` claim
 * 5. Validates `exp` (jose handles this natively)
 *
 * @returns Typed decoded payload (AccessTokenClaims or IdTokenClaims)
 * @throws TokenExpiredError - token has expired
 * @throws InvalidSignatureError - signature verification failed
 * @throws InvalidIssuerError - issuer doesn't match expected Cognito URL
 * @throws InvalidTokenUseError - token_use claim doesn't match expected value
 * @throws JwksFetchError - failed to fetch JWKS from Cognito
 * @throws MalformedTokenError - token cannot be decoded
 */
export async function verifyToken(
  token: string,
  options: VerifyTokenOptions,
): Promise<AccessTokenClaims | IdTokenClaims> {
  if (!token || typeof token !== 'string') {
    throw new MalformedTokenError();
  }

  const expectedIssuer = getIssuerUrl();
  const jwks = getJwks();

  let payload: JWTPayload;

  try {
    const result = await jwtVerify(token, jwks, {
      issuer: expectedIssuer,
    });
    payload = result.payload;
  } catch (error: unknown) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new TokenExpiredError();
    }

    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      if (error.claim === 'iss') {
        const iss = tryExtractClaim(token, 'iss');
        throw new InvalidIssuerError(expectedIssuer, iss);
      }
      // Other claim validation failures
      throw new MalformedTokenError();
    }

    if (
      error instanceof joseErrors.JWSSignatureVerificationFailed ||
      error instanceof joseErrors.JWKSNoMatchingKey
    ) {
      throw new InvalidSignatureError();
    }

    if (error instanceof joseErrors.JWKSTimeout) {
      throw new JwksFetchError(error);
    }

    if (error instanceof joseErrors.JOSEError) {
      // Any other jose error (e.g. JWKSMultipleMatchingKeys, decoding errors)
      throw new MalformedTokenError();
    }

    if (error instanceof TypeError && (error as Error).message.includes('fetch')) {
      throw new JwksFetchError(error);
    }

    throw new MalformedTokenError();
  }

  // Validate token_use claim
  const tokenUse = payload['token_use'] as string | undefined;
  if (tokenUse !== options.tokenUse) {
    throw new InvalidTokenUseError(options.tokenUse, tokenUse);
  }

  if (options.tokenUse === 'access') {
    return payload as unknown as AccessTokenClaims;
  }

  return payload as unknown as IdTokenClaims;
}

/**
 * Lightweight check of whether a JWT is expired by decoding (without verification).
 * Used by middleware for quick gating — full verification happens in API routes.
 *
 * Returns `true` if the token is expired or cannot be decoded.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;
    const exp = payload.exp;
    if (typeof exp !== 'number') return true;
    // Compare against current time in seconds
    return Math.floor(Date.now() / 1000) >= exp;
  } catch {
    return true;
  }
}

/**
 * Attempt to extract a claim from a JWT without verification (base64 decode only).
 * Used for error reporting purposes only.
 */
function tryExtractClaim(token: string, claim: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;
    return payload[claim] as string | undefined;
  } catch {
    return undefined;
  }
}
