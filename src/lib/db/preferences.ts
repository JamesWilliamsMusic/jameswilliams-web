/**
 * CRUD operations for fan notification preferences in DynamoDB.
 *
 * - createPreferences: stores a new record on signup with encrypted email
 * - getPreferences: fetches by fanId and decrypts the email field
 * - updatePreferences: updates notification categories
 * - deletePreferences: removes the record on account deletion
 */

import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, FAN_PREFERENCES_TABLE } from './client';
import { encryptField, decryptField, type EncryptedField } from '../privacy/encryption';

/** Notification category flags. */
export interface NotificationCategories {
  new_song: boolean;
  new_album: boolean;
  blog_post: boolean;
}

/** Input parameters for creating a new preferences record. */
export interface CreatePreferencesInput {
  fanId: string;
  email: string;
  consentVersion: string;
  consentDate: string;
}

/** The fan preferences record as stored in DynamoDB (email encrypted). */
export interface StoredFanPreferences {
  fanId: string;
  email: EncryptedField;
  categories: NotificationCategories;
  unsubscribeToken: string;
  consentVersion: string;
  consentDate: string;
  createdAt: string;
  updatedAt: string;
}

/** The fan preferences record returned to callers (email decrypted). */
export interface FanPreferences {
  fanId: string;
  email: string;
  categories: NotificationCategories;
  unsubscribeToken: string;
  consentVersion: string;
  consentDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a new fan preferences record in DynamoDB.
 *
 * Called during signup. Encrypts the email address with KMS envelope encryption,
 * sets all notification categories to true, and generates an unsubscribe token.
 *
 * @param input - Fan ID, email, and consent metadata
 * @returns The created preferences with decrypted email
 */
export async function createPreferences(
  input: CreatePreferencesInput,
): Promise<FanPreferences> {
  const { fanId, email, consentVersion, consentDate } = input;

  const encryptedEmail = await encryptField(email);
  const now = new Date().toISOString();
  const unsubscribeToken = crypto.randomUUID();

  const record: StoredFanPreferences = {
    fanId,
    email: encryptedEmail,
    categories: {
      new_song: true,
      new_album: true,
      blog_post: true,
    },
    unsubscribeToken,
    consentVersion,
    consentDate,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: FAN_PREFERENCES_TABLE,
      Item: record,
    }),
  );

  return {
    fanId,
    email,
    categories: record.categories,
    unsubscribeToken,
    consentVersion,
    consentDate,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Fetches fan preferences by fanId and decrypts the email field.
 *
 * @param fanId - The Cognito sub UUID (partition key)
 * @returns The preferences with decrypted email, or null if not found
 */
export async function getPreferences(
  fanId: string,
): Promise<FanPreferences | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: FAN_PREFERENCES_TABLE,
      Key: { fanId },
    }),
  );

  if (!result.Item) {
    return null;
  }

  const stored = result.Item as StoredFanPreferences;
  const decryptedEmail = await decryptField(stored.email);

  return {
    fanId: stored.fanId,
    email: decryptedEmail,
    categories: stored.categories,
    unsubscribeToken: stored.unsubscribeToken,
    consentVersion: stored.consentVersion,
    consentDate: stored.consentDate,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

/**
 * Updates notification categories for a fan.
 *
 * @param fanId - The Cognito sub UUID (partition key)
 * @param categories - The updated category preferences
 * @returns The updated preferences with decrypted email
 */
export async function updatePreferences(
  fanId: string,
  categories: NotificationCategories,
): Promise<FanPreferences | null> {
  const now = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: FAN_PREFERENCES_TABLE,
      Key: { fanId },
      UpdateExpression: 'SET categories = :categories, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':categories': categories,
        ':updatedAt': now,
      },
      ConditionExpression: 'attribute_exists(fanId)',
      ReturnValues: 'ALL_NEW',
    }),
  );

  if (!result.Attributes) {
    return null;
  }

  const stored = result.Attributes as StoredFanPreferences;
  const decryptedEmail = await decryptField(stored.email);

  return {
    fanId: stored.fanId,
    email: decryptedEmail,
    categories: stored.categories,
    unsubscribeToken: stored.unsubscribeToken,
    consentVersion: stored.consentVersion,
    consentDate: stored.consentDate,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

/**
 * Deletes a fan preferences record entirely.
 * Used during account deletion.
 *
 * @param fanId - The Cognito sub UUID (partition key)
 */
export async function deletePreferences(fanId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: FAN_PREFERENCES_TABLE,
      Key: { fanId },
    }),
  );
}
