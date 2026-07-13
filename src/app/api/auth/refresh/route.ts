import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { refreshSession } from '@/lib/auth/cognito';
import { getAuthCookies, setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  const { refreshToken, idToken } = getAuthCookies(request);

  if (!refreshToken) {
    const response = NextResponse.json(
      { error: { code: 'NO_REFRESH_TOKEN', message: 'Session expired. Please log in again.' } },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  // Decode the id_token (without verification) to extract the user's email.
  // The email is required by Cognito's refreshSession to construct a CognitoUser.
  let email: string | undefined;
  if (idToken) {
    try {
      const claims = decodeJwt(idToken);
      email = claims.email as string | undefined;
    } catch {
      // If id_token can't be decoded, we can't get the email
    }
  }

  if (!email) {
    const response = NextResponse.json(
      { error: { code: 'REFRESH_FAILED', message: 'Session expired. Please log in again.' } },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  try {
    const tokens = await refreshSession(email, refreshToken);

    // Support optional returnTo query parameter in the response
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo');

    const responseBody: { message: string; returnTo?: string } = {
      message: 'Token refreshed',
    };
    if (returnTo) {
      responseBody.returnTo = returnTo;
    }

    const response = NextResponse.json(responseBody);
    setAuthCookies(response, tokens);
    return response;
  } catch {
    const response = NextResponse.json(
      { error: { code: 'REFRESH_FAILED', message: 'Session expired. Please log in again.' } },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }
}
