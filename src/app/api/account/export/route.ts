/**
 * GET /api/account/export
 *
 * Data export endpoint for GDPR/Australian Privacy Act compliance.
 * Generates a JSON file containing all PII and preferences associated with the fan's account.
 *
 * Requirement 8.3: Generate a machine-readable (JSON) export of all PII.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { getAuthCookies } from '@/lib/auth/cookies';
import { verifyToken } from '@/lib/auth/tokens';
import { authConfig } from '@/lib/auth/config';
import { getPreferences } from '@/lib/db/preferences';
import { buildDataExport } from '@/lib/privacy/export';

export async function GET(request: NextRequest) {
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

  try {
    // 2. Fetch user attributes from Cognito
    const cognitoClient = new CognitoIdentityProviderClient({
      region: authConfig.cognito.region,
    });

    const cognitoResponse = await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: authConfig.cognito.userPoolId,
        Username: fanId,
      }),
    );

    // 3. Fetch preferences from DynamoDB (decrypted)
    const preferences = await getPreferences(fanId);

    // 4. Build the export payload
    const exportData = buildDataExport(
      {
        userAttributes: cognitoResponse.UserAttributes ?? [],
        userCreateDate: cognitoResponse.UserCreateDate,
      },
      preferences?.categories ?? null,
    );

    // 5. Return JSON with Content-Disposition header for file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="jameswilliams-data-export.json"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'EXPORT_FAILED', message: 'Failed to generate data export.' } },
      { status: 500 },
    );
  }
}
