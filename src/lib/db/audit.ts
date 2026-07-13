/**
 * Anonymised deletion audit log writer for GDPR/Privacy Act compliance.
 *
 * Records that an account deletion occurred without storing any PII.
 * The Cognito sub is SHA-256 hashed to create an anonymised identifier,
 * and a 7-year TTL is set for DynamoDB automatic expiry.
 */

import { createHash } from 'crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, FAN_DELETION_AUDIT_TABLE } from './client';

/** The anonymised deletion audit record stored in DynamoDB. */
export interface DeletionAuditEntry {
  auditId: string;
  anonymisedId: string;
  deletedAt: string;
  expiresAt: number;
}

/** Seven years in seconds (365.25 days/year to account for leap years). */
const SEVEN_YEARS_SECONDS = Math.floor(7 * 365.25 * 24 * 60 * 60);

/**
 * Creates a SHA-256 hash of the given input string.
 * Used to anonymise the Cognito sub before storing in the audit log.
 *
 * @param value - The raw string to hash (e.g. Cognito sub UUID)
 * @returns Hex-encoded SHA-256 hash
 */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Writes an anonymised deletion audit record to DynamoDB.
 *
 * Called after a fan account is fully deleted. The record contains:
 * - A random UUID as partition key
 * - A SHA-256 hash of the Cognito sub (no raw PII)
 * - The deletion timestamp in ISO 8601
 * - A TTL timestamp 7 years in the future for automatic DynamoDB expiry
 *
 * @param cognitoSub - The Cognito user sub UUID (will be hashed, never stored raw)
 * @returns The audit entry that was written
 */
export async function writeDeletionAudit(
  cognitoSub: string,
): Promise<DeletionAuditEntry> {
  const auditId = crypto.randomUUID();
  const anonymisedId = sha256(cognitoSub);
  const now = new Date();
  const deletedAt = now.toISOString();
  const expiresAt = Math.floor(now.getTime() / 1000) + SEVEN_YEARS_SECONDS;

  const record: DeletionAuditEntry = {
    auditId,
    anonymisedId,
    deletedAt,
    expiresAt,
  };

  await docClient.send(
    new PutCommand({
      TableName: FAN_DELETION_AUDIT_TABLE,
      Item: record,
    }),
  );

  return record;
}
