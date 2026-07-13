/**
 * Unit tests for the data export builder.
 */

import { buildDataExport } from '@/lib/privacy/export';
import type { CognitoUserData } from '@/lib/privacy/export';

describe('buildDataExport', () => {
  const baseCognitoData: CognitoUserData = {
    userAttributes: [
      { Name: 'email', Value: 'fan@example.com' },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'custom:consent_version', Value: '1.0' },
      { Name: 'custom:consent_date', Value: '2025-01-01T00:00:00Z' },
    ],
    userCreateDate: new Date('2025-01-01T00:00:00Z'),
  };

  const basePreferences = {
    new_song: true,
    new_album: true,
    blog_post: false,
  };

  it('builds a complete export with all fields populated', () => {
    const result = buildDataExport(baseCognitoData, basePreferences);

    expect(result.exportVersion).toBe('1.0');
    expect(result.exportDate).toBeDefined();
    expect(result.account.email).toBe('fan@example.com');
    expect(result.account.emailVerified).toBe(true);
    expect(result.account.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(result.account.consentVersion).toBe('1.0');
    expect(result.account.consentDate).toBe('2025-01-01T00:00:00Z');
    expect(result.preferences).toEqual({
      new_song: true,
      new_album: true,
      blog_post: false,
    });
  });

  it('sets exportDate to current time', () => {
    const before = new Date().toISOString();
    const result = buildDataExport(baseCognitoData, basePreferences);
    const after = new Date().toISOString();

    expect(result.exportDate >= before).toBe(true);
    expect(result.exportDate <= after).toBe(true);
  });

  it('handles email_verified as false', () => {
    const data: CognitoUserData = {
      ...baseCognitoData,
      userAttributes: [
        { Name: 'email', Value: 'fan@example.com' },
        { Name: 'email_verified', Value: 'false' },
        { Name: 'custom:consent_version', Value: '1.0' },
        { Name: 'custom:consent_date', Value: '2025-01-01T00:00:00Z' },
      ],
    };

    const result = buildDataExport(data, basePreferences);

    expect(result.account.emailVerified).toBe(false);
  });

  it('defaults preferences to all false when null', () => {
    const result = buildDataExport(baseCognitoData, null);

    expect(result.preferences).toEqual({
      new_song: false,
      new_album: false,
      blog_post: false,
    });
  });

  it('handles missing user attributes gracefully', () => {
    const data: CognitoUserData = {
      userAttributes: [],
      userCreateDate: undefined,
    };

    const result = buildDataExport(data, basePreferences);

    expect(result.account.email).toBe('');
    expect(result.account.emailVerified).toBe(false);
    expect(result.account.createdAt).toBe('');
    expect(result.account.consentVersion).toBe('');
    expect(result.account.consentDate).toBe('');
  });
});
