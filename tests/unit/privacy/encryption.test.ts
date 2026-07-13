import { randomBytes } from 'crypto';

// Mock @aws-sdk/client-kms
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-kms', () => {
  return {
    KMSClient: jest.fn(() => ({ send: mockSend })),
    GenerateDataKeyCommand: jest.fn((input) => ({ input })),
    DecryptCommand: jest.fn((input) => ({ input })),
  };
});

describe('privacy/encryption', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.KMS_KEY_ARN = 'arn:aws:kms:ap-southeast-2:123456789012:key/test-key-id';
    mockSend.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockDataKey() {
    const plaintextKey = randomBytes(32); // AES-256 = 32 bytes
    const encryptedKey = randomBytes(64); // Simulated encrypted key blob
    return { plaintextKey, encryptedKey };
  }

  describe('encryptField', () => {
    it('calls KMS GenerateDataKey with the configured key ARN', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();
      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
        CiphertextBlob: encryptedKey,
      });

      const { encryptField } = require('@/lib/privacy/encryption');
      await encryptField('test@example.com');

      const { GenerateDataKeyCommand } = require('@aws-sdk/client-kms');
      expect(GenerateDataKeyCommand).toHaveBeenCalledWith({
        KeyId: 'arn:aws:kms:ap-southeast-2:123456789012:key/test-key-id',
        KeySpec: 'AES_256',
      });
    });

    it('encrypts input string with AES-256-GCM using plaintext data key', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();
      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
        CiphertextBlob: encryptedKey,
      });

      const { encryptField } = require('@/lib/privacy/encryption');
      const result = await encryptField('test@example.com');

      // Encrypted data should be base64 encoded
      expect(result.encryptedData).toBeTruthy();
      expect(() => Buffer.from(result.encryptedData, 'base64')).not.toThrow();

      // Combined buffer should be at least IV (12) + 1 byte ciphertext + auth tag (16)
      const combined = Buffer.from(result.encryptedData, 'base64');
      expect(combined.length).toBeGreaterThan(12 + 16);
    });

    it('returns encrypted data and encrypted data key both base64 encoded', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();
      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
        CiphertextBlob: encryptedKey,
      });

      const { encryptField } = require('@/lib/privacy/encryption');
      const result = await encryptField('hello@world.com');

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('encryptedDataKey');

      // Both should be valid base64
      const dataBuffer = Buffer.from(result.encryptedData, 'base64');
      const keyBuffer = Buffer.from(result.encryptedDataKey, 'base64');
      expect(dataBuffer.length).toBeGreaterThan(0);
      expect(keyBuffer.length).toBeGreaterThan(0);

      // Encrypted data key should match the one from KMS
      expect(keyBuffer).toEqual(Buffer.from(encryptedKey));
    });

    it('throws if KMS does not return key material', async () => {
      mockSend.mockResolvedValueOnce({
        Plaintext: undefined,
        CiphertextBlob: undefined,
      });

      const { encryptField } = require('@/lib/privacy/encryption');
      await expect(encryptField('test@example.com')).rejects.toThrow(
        'KMS GenerateDataKey did not return expected key material',
      );
    });

    it('produces different ciphertext for the same plaintext (due to random IV)', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();
      mockSend
        .mockResolvedValueOnce({ Plaintext: plaintextKey, CiphertextBlob: encryptedKey })
        .mockResolvedValueOnce({ Plaintext: plaintextKey, CiphertextBlob: encryptedKey });

      const { encryptField } = require('@/lib/privacy/encryption');
      const result1 = await encryptField('same@email.com');
      const result2 = await encryptField('same@email.com');

      expect(result1.encryptedData).not.toBe(result2.encryptedData);
    });
  });

  describe('decryptField', () => {
    it('calls KMS Decrypt to recover plaintext data key', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();

      // First call: GenerateDataKey for encryption
      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
        CiphertextBlob: encryptedKey,
      });

      const { encryptField, decryptField } = require('@/lib/privacy/encryption');
      const encrypted = await encryptField('test@example.com');

      // Second call: Decrypt for decryption
      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
      });

      await decryptField(encrypted);

      const { DecryptCommand } = require('@aws-sdk/client-kms');
      expect(DecryptCommand).toHaveBeenCalledWith({
        CiphertextBlob: Buffer.from(encrypted.encryptedDataKey, 'base64'),
        KeyId: 'arn:aws:kms:ap-southeast-2:123456789012:key/test-key-id',
      });
    });

    it('decrypts the field using recovered data key', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();

      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
        CiphertextBlob: encryptedKey,
      });

      const { encryptField, decryptField } = require('@/lib/privacy/encryption');
      const encrypted = await encryptField('test@example.com');

      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
      });

      const decrypted = await decryptField(encrypted);
      expect(decrypted).toBe('test@example.com');
    });

    it('correctly decrypts various email formats', async () => {
      const testEmails = [
        'simple@test.com',
        'user+tag@example.org',
        'long.email.address.with.dots@subdomain.domain.co.uk',
        'unicode-émàil@tëst.com',
      ];

      const { encryptField, decryptField } = require('@/lib/privacy/encryption');

      for (const email of testEmails) {
        const { plaintextKey, encryptedKey } = createMockDataKey();
        mockSend.mockResolvedValueOnce({
          Plaintext: plaintextKey,
          CiphertextBlob: encryptedKey,
        });

        const encrypted = await encryptField(email);

        mockSend.mockResolvedValueOnce({
          Plaintext: plaintextKey,
        });

        const decrypted = await decryptField(encrypted);
        expect(decrypted).toBe(email);
      }
    });

    it('throws if KMS Decrypt does not return plaintext key', async () => {
      mockSend.mockResolvedValueOnce({ Plaintext: undefined });

      const { decryptField } = require('@/lib/privacy/encryption');
      await expect(
        decryptField({
          encryptedData: Buffer.from('fake-data').toString('base64'),
          encryptedDataKey: Buffer.from('fake-key').toString('base64'),
        }),
      ).rejects.toThrow('KMS Decrypt did not return plaintext key');
    });

    it('throws on tampered ciphertext (auth tag verification fails)', async () => {
      const { plaintextKey, encryptedKey } = createMockDataKey();

      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
        CiphertextBlob: encryptedKey,
      });

      const { encryptField, decryptField } = require('@/lib/privacy/encryption');
      const encrypted = await encryptField('test@example.com');

      // Tamper with the encrypted data
      const tamperedBuffer = Buffer.from(encrypted.encryptedData, 'base64');
      tamperedBuffer[15] ^= 0xff; // Flip a byte in the ciphertext portion

      mockSend.mockResolvedValueOnce({
        Plaintext: plaintextKey,
      });

      await expect(
        decryptField({
          encryptedData: tamperedBuffer.toString('base64'),
          encryptedDataKey: encrypted.encryptedDataKey,
        }),
      ).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    it('throws if KMS_KEY_ARN is not set', () => {
      delete process.env.KMS_KEY_ARN;

      expect(() => require('@/lib/privacy/encryption')).toThrow(
        'Missing required environment variable: KMS_KEY_ARN',
      );
    });

    it('uses COGNITO_REGION for KMS client when set', () => {
      process.env.COGNITO_REGION = 'us-west-2';

      require('@/lib/privacy/encryption');

      const { KMSClient } = require('@aws-sdk/client-kms');
      expect(KMSClient).toHaveBeenCalledWith({ region: 'us-west-2' });
    });

    it('defaults to ap-southeast-2 when COGNITO_REGION is not set', () => {
      delete process.env.COGNITO_REGION;

      require('@/lib/privacy/encryption');

      const { KMSClient } = require('@aws-sdk/client-kms');
      expect(KMSClient).toHaveBeenCalledWith({ region: 'ap-southeast-2' });
    });
  });
});
