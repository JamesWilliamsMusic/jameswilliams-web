describe('auth/config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function setRequiredEnvVars() {
    process.env.COGNITO_USER_POOL_ID = 'ap-southeast-2_testPool';
    process.env.COGNITO_CLIENT_ID = 'test-client-id';
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  }

  describe('getAuthConfig', () => {
    it('throws if COGNITO_USER_POOL_ID is missing', () => {
      process.env.COGNITO_CLIENT_ID = 'test-client-id';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      delete process.env.COGNITO_USER_POOL_ID;

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(() => getAuthConfig()).toThrow(
        'Missing required environment variable: COGNITO_USER_POOL_ID',
      );
    });

    it('throws if COGNITO_CLIENT_ID is missing', () => {
      process.env.COGNITO_USER_POOL_ID = 'ap-southeast-2_testPool';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      delete process.env.COGNITO_CLIENT_ID;

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(() => getAuthConfig()).toThrow(
        'Missing required environment variable: COGNITO_CLIENT_ID',
      );
    });

    it('throws if NEXT_PUBLIC_APP_URL is missing', () => {
      process.env.COGNITO_USER_POOL_ID = 'ap-southeast-2_testPool';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(() => getAuthConfig()).toThrow(
        'Missing required environment variable: NEXT_PUBLIC_APP_URL',
      );
    });

    it('does not throw on module import when env vars are missing', () => {
      delete process.env.COGNITO_USER_POOL_ID;
      delete process.env.COGNITO_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(() => require('@/lib/auth/config')).not.toThrow();
    });

    it('uses default value for COGNITO_REGION when not set', () => {
      setRequiredEnvVars();
      delete process.env.COGNITO_REGION;

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig().cognito.region).toBe('ap-southeast-2');
    });

    it('uses provided COGNITO_REGION when set', () => {
      setRequiredEnvVars();
      process.env.COGNITO_REGION = 'us-east-1';

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig().cognito.region).toBe('us-east-1');
    });

    it('defaults COOKIE_SECURE to true', () => {
      setRequiredEnvVars();
      delete process.env.COOKIE_SECURE;

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig().cookie.secure).toBe(true);
    });

    it('sets COOKIE_SECURE to false when env var is "false"', () => {
      setRequiredEnvVars();
      process.env.COOKIE_SECURE = 'false';

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig().cookie.secure).toBe(false);
    });

    it('defaults COOKIE_DOMAIN to localhost', () => {
      setRequiredEnvVars();
      delete process.env.COOKIE_DOMAIN;

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig().cookie.domain).toBe('localhost');
    });

    it('uses provided COOKIE_DOMAIN when set', () => {
      setRequiredEnvVars();
      process.env.COOKIE_DOMAIN = 'jameswilliams.com.au';

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig().cookie.domain).toBe('jameswilliams.com.au');
    });

    it('exports all expected config properties', () => {
      setRequiredEnvVars();

      const { getAuthConfig } = require('@/lib/auth/config');
      expect(getAuthConfig()).toEqual({
        cognito: {
          userPoolId: 'ap-southeast-2_testPool',
          clientId: 'test-client-id',
          region: 'ap-southeast-2',
        },
        cookie: {
          domain: 'localhost',
          secure: true,
        },
        app: {
          url: 'https://example.com',
        },
      });
    });
  });

  describe('authConfig proxy', () => {
    it('accesses config properties lazily via proxy', () => {
      setRequiredEnvVars();

      const { authConfig } = require('@/lib/auth/config');
      expect(authConfig.cognito.userPoolId).toBe('ap-southeast-2_testPool');
      expect(authConfig.cognito.clientId).toBe('test-client-id');
      expect(authConfig.cognito.region).toBe('ap-southeast-2');
      expect(authConfig.cookie.domain).toBe('localhost');
      expect(authConfig.cookie.secure).toBe(true);
      expect(authConfig.app.url).toBe('https://example.com');
    });

    it('throws on property access when required env vars are missing', () => {
      delete process.env.COGNITO_USER_POOL_ID;
      delete process.env.COGNITO_CLIENT_ID;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { authConfig } = require('@/lib/auth/config');
      expect(() => authConfig.cognito).toThrow(
        'Missing required environment variable: COGNITO_USER_POOL_ID',
      );
    });
  });

  describe('publicAuthConfig', () => {
    it('only exposes region and appUrl', () => {
      setRequiredEnvVars();

      const { publicAuthConfig } = require('@/lib/auth/config');
      expect(publicAuthConfig.region).toBe('ap-southeast-2');
      expect(publicAuthConfig.appUrl).toBe('https://example.com');
    });

    it('does not expose user pool ID or client ID', () => {
      setRequiredEnvVars();

      const { publicAuthConfig } = require('@/lib/auth/config');
      expect(publicAuthConfig).not.toHaveProperty('userPoolId');
      expect(publicAuthConfig).not.toHaveProperty('clientId');
    });
  });
});
