import { NextRequest, NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation/schemas';
import { signUp, CognitoAuthError } from '@/lib/auth/cognito';
import { signupLimiter, applyRateLimitHeaders } from '@/lib/rate-limit/limiter';

export async function POST(request: NextRequest) {
  const rateCheck = signupLimiter(request);
  if (!rateCheck.allowed) return rateCheck.response!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON in request body' } },
      { status: 400 },
    );
  }

  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  try {
    await signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      consentVersion: '1.0',
      consentDate: new Date().toISOString(),
    });

    const response = NextResponse.json(
      { message: 'Account created. Please check your email for a verification code.' },
      { status: 201 },
    );

    return applyRateLimitHeaders(response, rateCheck, 3);
  } catch (error: unknown) {
    if (error instanceof CognitoAuthError && error.code === 'UsernameExistsException') {
      // Generic message to prevent email enumeration
      return NextResponse.json(
        { error: { code: 'SIGNUP_FAILED', message: 'Unable to create account. Please try again.' } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: 'SIGNUP_FAILED', message: 'Unable to create account. Please try again.' } },
      { status: 500 },
    );
  }
}
