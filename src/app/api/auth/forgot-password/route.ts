import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validation/schemas';
import { forgotPassword } from '@/lib/auth/cognito';
import { forgotPasswordLimiter } from '@/lib/rate-limit/limiter';

export async function POST(request: NextRequest) {
  const rateCheck = forgotPasswordLimiter(request);
  if (!rateCheck.allowed) return rateCheck.response!;

  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  try {
    await forgotPassword(parsed.data.email);
  } catch {
    // Swallow errors — same response regardless of whether email exists
  }

  // Always return same message to prevent email enumeration
  return NextResponse.json({
    message: 'If an account exists with that email, a password reset code has been sent.',
  });
}
