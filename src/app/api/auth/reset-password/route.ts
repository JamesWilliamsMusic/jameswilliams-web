import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import { confirmForgotPassword } from '@/lib/auth/cognito';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 },
    );
  }

  try {
    await confirmForgotPassword({
      email: parsed.data.email,
      code: parsed.data.code,
      newPassword: parsed.data.newPassword,
    });
    return NextResponse.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'CodeMismatchException') {
      return NextResponse.json(
        { error: { code: 'INVALID_CODE', message: 'Invalid reset code.' } },
        { status: 400 },
      );
    }
    if (err.code === 'ExpiredCodeException') {
      return NextResponse.json(
        { error: { code: 'EXPIRED_CODE', message: 'Reset code has expired. Please request a new one.' } },
        { status: 400 },
      );
    }
    if (err.code === 'InvalidPasswordException') {
      return NextResponse.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Password does not meet requirements.' } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: 'RESET_FAILED', message: 'Password reset failed. Please try again.' } },
      { status: 500 },
    );
  }
}
