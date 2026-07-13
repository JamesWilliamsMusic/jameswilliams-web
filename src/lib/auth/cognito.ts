/**
 * Cognito client wrapper for all authentication operations.
 *
 * Uses `amazon-cognito-identity-js` for client-side SRP authentication:
 *   signUp, confirmSignUp, signIn, forgotPassword, confirmForgotPassword, refreshSession
 *
 * Uses `@aws-sdk/client-cognito-identity-provider` for server-side admin operations:
 *   globalSignOut, adminDeleteUser
 *
 * All functions return typed results and throw typed CognitoAuthError instances.
 */

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoRefreshToken,
  type ISignUpResult,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { authConfig } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tokens returned from a successful authentication or token refresh. */
export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

/** Result of a successful sign-up operation. */
export interface SignUpResult {
  userSub: string;
  userConfirmed: boolean;
}

/** Options for the signUp function. */
export interface SignUpParams {
  email: string;
  password: string;
  consentVersion: string;
  consentDate: string;
}

/** Options for the confirmForgotPassword function. */
export interface ConfirmForgotPasswordParams {
  email: string;
  code: string;
  newPassword: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/**
 * Typed error for Cognito authentication operations.
 * Mirrors the pattern from TokenVerificationError in tokens.ts.
 */
export class CognitoAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'CognitoAuthError';
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getUserPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: authConfig.cognito.userPoolId,
    ClientId: authConfig.cognito.clientId,
  });
}

function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({
    Username: email,
    Pool: getUserPool(),
  });
}

function getAdminClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({
    region: authConfig.cognito.region,
  });
}

/**
 * Wrap a Cognito error into a typed CognitoAuthError.
 * Preserves the original error's code property when available.
 */
function toCognitoAuthError(err: unknown, fallbackCode: string): CognitoAuthError {
  if (err instanceof CognitoAuthError) {
    return err;
  }

  const error = err as { code?: string; name?: string; message?: string };
  const code = error.code ?? error.name ?? fallbackCode;
  const message = error.message ?? 'An unknown authentication error occurred';

  return new CognitoAuthError(message, code, err);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new user in Cognito with email, password, and consent custom attributes.
 *
 * @param params - Sign-up parameters including email, password, and consent info
 * @returns The user's sub (UUID) and confirmation status
 * @throws CognitoAuthError on failure (e.g., user already exists, invalid password)
 */
export function signUp(params: SignUpParams): Promise<SignUpResult> {
  const { email, password, consentVersion, consentDate } = params;
  const userPool = getUserPool();

  const attributes: CognitoUserAttribute[] = [
    new CognitoUserAttribute({ Name: 'email', Value: email }),
    new CognitoUserAttribute({ Name: 'custom:consent_version', Value: consentVersion }),
    new CognitoUserAttribute({ Name: 'custom:consent_date', Value: consentDate }),
  ];

  return new Promise<SignUpResult>((resolve, reject) => {
    userPool.signUp(email, password, attributes, [], (err, result?: ISignUpResult) => {
      if (err) {
        reject(toCognitoAuthError(err, 'SIGN_UP_FAILED'));
        return;
      }

      if (!result) {
        reject(new CognitoAuthError('Sign-up returned no result', 'SIGN_UP_NO_RESULT'));
        return;
      }

      resolve({
        userSub: result.userSub,
        userConfirmed: result.userConfirmed,
      });
    });
  });
}

/**
 * Verify a user's email address with the confirmation code sent during sign-up.
 *
 * @param email - The user's email address
 * @param code - The 6-digit confirmation code
 * @throws CognitoAuthError on failure (e.g., invalid code, expired code)
 */
export function confirmSignUp(email: string, code: string): Promise<void> {
  const cognitoUser = getCognitoUser(email);

  return new Promise<void>((resolve, reject) => {
    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(toCognitoAuthError(err, 'CONFIRM_SIGN_UP_FAILED'));
        return;
      }
      resolve();
    });
  });
}

/**
 * Authenticate a user via SRP (Secure Remote Password) protocol.
 * Returns access, id, and refresh tokens on success.
 *
 * @param email - The user's email address
 * @param password - The user's password
 * @returns Authentication tokens (access, id, refresh)
 * @throws CognitoAuthError on failure (e.g., incorrect credentials, user not confirmed)
 */
export function signIn(email: string, password: string): Promise<AuthTokens> {
  const cognitoUser = getCognitoUser(email);
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  return new Promise<AuthTokens>((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session: CognitoUserSession) => {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        });
      },
      onFailure: (err) => {
        reject(toCognitoAuthError(err, 'SIGN_IN_FAILED'));
      },
    });
  });
}

/**
 * Initiate the forgot-password flow. Cognito sends a verification code to the user's email.
 *
 * @param email - The user's email address
 * @throws CognitoAuthError on failure (e.g., user not found — note: error messages
 *   should not reveal whether the user exists for security reasons)
 */
export function forgotPassword(email: string): Promise<void> {
  const cognitoUser = getCognitoUser(email);

  return new Promise<void>((resolve, reject) => {
    cognitoUser.forgotPassword({
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(toCognitoAuthError(err, 'FORGOT_PASSWORD_FAILED'));
      },
    });
  });
}

/**
 * Complete the forgot-password flow by setting a new password with the verification code.
 *
 * @param params - Email, verification code, and new password
 * @throws CognitoAuthError on failure (e.g., invalid code, weak password)
 */
export function confirmForgotPassword(params: ConfirmForgotPasswordParams): Promise<void> {
  const { email, code, newPassword } = params;
  const cognitoUser = getCognitoUser(email);

  return new Promise<void>((resolve, reject) => {
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve();
      },
      onFailure: (err) => {
        reject(toCognitoAuthError(err, 'CONFIRM_FORGOT_PASSWORD_FAILED'));
      },
    });
  });
}

/**
 * Revoke all active sessions for a user. Uses the AWS SDK admin client
 * with GlobalSignOut to invalidate all tokens server-side.
 *
 * @param accessToken - A valid access token for the user whose sessions to revoke
 * @throws CognitoAuthError on failure
 */
export async function globalSignOut(accessToken: string): Promise<void> {
  const client = getAdminClient();

  try {
    await client.send(
      new GlobalSignOutCommand({
        AccessToken: accessToken,
      }),
    );
  } catch (err) {
    throw toCognitoAuthError(err, 'GLOBAL_SIGN_OUT_FAILED');
  }
}

/**
 * Delete a user from Cognito. This is a server-side admin operation
 * that requires IAM permissions (not a user token).
 *
 * @param username - The Cognito username (email) of the user to delete
 * @throws CognitoAuthError on failure
 */
export async function adminDeleteUser(username: string): Promise<void> {
  const client = getAdminClient();

  try {
    await client.send(
      new AdminDeleteUserCommand({
        UserPoolId: authConfig.cognito.userPoolId,
        Username: username,
      }),
    );
  } catch (err) {
    throw toCognitoAuthError(err, 'ADMIN_DELETE_USER_FAILED');
  }
}

/**
 * Exchange a refresh token for new access and id tokens.
 *
 * @param email - The user's email address (needed to construct CognitoUser)
 * @param refreshToken - The refresh token string
 * @returns New authentication tokens (access, id, refresh)
 * @throws CognitoAuthError on failure (e.g., revoked refresh token)
 */
export function refreshSession(email: string, refreshToken: string): Promise<AuthTokens> {
  const cognitoUser = getCognitoUser(email);
  const token = new CognitoRefreshToken({ RefreshToken: refreshToken });

  return new Promise<AuthTokens>((resolve, reject) => {
    cognitoUser.refreshSession(token, (err: unknown, session: CognitoUserSession) => {
      if (err) {
        reject(toCognitoAuthError(err, 'REFRESH_SESSION_FAILED'));
        return;
      }

      if (!session) {
        reject(new CognitoAuthError('Refresh returned no session', 'REFRESH_NO_SESSION'));
        return;
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
}
