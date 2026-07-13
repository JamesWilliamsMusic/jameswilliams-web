/**
 * Data export builder for GDPR/Australian Privacy Act compliance.
 *
 * Assembles a machine-readable JSON export of all PII associated with a fan's account.
 * Used by GET /api/account/export.
 */

import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import type { NotificationCategories } from '../db/preferences';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportAccount {
  email: string;
  emailVerified: boolean;
  createdAt: string;
  consentVersion: string;
  consentDate: string;
}

export interface DataExport {
  exportVersion: string;
  exportDate: string;
  account: ExportAccount;
  preferences: NotificationCategories;
}

export interface CognitoUserData {
  userAttributes: AttributeType[];
  userCreateDate: Date | undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a named attribute value from a Cognito user attributes array.
 */
function getAttribute(
  attributes: AttributeType[],
  name: string,
): string | undefined {
  return attributes.find((attr) => attr.Name === name)?.Value;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build the data export payload from Cognito user data and DynamoDB preferences.
 *
 * @param cognitoData - User attributes and creation date from Cognito AdminGetUser
 * @param preferences - Notification category preferences (or null if not found)
 * @returns The complete data export conforming to the export schema
 */
export function buildDataExport(
  cognitoData: CognitoUserData,
  preferences: NotificationCategories | null,
): DataExport {
  const { userAttributes, userCreateDate } = cognitoData;

  const email = getAttribute(userAttributes, 'email') ?? '';
  const emailVerified = getAttribute(userAttributes, 'email_verified') === 'true';
  const consentVersion = getAttribute(userAttributes, 'custom:consent_version') ?? '';
  const consentDate = getAttribute(userAttributes, 'custom:consent_date') ?? '';
  const createdAt = userCreateDate ? userCreateDate.toISOString() : '';

  return {
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    account: {
      email,
      emailVerified,
      createdAt,
      consentVersion,
      consentDate,
    },
    preferences: preferences ?? {
      new_song: false,
      new_album: false,
      blog_post: false,
    },
  };
}
