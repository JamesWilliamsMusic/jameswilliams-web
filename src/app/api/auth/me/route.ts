/**
 * GET /api/auth/me
 *
 * Returns the current user's profile info by reading and verifying the id_token cookie.
 * Used by client components that need user data (since httpOnly cookies aren't accessible client-side).
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { verifyToken, type IdTokenClaims } from '@/lib/auth/tokens';
import { COOKIE_NAMES } from '@/lib/auth/cookies';

export async function GET() {
  const cookieStore = cookies();
  const idToken = cookieStore.get(COOKIE_NAMES.ID_TOKEN)?.value;

  if (!idToken) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  try {
    const claims = (await verifyToken(idToken, {
      tokenUse: 'id',
    })) as IdTokenClaims;

    return NextResponse.json({
      sub: claims.sub,
      email: claims.email,
      emailVerified: claims.email_verified,
      consentVersion: claims['custom:consent_version'] ?? null,
      consentDate: claims['custom:consent_date'] ?? null,
      createdAt: claims.iat,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 },
    );
  }
}
