/**
 * Unit tests for fan notification preferences CRUD operations.
 */

// Mock @aws-sdk/lib-dynamodb before any imports
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn((input) => ({ input })),
  GetCommand: jest.fn((input) => ({ input })),
  UpdateCommand: jest.fn((input) => ({ input })),
  DeleteCommand: jest.fn((input) => ({ input })),
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: jest.fn() })) },
}));

// Mock the DynamoDB document client
const mockSend = jest.fn();
jest.mock('@/lib/db/client', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  getFanPreferencesTable: () => 'test-fan-preferences',
}));

// Mock the KMS encryption helpers
jest.mock('@/lib/privacy/encryption', () => ({
  encryptField: jest.fn(async (plaintext: string) => ({
    encryptedData: `encrypted-${plaintext}`,
    encryptedDataKey: `key-for-${plaintext}`,
  })),
  decryptField: jest.fn(async (field: { encryptedData: string }) => {
    // Reverse the mock encryption
    return field.encryptedData.replace('encrypted-', '');
  }),
}));

// Mock crypto.randomUUID
const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => mockUUID,
  writable: true,
});

import {
  createPreferences,
  getPreferences,
  updatePreferences,
  deletePreferences,
} from '@/lib/db/preferences';

describe('preferences CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPreferences', () => {
    it('stores a new record with encrypted email, all categories true, consent metadata, and generated unsubscribeToken', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await createPreferences({
        fanId: 'user-123',
        email: 'fan@example.com',
        consentVersion: '1.0',
        consentDate: '2025-01-01T00:00:00.000Z',
      });

      // Verify PutCommand was sent with correct parameters
      const putCommand = mockSend.mock.calls[0][0];
      expect(putCommand.input.TableName).toBe('test-fan-preferences');
      expect(putCommand.input.Item.fanId).toBe('user-123');
      expect(putCommand.input.Item.email).toEqual({
        encryptedData: 'encrypted-fan@example.com',
        encryptedDataKey: 'key-for-fan@example.com',
      });
      expect(putCommand.input.Item.categories).toEqual({
        new_song: true,
        new_album: true,
        blog_post: true,
      });
      expect(putCommand.input.Item.unsubscribeToken).toBe(mockUUID);
      expect(putCommand.input.Item.consentVersion).toBe('1.0');
      expect(putCommand.input.Item.consentDate).toBe('2025-01-01T00:00:00.000Z');
      expect(putCommand.input.Item.createdAt).toBeDefined();
      expect(putCommand.input.Item.updatedAt).toBeDefined();

      // Verify returned result has decrypted email
      expect(result.fanId).toBe('user-123');
      expect(result.email).toBe('fan@example.com');
      expect(result.categories.new_song).toBe(true);
      expect(result.categories.new_album).toBe(true);
      expect(result.categories.blog_post).toBe(true);
      expect(result.unsubscribeToken).toBe(mockUUID);
    });
  });

  describe('getPreferences', () => {
    it('fetches record by fanId and decrypts email field', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          fanId: 'user-123',
          email: {
            encryptedData: 'encrypted-fan@example.com',
            encryptedDataKey: 'key-for-fan@example.com',
          },
          categories: { new_song: true, new_album: false, blog_post: true },
          unsubscribeToken: mockUUID,
          consentVersion: '1.0',
          consentDate: '2025-01-01T00:00:00.000Z',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      });

      const result = await getPreferences('user-123');

      const getCommand = mockSend.mock.calls[0][0];
      expect(getCommand.input.TableName).toBe('test-fan-preferences');
      expect(getCommand.input.Key).toEqual({ fanId: 'user-123' });

      expect(result).not.toBeNull();
      expect(result!.email).toBe('fan@example.com');
      expect(result!.categories.new_album).toBe(false);
    });

    it('returns null when record not found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await getPreferences('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('updates categories and updatedAt timestamp', async () => {
      mockSend.mockResolvedValueOnce({
        Attributes: {
          fanId: 'user-123',
          email: {
            encryptedData: 'encrypted-fan@example.com',
            encryptedDataKey: 'key-for-fan@example.com',
          },
          categories: { new_song: false, new_album: true, blog_post: false },
          unsubscribeToken: mockUUID,
          consentVersion: '1.0',
          consentDate: '2025-01-01T00:00:00.000Z',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-07-14T12:00:00.000Z',
        },
      });

      const newCategories = { new_song: false, new_album: true, blog_post: false };
      const result = await updatePreferences('user-123', newCategories);

      const updateCommand = mockSend.mock.calls[0][0];
      expect(updateCommand.input.TableName).toBe('test-fan-preferences');
      expect(updateCommand.input.Key).toEqual({ fanId: 'user-123' });
      expect(updateCommand.input.UpdateExpression).toContain('categories');
      expect(updateCommand.input.UpdateExpression).toContain('updatedAt');
      expect(updateCommand.input.ExpressionAttributeValues[':categories']).toEqual(newCategories);
      expect(updateCommand.input.ConditionExpression).toBe('attribute_exists(fanId)');

      expect(result).not.toBeNull();
      expect(result!.categories).toEqual(newCategories);
      expect(result!.email).toBe('fan@example.com');
    });

    it('returns null when record does not exist', async () => {
      mockSend.mockResolvedValueOnce({ Attributes: undefined });

      const result = await updatePreferences('nonexistent-id', {
        new_song: true,
        new_album: true,
        blog_post: true,
      });

      expect(result).toBeNull();
    });
  });

  describe('deletePreferences', () => {
    it('removes the record entirely', async () => {
      mockSend.mockResolvedValueOnce({});

      await deletePreferences('user-123');

      const deleteCommand = mockSend.mock.calls[0][0];
      expect(deleteCommand.input.TableName).toBe('test-fan-preferences');
      expect(deleteCommand.input.Key).toEqual({ fanId: 'user-123' });
    });
  });
});
