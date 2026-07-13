import { NextRequest, NextResponse } from 'next/server';
import { confirmSignupSchema } from '@/lib/validation/schemas';
import { confirmSignUp } from '@/lib/auth/cognito';
import { confirmLimiter } from '@/lib/rate-limit/limiter';

export async function POST(request: NextRequest) {
  const rateCheck = confirmLimiter(request);
  if (!rateCheck.allowed) return rateCheck.response!;

  const body = await request.json();
  const parsed = confirmSignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  try {
    await confirmSignUp(parsed.data.email, parsed.data.code);
    return NextResponse.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'CodeMismatchException') {
      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } },
        { status: 400 },
      );
    }
    if (err.name === 'ExpiredCodeException') {
      return NextResponse.json(
        { error: { code: 'EXPIRED_CODE', message: 'Verification code has expired. Please request a new one.' } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: 'CONFIRM_FAILED', message: 'Verification failed. Please try again.' } },
      { status: 500 },
    );
  }
}
