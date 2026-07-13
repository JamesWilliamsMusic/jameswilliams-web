/**
 * @jest-environment node
 */

/**
 * Unit tests for src/lib/privacy/deletion.ts
 *
 * Tests the multi-step account deletion orchestration:
 * - All steps succeed
 * - Partial failures are handled gracefully (log and continue)
 * - Each step is called with correct arguments
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGlobalSignOut = jest.fn();
const mockAdminDeleteUser = jest.fn();
jest.mock('@/lib/auth/cognito', () => ({
  globalSignOut: (...args: any[]) => mockGlobalSignOut(...args),
  adminDeleteUser: (...args: any[]) => mockAdminDeleteUser(...args),
}));

const mockDeletePreferences = jest.fn();
jest.mock('@/lib/db/preferences', () => ({
  deletePreferences: (...args: any[]) => mockDeletePreferences(...args),
}));

const mockWriteDeletionAudit = jest.fn();
jest.mock('@/lib/db/audit', () => ({
  writeDeletionAudit: (...args: any[]) => mockWriteDeletionAudit(...args),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('executeAccountDeletion', () => {
  let executeAccountDeletion: typeof import('@/lib/privacy/deletion').executeAccountDeletion;

  const fanId = 'test-fan-id-123';
  const accessToken = 'mock-access-token';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: all steps succeed
    mockGlobalSignOut.mockResolvedValue(undefined);
    mockDeletePreferences.mockResolvedValue(undefined);
    mockAdminDeleteUser.mockResolvedValue(undefined);
    mockWriteDeletionAudit.mockResolvedValue({
      auditId: 'audit-123',
      anonymisedId: 'hash-123',
      deletedAt: '2025-01-01T00:00:00.000Z',
      expiresAt: 1893456000,
    });

    const module = await import('@/lib/privacy/deletion');
    executeAccountDeletion = module.executeAccountDeletion;
  });

  describe('all steps succeed', () => {
    it('returns success with all steps marked successful', async () => {
      const result = await executeAccountDeletion(fanId, accessToken);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(4);
      expect(result.steps.every((s) => s.success)).toBe(true);
    });

    it('calls globalSignOut with the access token', async () => {
      await executeAccountDeletion(fanId, accessToken);

      expect(mockGlobalSignOut).toHaveBeenCalledWith(accessToken);
    });

    it('calls deletePreferences with the fanId', async () => {
      await executeAccountDeletion(fanId, accessToken);

      expect(mockDeletePreferences).toHaveBeenCalledWith(fanId);
    });

    it('calls adminDeleteUser with the fanId', async () => {
      await executeAccountDeletion(fanId, accessToken);

      expect(mockAdminDeleteUser).toHaveBeenCalledWith(fanId);
    });

    it('calls writeDeletionAudit with the fanId', async () => {
      await executeAccountDeletion(fanId, accessToken);

      expect(mockWriteDeletionAudit).toHaveBeenCalledWith(fanId);
    });

    it('executes steps in correct order', async () => {
      const callOrder: string[] = [];
      mockGlobalSignOut.mockImplementation(() => {
        callOrder.push('globalSignOut');
        return Promise.resolve();
      });
      mockDeletePreferences.mockImplementation(() => {
        callOrder.push('deletePreferences');
        return Promise.resolve();
      });
      mockAdminDeleteUser.mockImplementation(() => {
        callOrder.push('adminDeleteUser');
        return Promise.resolve();
      });
      mockWriteDeletionAudit.mockImplementation(() => {
        callOrder.push('writeDeletionAudit');
        return Promise.resolve({ auditId: 'a', anonymisedId: 'b', deletedAt: 'c', expiresAt: 1 });
      });

      await executeAccountDeletion(fanId, accessToken);

      expect(callOrder).toEqual([
        'globalSignOut',
        'deletePreferences',
        'adminDeleteUser',
        'writeDeletionAudit',
      ]);
    });
  });

  describe('partial failures', () => {
    it('continues when globalSignOut fails', async () => {
      mockGlobalSignOut.mockRejectedValue(new Error('Token already revoked'));

      const result = await executeAccountDeletion(fanId, accessToken);

      expect(result.success).toBe(true);
      expect(result.steps[0]).toEqual({
        step: 'globalSignOut',
        success: false,
        error: 'Token already revoked',
      });
      // Remaining steps still called
      expect(mockDeletePreferences).toHaveBeenCalled();
      expect(mockAdminDeleteUser).toHaveBeenCalled();
      expect(mockWriteDeletionAudit).toHaveBeenCalled();
    });

    it('continues when deletePreferences fails', async () => {
      mockDeletePreferences.mockRejectedValue(new Error('DynamoDB error'));

      const result = await executeAccountDeletion(fanId, accessToken);

      expect(result.success).toBe(true);
      expect(result.steps[1]).toEqual({
        step: 'deletePreferences',
        success: false,
        error: 'DynamoDB error',
      });
      expect(mockAdminDeleteUser).toHaveBeenCalled();
      expect(mockWriteDeletionAudit).toHaveBeenCalled();
    });

    it('continues when adminDeleteUser fails', async () => {
      mockAdminDeleteUser.mockRejectedValue(new Error('User not found'));

      const result = await executeAccountDeletion(fanId, accessToken);

      expect(result.success).toBe(true);
      expect(result.steps[2]).toEqual({
        step: 'adminDeleteUser',
        success: false,
        error: 'User not found',
      });
      expect(mockWriteDeletionAudit).toHaveBeenCalled();
    });

    it('continues when writeDeletionAudit fails', async () => {
      mockWriteDeletionAudit.mockRejectedValue(new Error('Audit write failed'));

      const result = await executeAccountDeletion(fanId, accessToken);

      expect(result.success).toBe(true);
      expect(result.steps[3]).toEqual({
        step: 'writeDeletionAudit',
        success: false,
        error: 'Audit write failed',
      });
    });

    it('handles all steps failing', async () => {
      mockGlobalSignOut.mockRejectedValue(new Error('Fail 1'));
      mockDeletePreferences.mockRejectedValue(new Error('Fail 2'));
      mockAdminDeleteUser.mockRejectedValue(new Error('Fail 3'));
      mockWriteDeletionAudit.mockRejectedValue(new Error('Fail 4'));

      const result = await executeAccountDeletion(fanId, accessToken);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(4);
      expect(result.steps.every((s) => !s.success)).toBe(true);
    });
  });
});
