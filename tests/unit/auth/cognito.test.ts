/**
 * Unit tests for src/lib/auth/cognito.ts
 *
 * Mocks `amazon-cognito-identity-js` and `@aws-sdk/client-cognito-identity-provider`
 * to test the wrapper logic (promise conversion, error mapping, param forwarding).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  signUp,
  confirmSignUp,
  signIn,
  forgotPassword,
  confirmForgotPassword,
  globalSignOut,
  adminDeleteUser,
  refreshSession,
  CognitoAuthError,
} from '@/lib/auth/cognito';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSignUp = jest.fn();
const mockAuthenticateUser = jest.fn();
const mockConfirmRegistration = jest.fn();
const mockForgotPassword = jest.fn();
const mockConfirmPassword = jest.fn();
const mockRefreshSession = jest.fn();

jest.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: jest.fn().mockImplementation(() => ({
    signUp: mockSignUp,
  })),
  CognitoUser: jest.fn().mockImplementation(() => ({
    authenticateUser: mockAuthenticateUser,
    confirmRegistration: mockConfirmRegistration,
    forgotPassword: mockForgotPassword,
    confirmPassword: mockConfirmPassword,
    refreshSession: mockRefreshSession,
  })),
  CognitoUserAttribute: jest.fn().mockImplementation((data: any) => data),
  AuthenticationDetails: jest.fn().mockImplementation((data: any) => data),
  CognitoRefreshToken: jest.fn().mockImplementation((data: any) => data),
}));

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  AdminDeleteUserCommand: jest.fn().mockImplementation((params: any) => ({
    _type: 'AdminDeleteUserCommand',
    ...params,
  })),
  GlobalSignOutCommand: jest.fn().mockImplementation((params: any) => ({
    _type: 'GlobalSignOutCommand',
    ...params,
  })),
}));

jest.mock('@/lib/auth/config', () => ({
  authConfig: {
    cognito: {
      userPoolId: 'ap-southeast-2_TestPool',
      clientId: 'test-client-id-123',
      region: 'ap-southeast-2',
    },
    cookie: {
      domain: 'localhost',
      secure: true,
    },
    app: {
      url: 'https://example.com',
    },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession() {
  return {
    getAccessToken: () => ({ getJwtToken: () => 'mock-access-token' }),
    getIdToken: () => ({ getJwtToken: () => 'mock-id-token' }),
    getRefreshToken: () => ({ getToken: () => 'mock-refresh-token' }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auth/cognito', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('resolves with userSub and userConfirmed on success', async () => {
      mockSignUp.mockImplementation(
        (_username: string, _password: string, _attrs: any[], _validation: any[], cb: any) => {
          cb(null, { userSub: 'abc-123-sub', userConfirmed: false });
        },
      );

      const result = await signUp({
        email: 'fan@example.com',
        password: 'P@ssw0rd!',
        consentVersion: '1.0',
        consentDate: '2025-01-01T00:00:00Z',
      });

      expect(result).toEqual({ userSub: 'abc-123-sub', userConfirmed: false });
    });

    it('passes email, password, and consent attributes to CognitoUserPool.signUp', async () => {
      mockSignUp.mockImplementation(
        (_username: string, _password: string, _attrs: any[], _validation: any[], cb: any) => {
          cb(null, { userSub: 'sub-1', userConfirmed: false });
        },
      );

      await signUp({
        email: 'fan@example.com',
        password: 'Str0ng!Pass',
        consentVersion: '1.0',
        consentDate: '2025-07-14T00:00:00Z',
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        'fan@example.com',
        'Str0ng!Pass',
        expect.arrayContaining([
          expect.objectContaining({ Name: 'email', Value: 'fan@example.com' }),
          expect.objectContaining({ Name: 'custom:consent_version', Value: '1.0' }),
          expect.objectContaining({ Name: 'custom:consent_date', Value: '2025-07-14T00:00:00Z' }),
        ]),
        [],
        expect.any(Function),
      );
    });

    it('rejects with CognitoAuthError on failure', async () => {
      const error = { code: 'UsernameExistsException', message: 'User already exists' };
      mockSignUp.mockImplementation(
        (_u: string, _p: string, _a: any[], _v: any[], cb: any) => {
          cb(error);
        },
      );

      await expect(
        signUp({
          email: 'fan@example.com',
          password: 'P@ss1234!',
          consentVersion: '1.0',
          consentDate: '2025-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(CognitoAuthError);
    });

    it('rejects with CognitoAuthError when result is undefined', async () => {
      mockSignUp.mockImplementation(
        (_u: string, _p: string, _a: any[], _v: any[], cb: any) => {
          cb(null, undefined);
        },
      );

      await expect(
        signUp({
          email: 'fan@example.com',
          password: 'P@ss1234!',
          consentVersion: '1.0',
          consentDate: '2025-01-01T00:00:00Z',
        }),
      ).rejects.toThrow('Sign-up returned no result');
    });
  });

  describe('confirmSignUp', () => {
    it('resolves on successful confirmation', async () => {
      mockConfirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: any) => {
          cb(null, 'SUCCESS');
        },
      );

      await expect(confirmSignUp('fan@example.com', '123456')).resolves.toBeUndefined();
    });

    it('passes the code and forceAliasCreation=true', async () => {
      mockConfirmRegistration.mockImplementation((_c: string, _f: boolean, cb: any) => {
        cb(null);
      });

      await confirmSignUp('fan@example.com', '654321');

      expect(mockConfirmRegistration).toHaveBeenCalledWith('654321', true, expect.any(Function));
    });

    it('rejects with CognitoAuthError on failure', async () => {
      mockConfirmRegistration.mockImplementation((_c: string, _f: boolean, cb: any) => {
        cb({ code: 'CodeMismatchException', message: 'Invalid verification code' });
      });

      await expect(confirmSignUp('fan@example.com', '000000')).rejects.toThrow(CognitoAuthError);
    });
  });

  describe('signIn', () => {
    it('resolves with tokens on successful SRP authentication', async () => {
      mockAuthenticateUser.mockImplementation((_details: any, callbacks: any) => {
        callbacks.onSuccess(mockSession());
      });

      const result = await signIn('fan@example.com', 'P@ssw0rd!');

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('rejects with CognitoAuthError on incorrect credentials', async () => {
      mockAuthenticateUser.mockImplementation((_details: any, callbacks: any) => {
        callbacks.onFailure({
          code: 'NotAuthorizedException',
          message: 'Incorrect username or password',
        });
      });

      await expect(signIn('fan@example.com', 'wrong')).rejects.toThrow(CognitoAuthError);
    });

    it('includes the original error code in the CognitoAuthError', async () => {
      mockAuthenticateUser.mockImplementation((_details: any, callbacks: any) => {
        callbacks.onFailure({
          code: 'UserNotConfirmedException',
          message: 'User is not confirmed',
        });
      });

      try {
        await signIn('fan@example.com', 'P@ss1234!');
        fail('Expected signIn to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(CognitoAuthError);
        expect((err as CognitoAuthError).code).toBe('UserNotConfirmedException');
      }
    });
  });

  describe('forgotPassword', () => {
    it('resolves on success (code sent)', async () => {
      mockForgotPassword.mockImplementation((callbacks: any) => {
        callbacks.onSuccess({});
      });

      await expect(forgotPassword('fan@example.com')).resolves.toBeUndefined();
    });

    it('rejects with CognitoAuthError on failure', async () => {
      mockForgotPassword.mockImplementation((callbacks: any) => {
        callbacks.onFailure({ code: 'LimitExceededException', message: 'Attempt limit exceeded' });
      });

      await expect(forgotPassword('fan@example.com')).rejects.toThrow(CognitoAuthError);
    });
  });

  describe('confirmForgotPassword', () => {
    it('resolves on successful password reset', async () => {
      mockConfirmPassword.mockImplementation(
        (_code: string, _newPass: string, callbacks: any) => {
          callbacks.onSuccess('SUCCESS');
        },
      );

      await expect(
        confirmForgotPassword({
          email: 'fan@example.com',
          code: '123456',
          newPassword: 'NewP@ss1!',
        }),
      ).resolves.toBeUndefined();
    });

    it('passes code and new password to confirmPassword', async () => {
      mockConfirmPassword.mockImplementation(
        (_code: string, _newPass: string, callbacks: any) => {
          callbacks.onSuccess('SUCCESS');
        },
      );

      await confirmForgotPassword({
        email: 'fan@example.com',
        code: '999888',
        newPassword: 'Str0ng!New',
      });

      expect(mockConfirmPassword).toHaveBeenCalledWith(
        '999888',
        'Str0ng!New',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onFailure: expect.any(Function),
        }),
      );
    });

    it('rejects with CognitoAuthError on failure', async () => {
      mockConfirmPassword.mockImplementation(
        (_code: string, _newPass: string, callbacks: any) => {
          callbacks.onFailure({ code: 'ExpiredCodeException', message: 'Code has expired' });
        },
      );

      await expect(
        confirmForgotPassword({
          email: 'fan@example.com',
          code: '111111',
          newPassword: 'NewP@ss1!',
        }),
      ).rejects.toThrow(CognitoAuthError);
    });
  });

  describe('globalSignOut', () => {
    it('resolves on successful global sign-out', async () => {
      mockSend.mockResolvedValue({});

      await expect(globalSignOut('valid-access-token')).resolves.toBeUndefined();
    });

    it('sends GlobalSignOutCommand with the access token', async () => {
      mockSend.mockResolvedValue({});

      await globalSignOut('my-access-token');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'GlobalSignOutCommand',
          AccessToken: 'my-access-token',
        }),
      );
    });

    it('rejects with CognitoAuthError on failure', async () => {
      mockSend.mockRejectedValue({
        name: 'NotAuthorizedException',
        message: 'Access token has been revoked',
      });

      await expect(globalSignOut('revoked-token')).rejects.toThrow(CognitoAuthError);
    });
  });

  describe('adminDeleteUser', () => {
    it('resolves on successful user deletion', async () => {
      mockSend.mockResolvedValue({});

      await expect(adminDeleteUser('fan@example.com')).resolves.toBeUndefined();
    });

    it('sends AdminDeleteUserCommand with user pool ID and username', async () => {
      mockSend.mockResolvedValue({});

      await adminDeleteUser('fan@example.com');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'AdminDeleteUserCommand',
          UserPoolId: 'ap-southeast-2_TestPool',
          Username: 'fan@example.com',
        }),
      );
    });

    it('rejects with CognitoAuthError on failure', async () => {
      mockSend.mockRejectedValue({
        name: 'UserNotFoundException',
        message: 'User does not exist',
      });

      await expect(adminDeleteUser('nobody@example.com')).rejects.toThrow(CognitoAuthError);
    });
  });

  describe('refreshSession', () => {
    it('resolves with new tokens on success', async () => {
      mockRefreshSession.mockImplementation((_token: any, cb: any) => {
        cb(null, mockSession());
      });

      const result = await refreshSession('fan@example.com', 'refresh-token-value');

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('rejects with CognitoAuthError when refresh token is revoked', async () => {
      mockRefreshSession.mockImplementation((_token: any, cb: any) => {
        cb({ code: 'NotAuthorizedException', message: 'Refresh token has been revoked' });
      });

      await expect(refreshSession('fan@example.com', 'revoked-token')).rejects.toThrow(
        CognitoAuthError,
      );
    });

    it('rejects with CognitoAuthError when session is null', async () => {
      mockRefreshSession.mockImplementation((_token: any, cb: any) => {
        cb(null, null);
      });

      await expect(refreshSession('fan@example.com', 'token')).rejects.toThrow(
        'Refresh returned no session',
      );
    });
  });

  describe('CognitoAuthError', () => {
    it('has the correct name, code, and message', () => {
      const err = new CognitoAuthError('Something went wrong', 'TEST_CODE');
      expect(err.name).toBe('CognitoAuthError');
      expect(err.code).toBe('TEST_CODE');
      expect(err.message).toBe('Something went wrong');
      expect(err).toBeInstanceOf(Error);
    });

    it('preserves the original error', () => {
      const original = new Error('original');
      const err = new CognitoAuthError('Wrapped', 'WRAP_CODE', original);
      expect(err.originalError).toBe(original);
    });
  });
});
