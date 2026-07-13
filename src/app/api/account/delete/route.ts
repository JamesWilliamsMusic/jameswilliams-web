/**
 * POST /api/account/delete
 *
 * Account deletion endpoint for GDPR/Australian Privacy Act compliance.
 * Executes the full deletion workflow: revoke sessions, delete data,
 * delete Cognito user, write audit log, and clear cookies.
 *
 * Requirement 7: Privacy Compliance — Right to Erasure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';
import { verifyToken } from '@/lib/auth/tokens';
import { executeAccountDeletion } from '@/lib/privacy/deletion';

export async function POST(request: NextRequest) {
  // 1. Extract and verify access token
  const { accessToken } = getAuthCookies(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  let fanId: string;

  try {
    const claims = await verifyToken(accessToken, { tokenUse: 'access' });
    fanId = claims.sub;
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  // 2. Execute the deletion workflow (handles partial failures gracefully)
  const result = await executeAccountDeletion(fanId, accessToken);

  // 3. Build response and clear all auth cookies
  const response = NextResponse.json(
    {
      message: 'Account deleted successfully.',
      details: result.steps.map(({ step, success }) => ({ step, success })),
    },
    { status: 200 },
  );

  // 4. Clear all auth cookies regardless of step outcomes
  clearAuthCookies(response);

  return response;
}
