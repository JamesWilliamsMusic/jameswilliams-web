import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { loginSchema } from '@/lib/validation/schemas';
import { signIn } from '@/lib/auth/cognito';
import { setAuthCookies } from '@/lib/auth/cookies';
import { loginLimiter } from '@/lib/rate-limit/limiter';

export async function POST(request: NextRequest) {
  const rateCheck = loginLimiter(request);
  if (!rateCheck.allowed) return rateCheck.response!;

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  try {
    const tokens = await signIn(parsed.data.email, parsed.data.password);

    // Decode id token to extract minimal user info (no verification needed —
    // token was just issued fresh from Cognito)
    const claims = decodeJwt(tokens.idToken);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        email: claims.email as string,
        email_verified: claims.email_verified as boolean,
      },
    });
    setAuthCookies(response, tokens);
    return response;
  } catch {
    // Generic message for all auth failures — no email enumeration
    return NextResponse.json(
      { error: { code: 'AUTH_FAILED', message: 'Invalid email or password.' } },
      { status: 401 },
    );
  }
}
