import { NextRequest, NextResponse } from 'next/server';
import { globalSignOut } from '@/lib/auth/cognito';
import { getAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  const { accessToken } = getAuthCookies(request);
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Always clear cookies, even if globalSignOut fails
  clearAuthCookies(response);

  if (accessToken) {
    try {
      await globalSignOut(accessToken);
    } catch {
      // Graceful degradation — cookies are cleared regardless
    }
  }

  return response;
}
