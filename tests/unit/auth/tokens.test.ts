/**
 * @jest-environment node
 */

import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from 'jose';

// Mock the config module before importing tokens
jest.mock('@/lib/auth/config', () => ({
  authConfig: {
    cognito: {
      userPoolId: 'ap-southeast-2_TestPool123',
      clientId: 'test-client-id-123',
      region: 'ap-southeast-2',
    },
    cookie: { domain: 'localhost', secure: true },
    app: { url: 'https://example.com' },
  },
}));

import {
  verifyToken,
  getJwksUrl,
  getIssuerUrl,
  clearJwksCache,
  setJwksForTesting,
  isTokenExpired,
  TokenExpiredError,
  InvalidSignatureError,
  InvalidIssuerError,
  InvalidTokenUseError,
  MalformedTokenError,
} from '@/lib/auth/tokens';

const ISSUER = 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TestPool123';
const JWKS_URL =
  'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TestPool123/.well-known/jwks.json';

describe('auth/tokens', () => {
  let rsaKeyPair: Awaited<ReturnType<typeof generateKeyPair>>;
  let kid: string;

  beforeAll(async () => {
    rsaKeyPair = await generateKeyPair('RS256');
    kid = 'test-kid-001';
  });

  beforeEach(async () => {
    clearJwksCache();
    // Set up local JWKS for testing (avoids network fetching)
    const publicJwk = await exportJWK(rsaKeyPair.publicKey);
    publicJwk.kid = kid;
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    const localJwks = createLocalJWKSet({ keys: [publicJwk] });
    setJwksForTesting(localJwks);
  });

  afterEach(() => {
    setJwksForTesting(null);
  });

  async function createSignedToken(
    claims: Record<string, unknown>,
    options?: { expiresIn?: string; issuer?: string; keyId?: string },
  ): Promise<string> {
    const builder = new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: options?.keyId ?? kid })
      .setIssuedAt();

    if (options?.issuer !== undefined) {
      builder.setIssuer(options.issuer);
    } else {
      builder.setIssuer(ISSUER);
    }

    if (options?.expiresIn) {
      builder.setExpirationTime(options.expiresIn);
    } else {
      builder.setExpirationTime('1h');
    }

    return builder.sign(rsaKeyPair.privateKey);
  }

  describe('getJwksUrl', () => {
    it('returns the correct JWKS URL for configured pool', () => {
      expect(getJwksUrl()).toBe(JWKS_URL);
    });

    it('accepts custom region and userPoolId', () => {
      expect(getJwksUrl('us-east-1', 'us-east-1_CustomPool')).toBe(
        'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CustomPool/.well-known/jwks.json',
      );
    });
  });

  describe('getIssuerUrl', () => {
    it('returns the correct issuer URL for configured pool', () => {
      expect(getIssuerUrl()).toBe(ISSUER);
    });

    it('accepts custom region and userPoolId', () => {
      expect(getIssuerUrl('eu-west-1', 'eu-west-1_Pool')).toBe(
        'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_Pool',
      );
    });
  });

  describe('verifyToken - access tokens', () => {
    it('verifies a valid access token and returns typed claims', async () => {
      const token = await createSignedToken({
        sub: 'user-uuid-123',
        client_id: 'test-client-id-123',
        token_use: 'access',
        scope: 'openid email profile',
      });

      const result = await verifyToken(token, { tokenUse: 'access' });

      expect(result.sub).toBe('user-uuid-123');
      expect(result.token_use).toBe('access');
      expect((result as { iss: string }).iss).toBe(ISSUER);
      expect((result as { client_id: string }).client_id).toBe('test-client-id-123');
    });

    it('rejects an expired access token with TokenExpiredError', async () => {
      const token = await createSignedToken(
        { sub: 'user-uuid-123', token_use: 'access' },
        { expiresIn: '-1h' },
      );

      await expect(verifyToken(token, { tokenUse: 'access' })).rejects.toThrow(
        TokenExpiredError,
      );
    });

    it('rejects a token with wrong token_use claim', async () => {
      const token = await createSignedToken({
        sub: 'user-uuid-123',
        token_use: 'id',
      });

      await expect(verifyToken(token, { tokenUse: 'access' })).rejects.toThrow(
        InvalidTokenUseError,
      );
    });

    it('rejects a token with missing token_use claim', async () => {
      const token = await createSignedToken({
        sub: 'user-uuid-123',
      });

      await expect(verifyToken(token, { tokenUse: 'access' })).rejects.toThrow(
        InvalidTokenUseError,
      );
    });
  });

  describe('verifyToken - id tokens', () => {
    it('verifies a valid id token and returns typed claims', async () => {
      const token = await createSignedToken({
        sub: 'user-uuid-456',
        email: 'fan@example.com',
        email_verified: true,
        'custom:consent_version': '1.0',
        'custom:consent_date': '2025-01-01T00:00:00Z',
        token_use: 'id',
      });

      const result = await verifyToken(token, { tokenUse: 'id' });

      expect(result.sub).toBe('user-uuid-456');
      expect(result.token_use).toBe('id');
      expect((result as { email: string }).email).toBe('fan@example.com');
    });

    it('rejects an id token when access token expected', async () => {
      const token = await createSignedToken({
        sub: 'user-uuid-456',
        token_use: 'id',
      });

      await expect(verifyToken(token, { tokenUse: 'access' })).rejects.toThrow(
        InvalidTokenUseError,
      );
    });
  });

  describe('verifyToken - issuer validation', () => {
    it('rejects a token with wrong issuer', async () => {
      const token = await createSignedToken(
        { sub: 'user-uuid-123', token_use: 'access' },
        { issuer: 'https://wrong-issuer.example.com' },
      );

      await expect(verifyToken(token, { tokenUse: 'access' })).rejects.toThrow(
        InvalidIssuerError,
      );
    });
  });

  describe('verifyToken - signature validation', () => {
    it('rejects a token signed with a different key', async () => {
      const otherKeyPair = await generateKeyPair('RS256');

      const token = await new SignJWT({
        sub: 'user-uuid-123',
        token_use: 'access',
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'different-kid' })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setExpirationTime('1h')
        .sign(otherKeyPair.privateKey);

      await expect(verifyToken(token, { tokenUse: 'access' })).rejects.toThrow(
        InvalidSignatureError,
      );
    });
  });

  describe('verifyToken - malformed tokens', () => {
    it('rejects an empty string', async () => {
      await expect(verifyToken('', { tokenUse: 'access' })).rejects.toThrow(
        MalformedTokenError,
      );
    });

    it('rejects a non-JWT string', async () => {
      await expect(
        verifyToken('not-a-jwt-token', { tokenUse: 'access' }),
      ).rejects.toThrow(MalformedTokenError);
    });

    it('rejects null/undefined cast as string', async () => {
      await expect(
        verifyToken(null as unknown as string, { tokenUse: 'access' }),
      ).rejects.toThrow(MalformedTokenError);
    });
  });

  describe('JWKS caching', () => {
    it('uses the same JWKS getter across multiple verifications', async () => {
      const token1 = await createSignedToken({
        sub: 'user-1',
        token_use: 'access',
      });
      const token2 = await createSignedToken({
        sub: 'user-2',
        token_use: 'access',
      });

      const result1 = await verifyToken(token1, { tokenUse: 'access' });
      const result2 = await verifyToken(token2, { tokenUse: 'access' });

      expect(result1.sub).toBe('user-1');
      expect(result2.sub).toBe('user-2');
    });

    it('clearJwksCache allows a new JWKS to be set', async () => {
      // Verify with original key
      const token1 = await createSignedToken({
        sub: 'user-1',
        token_use: 'access',
      });
      const result1 = await verifyToken(token1, { tokenUse: 'access' });
      expect(result1.sub).toBe('user-1');

      // Generate a new key pair and set it as the JWKS
      const newKeyPair = await generateKeyPair('RS256');
      const newKid = 'new-test-kid-002';
      const newPublicJwk = await exportJWK(newKeyPair.publicKey);
      newPublicJwk.kid = newKid;
      newPublicJwk.alg = 'RS256';
      newPublicJwk.use = 'sig';

      const newLocalJwks = createLocalJWKSet({ keys: [newPublicJwk] });
      setJwksForTesting(newLocalJwks);

      // Token signed with old key should now fail
      await expect(verifyToken(token1, { tokenUse: 'access' })).rejects.toThrow(
        InvalidSignatureError,
      );

      // Token signed with new key should succeed
      const token2 = await new SignJWT({
        sub: 'user-2',
        token_use: 'access',
      })
        .setProtectedHeader({ alg: 'RS256', kid: newKid })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setExpirationTime('1h')
        .sign(newKeyPair.privateKey);

      const result2 = await verifyToken(token2, { tokenUse: 'access' });
      expect(result2.sub).toBe('user-2');
    });
  });

  describe('error codes', () => {
    it('TokenExpiredError has code TOKEN_EXPIRED', () => {
      const error = new TokenExpiredError();
      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.name).toBe('TokenExpiredError');
    });

    it('InvalidSignatureError has code INVALID_SIGNATURE', () => {
      const error = new InvalidSignatureError();
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.name).toBe('InvalidSignatureError');
    });

    it('InvalidIssuerError has code INVALID_ISSUER', () => {
      const error = new InvalidIssuerError('expected', 'received');
      expect(error.code).toBe('INVALID_ISSUER');
      expect(error.message).toContain('expected');
      expect(error.message).toContain('received');
    });

    it('InvalidTokenUseError has code INVALID_TOKEN_USE', () => {
      const error = new InvalidTokenUseError('access', 'id');
      expect(error.code).toBe('INVALID_TOKEN_USE');
      expect(error.message).toContain('access');
      expect(error.message).toContain('id');
    });

    it('MalformedTokenError has code MALFORMED_TOKEN', () => {
      const error = new MalformedTokenError();
      expect(error.code).toBe('MALFORMED_TOKEN');
    });
  });

  describe('isTokenExpired', () => {
    it('returns false for a non-expired token', async () => {
      const token = await createSignedToken({
        sub: 'user-1',
        token_use: 'access',
      });
      expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true for an expired token', async () => {
      const token = await createSignedToken(
        { sub: 'user-1', token_use: 'access' },
        { expiresIn: '-1h' },
      );
      expect(isTokenExpired(token)).toBe(true);
    });

    it('returns true for a malformed string', () => {
      expect(isTokenExpired('not-a-jwt')).toBe(true);
    });

    it('returns true for an empty string', () => {
      expect(isTokenExpired('')).toBe(true);
    });

    it('returns true for a token without exp claim', async () => {
      // Manually build a JWT payload without exp
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-1' })).toString('base64url');
      const fakeToken = `${header}.${payload}.fake-signature`;
      expect(isTokenExpired(fakeToken)).toBe(true);
    });
  });
});
