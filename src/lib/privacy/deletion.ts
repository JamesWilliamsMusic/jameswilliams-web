/**
 * Account deletion orchestration.
 *
 * Executes the multi-step deletion workflow:
 * 1. Revoke all sessions (Cognito GlobalSignOut)
 * 2. Delete DynamoDB preference record
 * 3. Delete Cognito user (AdminDeleteUser)
 * 4. Write anonymised audit log entry
 *
 * Partial failures are handled gracefully — each step logs errors
 * and continues with remaining steps. The workflow is best-effort:
 * even if one step fails, the remaining steps are still attempted.
 */

import { globalSignOut, adminDeleteUser } from '@/lib/auth/cognito';
import { deletePreferences } from '@/lib/db/preferences';
import { writeDeletionAudit } from '@/lib/db/audit';

/** Result of an individual deletion step. */
export interface DeletionStepResult {
  step: string;
  success: boolean;
  error?: string;
}

/** Overall result of the deletion workflow. */
export interface DeletionResult {
  success: boolean;
  steps: DeletionStepResult[];
}

/**
 * Executes the full account deletion workflow.
 *
 * Each step is executed sequentially. If a step fails, the error is
 * logged and the workflow continues with remaining steps. The overall
 * result is considered successful if the workflow completed (regardless
 * of individual step failures).
 *
 * @param fanId - The Cognito sub UUID of the fan to delete
 * @param accessToken - The fan's current access token (for GlobalSignOut)
 * @returns The deletion result with per-step status
 */
export async function executeAccountDeletion(
  fanId: string,
  accessToken: string,
): Promise<DeletionResult> {
  const steps: DeletionStepResult[] = [];

  // Step 1: Revoke all sessions
  try {
    await globalSignOut(accessToken);
    steps.push({ step: 'globalSignOut', success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[deletion] globalSignOut failed:', message);
    steps.push({ step: 'globalSignOut', success: false, error: message });
  }

  // Step 2: Delete DynamoDB preference record
  try {
    await deletePreferences(fanId);
    steps.push({ step: 'deletePreferences', success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[deletion] deletePreferences failed:', message);
    steps.push({ step: 'deletePreferences', success: false, error: message });
  }

  // Step 3: Delete Cognito user
  try {
    await adminDeleteUser(fanId);
    steps.push({ step: 'adminDeleteUser', success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[deletion] adminDeleteUser failed:', message);
    steps.push({ step: 'adminDeleteUser', success: false, error: message });
  }

  // Step 4: Write anonymised audit log
  try {
    await writeDeletionAudit(fanId);
    steps.push({ step: 'writeDeletionAudit', success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[deletion] writeDeletionAudit failed:', message);
    steps.push({ step: 'writeDeletionAudit', success: false, error: message });
  }

  return {
    success: true,
    steps,
  };
}
