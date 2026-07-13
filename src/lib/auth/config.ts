/**
 * Centralised configuration module for Cognito authentication and related services.
 * Reads and validates all required environment variables at runtime.
 */

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

export interface AuthConfig {
  cognito: {
    userPoolId: string;
    clientId: string;
    region: string;
  };
  cookie: {
    domain: string;
    secure: boolean;
  };
  app: {
    url: string;
  };
}

/**
 * Server-side auth configuration.
 * Lazy-initialised to avoid throwing on module import in contexts
 * where only lightweight helpers (e.g. isTokenExpired) are needed.
 */
let _authConfig: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
  if (!_authConfig) {
    _authConfig = {
      cognito: {
        userPoolId: requireEnv('COGNITO_USER_POOL_ID'),
        clientId: requireEnv('COGNITO_CLIENT_ID'),
        region: optionalEnv('COGNITO_REGION', 'ap-southeast-2'),
      },
      cookie: {
        domain: optionalEnv('COOKIE_DOMAIN', 'localhost'),
        secure: optionalEnv('COOKIE_SECURE', 'true') !== 'false',
      },
      app: {
        url: requireEnv('NEXT_PUBLIC_APP_URL'),
      },
    };
  }
  return _authConfig;
}

/**
 * Convenience accessor — same as getAuthConfig() but as a getter property.
 * Throws a descriptive error if required environment variables are missing.
 */
export const authConfig: AuthConfig = new Proxy({} as AuthConfig, {
  get(_target, prop: string) {
    const config = getAuthConfig();
    return config[prop as keyof AuthConfig];
  },
});

/**
 * Client-safe config — contains only non-secret values safe for use in browser components.
 * Never expose user pool IDs, client IDs, or cookie domains to the client.
 */
export const publicAuthConfig = {
  get region() {
    return getAuthConfig().cognito.region;
  },
  get appUrl() {
    return getAuthConfig().app.url;
  },
} as const;
