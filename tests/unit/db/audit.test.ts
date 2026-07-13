/**
 * Unit tests for the anonymised deletion audit log writer.
 */

import { createHash } from 'crypto';

// Mock @aws-sdk/lib-dynamodb before any imports
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  PutCommand: jest.fn((input) => ({ input })),
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: jest.fn() })) },
}));

// Mock the DynamoDB document client
const mockSend = jest.fn();
jest.mock('@/lib/db/client', () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
  getFanDeletionAuditTable: () => 'test-fan-deletion-audit',
}));

// Mock crypto.randomUUID
const mockUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => mockUUID,
  writable: true,
});

import { writeDeletionAudit } from '@/lib/db/audit';

describe('writeDeletionAudit', () => {
  const fakeSub = 'cognito-sub-uuid-123';
  const expectedHash = createHash('sha256').update(fakeSub).digest('hex');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-14T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('generates a UUID for auditId', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await writeDeletionAudit(fakeSub);

    expect(result.auditId).toBe(mockUUID);
  });

  it('creates a SHA-256 hash of the Cognito sub for anonymisedId', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await writeDeletionAudit(fakeSub);

    expect(result.anonymisedId).toBe(expectedHash);
    // Ensure raw sub is NOT stored
    const putCommand = mockSend.mock.calls[0][0];
    expect(JSON.stringify(putCommand.input.Item)).not.toContain(fakeSub);
  });

  it('sets deletedAt to current ISO 8601 timestamp', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await writeDeletionAudit(fakeSub);

    expect(result.deletedAt).toBe('2025-07-14T10:00:00.000Z');
  });

  it('calculates expiresAt as current time + 7 years (Unix timestamp)', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await writeDeletionAudit(fakeSub);

    const nowSeconds = Math.floor(new Date('2025-07-14T10:00:00.000Z').getTime() / 1000);
    const sevenYearsSeconds = Math.floor(7 * 365.25 * 24 * 60 * 60);
    const expectedExpiresAt = nowSeconds + sevenYearsSeconds;

    expect(result.expiresAt).toBe(expectedExpiresAt);
  });

  it('writes record to FAN_DELETION_AUDIT_TABLE', async () => {
    mockSend.mockResolvedValueOnce({});

    await writeDeletionAudit(fakeSub);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const putCommand = mockSend.mock.calls[0][0];
    expect(putCommand.input.TableName).toBe('test-fan-deletion-audit');
    expect(putCommand.input.Item).toEqual({
      auditId: mockUUID,
      anonymisedId: expectedHash,
      deletedAt: '2025-07-14T10:00:00.000Z',
      expiresAt: expect.any(Number),
    });
  });

  it('never stores any PII in the audit record', async () => {
    mockSend.mockResolvedValueOnce({});
    const piiSub = 'user-with-pii-sub-value';

    await writeDeletionAudit(piiSub);

    const putCommand = mockSend.mock.calls[0][0];
    const itemJson = JSON.stringify(putCommand.input.Item);

    // The raw Cognito sub should never appear in the stored record
    expect(itemJson).not.toContain(piiSub);
    // Should only contain the hash
    const expectedPiiHash = createHash('sha256').update(piiSub).digest('hex');
    expect(putCommand.input.Item.anonymisedId).toBe(expectedPiiHash);
  });
});
