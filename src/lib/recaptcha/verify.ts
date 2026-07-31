const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY ?? '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SCORE_THRESHOLD = 0.5;

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface RecaptchaResult {
  valid: boolean;
  score?: number;
  error?: string;
}

/**
 * Verify a reCAPTCHA v3 token server-side.
 *
 * @param token - The token from the client
 * @param expectedAction - The action name to validate against (e.g. 'contact_submit')
 * @returns Whether the token is valid and the score meets the threshold
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: string = 'contact_submit',
): Promise<RecaptchaResult> {
  if (!RECAPTCHA_SECRET_KEY) {
    // If no secret key configured, skip verification (dev mode)
    return { valid: true, score: 1 };
  }

  if (!token) {
    return { valid: false, error: 'Missing reCAPTCHA token' };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    if (!response.ok) {
      return { valid: false, error: 'reCAPTCHA verification request failed' };
    }

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      return {
        valid: false,
        error: `reCAPTCHA failed: ${data['error-codes']?.join(', ') ?? 'unknown error'}`,
      };
    }

    if (data.action && data.action !== expectedAction) {
      return { valid: false, score: data.score, error: 'reCAPTCHA action mismatch' };
    }

    if (data.score !== undefined && data.score < SCORE_THRESHOLD) {
      return { valid: false, score: data.score, error: 'reCAPTCHA score too low' };
    }

    return { valid: true, score: data.score };
  } catch {
    return { valid: false, error: 'reCAPTCHA verification failed unexpectedly' };
  }
}
