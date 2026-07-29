/**
 * @jest-environment node
 */

export {};

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('verifyRecaptcha', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: 'test-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function getVerifyRecaptcha() {
    return (await import('@/lib/recaptcha/verify')).verifyRecaptcha;
  }

  it('returns valid when no secret key is configured (dev mode)', async () => {
    process.env.RECAPTCHA_SECRET_KEY = '';
    const verifyRecaptcha = await getVerifyRecaptcha();

    const result = await verifyRecaptcha('some-token');
    expect(result).toEqual({ valid: true, score: 1 });
  });

  it('returns invalid when token is empty', async () => {
    const verifyRecaptcha = await getVerifyRecaptcha();

    const result = await verifyRecaptcha('');
    expect(result).toEqual({ valid: false, error: 'Missing reCAPTCHA token' });
  });

  it('returns valid for successful verification with good score', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: 'contact_submit',
      }),
    });

    const verifyRecaptcha = await getVerifyRecaptcha();
    const result = await verifyRecaptcha('valid-token', 'contact_submit');

    expect(result).toEqual({ valid: true, score: 0.9 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns invalid when Google API returns success: false', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    });

    const verifyRecaptcha = await getVerifyRecaptcha();
    const result = await verifyRecaptcha('bad-token');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid-input-response');
  });

  it('returns invalid when action does not match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.9,
        action: 'wrong_action',
      }),
    });

    const verifyRecaptcha = await getVerifyRecaptcha();
    const result = await verifyRecaptcha('token', 'contact_submit');

    expect(result).toEqual({ valid: false, score: 0.9, error: 'reCAPTCHA action mismatch' });
  });

  it('returns invalid when score is below threshold', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        score: 0.2,
        action: 'contact_submit',
      }),
    });

    const verifyRecaptcha = await getVerifyRecaptcha();
    const result = await verifyRecaptcha('token', 'contact_submit');

    expect(result).toEqual({ valid: false, score: 0.2, error: 'reCAPTCHA score too low' });
  });

  it('returns invalid when fetch response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const verifyRecaptcha = await getVerifyRecaptcha();
    const result = await verifyRecaptcha('token');

    expect(result).toEqual({ valid: false, error: 'reCAPTCHA verification request failed' });
  });

  it('returns invalid when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const verifyRecaptcha = await getVerifyRecaptcha();
    const result = await verifyRecaptcha('token');

    expect(result).toEqual({ valid: false, error: 'reCAPTCHA verification failed unexpectedly' });
  });

  it('sends secret and token in request body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9, action: 'contact_submit' }),
    });

    const verifyRecaptcha = await getVerifyRecaptcha();
    await verifyRecaptcha('my-token', 'contact_submit');

    const call = mockFetch.mock.calls[0];
    const body = call[1].body as URLSearchParams;
    expect(body.get('secret')).toBe('test-secret');
    expect(body.get('response')).toBe('my-token');
  });
});
