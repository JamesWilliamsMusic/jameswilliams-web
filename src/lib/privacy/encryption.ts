/**
 * KMS Envelope Encryption helpers for PII fields stored in DynamoDB.
 *
 * Implements envelope encryption:
 *   1. GenerateDataKey → plaintext data key + encrypted data key
 *   2. Encrypt field with plaintext data key (AES-256-GCM)
 *   3. Store encrypted field + encrypted data key
 *   4. Discard plaintext data key from memory
 *
 * Decryption reverses the process using KMS Decrypt to recover the data key.
 */

import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

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

const region = optionalEnv('COGNITO_REGION', 'ap-southeast-2');

/** Singleton KMS client reused across Lambda invocations. */
const kmsClient = new KMSClient({ region });

/** KMS key ARN used for envelope encryption of PII fields. */
const KMS_KEY_ARN = requireEnv('KMS_KEY_ARN');

/** AES-256-GCM constants */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

export interface EncryptedField {
  /** Base64-encoded encrypted data (IV + ciphertext + auth tag) */
  encryptedData: string;
  /** Base64-encoded encrypted data key (for storage alongside encrypted data) */
  encryptedDataKey: string;
}

/**
 * Encrypts a plaintext string using envelope encryption with KMS.
 *
 * 1. Calls KMS GenerateDataKey to get a plaintext data key and its encrypted form
 * 2. Encrypts the input with AES-256-GCM using the plaintext data key
 * 3. Returns the encrypted data and encrypted data key (both base64 encoded)
 * 4. Plaintext data key is zeroed and discarded after use
 *
 * @param plaintext - The string to encrypt (e.g., an email address)
 * @returns The encrypted field data for storage in DynamoDB
 */
export async function encryptField(plaintext: string): Promise<EncryptedField> {
  // Step 1: Generate a data key from KMS
  const generateCommand = new GenerateDataKeyCommand({
    KeyId: KMS_KEY_ARN,
    KeySpec: 'AES_256',
  });

  const { Plaintext: plaintextKey, CiphertextBlob: encryptedKey } =
    await kmsClient.send(generateCommand);

  if (!plaintextKey || !encryptedKey) {
    throw new Error('KMS GenerateDataKey did not return expected key material');
  }

  try {
    // Step 2: Encrypt with AES-256-GCM
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(plaintextKey), iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Combine IV + ciphertext + auth tag into a single buffer
    const combined = Buffer.concat([iv, encrypted, authTag]);

    return {
      encryptedData: combined.toString('base64'),
      encryptedDataKey: Buffer.from(encryptedKey).toString('base64'),
    };
  } finally {
    // Step 4: Zero out plaintext data key from memory
    Buffer.from(plaintextKey).fill(0);
  }
}

/**
 * Decrypts an encrypted field using envelope encryption with KMS.
 *
 * 1. Calls KMS Decrypt to recover the plaintext data key
 * 2. Extracts IV, ciphertext, and auth tag from the encrypted data
 * 3. Decrypts the field using AES-256-GCM with the recovered data key
 * 4. Plaintext data key is zeroed and discarded after use
 *
 * @param encryptedField - The encrypted field data retrieved from DynamoDB
 * @returns The decrypted plaintext string
 */
export async function decryptField(encryptedField: EncryptedField): Promise<string> {
  const { encryptedData, encryptedDataKey } = encryptedField;

  // Step 1: Decrypt the data key using KMS
  const decryptCommand = new DecryptCommand({
    CiphertextBlob: Buffer.from(encryptedDataKey, 'base64'),
    KeyId: KMS_KEY_ARN,
  });

  const { Plaintext: plaintextKey } = await kmsClient.send(decryptCommand);

  if (!plaintextKey) {
    throw new Error('KMS Decrypt did not return plaintext key');
  }

  try {
    // Step 2: Parse the combined buffer (IV + ciphertext + auth tag)
    const combined = Buffer.from(encryptedData, 'base64');
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    // Step 3: Decrypt with AES-256-GCM
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(plaintextKey), iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } finally {
    // Step 4: Zero out plaintext data key from memory
    Buffer.from(plaintextKey).fill(0);
  }
}
