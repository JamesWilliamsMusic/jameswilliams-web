import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookies } from '@/lib/auth/cookies';
import { verifyToken, TokenVerificationError } from '@/lib/auth/tokens';
import { preferencesSchema } from '@/lib/validation/schemas';
import { getPreferences, updatePreferences } from '@/lib/db/preferences';

/**
 * GET /api/preferences
 * Fetches the authenticated fan's notification preferences.
 */
export async function GET(request: NextRequest) {
  const { accessToken } = getAuthCookies(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const claims = await verifyToken(accessToken, { tokenUse: 'access' });
    const fanId = claims.sub;

    const preferences = await getPreferences(fanId);

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    if (error instanceof TokenVerificationError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/preferences
 * Updates the authenticated fan's notification preferences.
 */
export async function PUT(request: NextRequest) {
  const { accessToken } = getAuthCookies(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  try {
    const claims = await verifyToken(accessToken, { tokenUse: 'access' });
    const fanId = claims.sub;

    const body = await request.json();
    const result = preferencesSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await updatePreferences(fanId, result.data.categories);

    if (!updated) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof TokenVerificationError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
