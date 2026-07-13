/**
 * DynamoDB Document Client singleton and table name constants.
 * Configured for the ap-southeast-2 region (or COGNITO_REGION override).
 * The client is instantiated at module level so it's reused across Lambda invocations.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Ensure it is set in your environment or .env file.`,
    );
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/** DynamoDB table name for fan notification preferences. */
export function getFanPreferencesTable(): string {
  return requireEnv('FAN_PREFERENCES_TABLE');
}

/** DynamoDB table name for anonymised deletion audit logs. */
export function getFanDeletionAuditTable(): string {
  return requireEnv('FAN_DELETION_AUDIT_TABLE');
}

const region = optionalEnv('COGNITO_REGION', 'ap-southeast-2');

const ddbClient = new DynamoDBClient({ region });

/**
 * DynamoDB Document Client singleton.
 * Configured with marshalling options for safe handling of empty values and numbers.
 */
export const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
