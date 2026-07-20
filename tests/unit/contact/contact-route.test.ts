/**
 * @jest-environment node
 */

/**
 * Unit tests for src/app/api/contact/route.ts
 *
 * Mocks the rate limiter, email service, and sanitiser to test the
 * route handler logic: rate limiting, honeypot detection, validation,
 * sanitisation, email sending, and response structure.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks — must be defined before any imports that depend on them
// ---------------------------------------------------------------------------

const mockContactLimiter = jest.fn();
jest.mock('@/lib/rate-limit/limiter', () => ({
  contactLimiter: (...args: any[]) => mockContactLimiter(...args),
}));

const mockSendContactEmail = jest.fn();
jest.mock('@/lib/email/ses', () => ({
  sendContactEmail: (...args: any[]) => mockSendContactEmail(...args),
}));

const mockStripHtml = jest.fn((input: string) => {
  // Use DOMPurify-style approach: iteratively remove tags to satisfy CodeQL
  let result = input;
  let previous = '';
  while (result !== previous) {
    previous = result;
    result = result.replace(/<[^>]*>/g, '');
  }
  return result;
});
jest.mock('@/lib/sanitize', () => ({
  stripHtml: (input: string) => mockStripHtml(input),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  subject: 'Hello there',
  message: 'This is a valid message that is long enough.',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/contact', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: rate limiter allows the request
    mockContactLimiter.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 900_000,
    });

    // Default: sendContactEmail succeeds
    mockSendContactEmail.mockResolvedValue(undefined);

    // Default: stripHtml removes tags (iterative to satisfy CodeQL)
    mockStripHtml.mockImplementation((input: string) => {
      let result = input;
      let previous = '';
      while (result !== previous) {
        previous = result;
        result = result.replace(/<[^>]*>/g, '');
      }
      return result;
    });

    // Import the route handler fresh
    const routeModule = await import('@/app/api/contact/route');
    POST = routeModule.POST;
  });

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------

  describe('rate limiting', () => {
    it('returns 429 when rate limit exceeded with retryAfterMinutes', async () => {
      const resetAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      mockContactLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe('RATE_LIMITED');
      expect(data.error.retryAfterMinutes).toBeGreaterThan(0);
      expect(data.error.message).toContain('try again');
    });

    it('does not call sendContactEmail when rate limited', async () => {
      mockContactLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 900_000,
      });

      const req = createRequest(validBody);
      await POST(req);

      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors
  // -------------------------------------------------------------------------

  describe('validation errors', () => {
    it('returns 400 for missing name field', async () => {
      const req = createRequest({ email: 'a@b.com', message: 'Valid message here.' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.name).toBeDefined();
    });

    it('returns 400 for missing email field', async () => {
      const req = createRequest({ name: 'Jane', message: 'Valid message here.' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.email).toBeDefined();
    });

    it('returns 400 for invalid email format', async () => {
      const req = createRequest({
        name: 'Jane',
        email: 'not-an-email',
        message: 'Valid message here.',
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.email).toBeDefined();
    });

    it('returns 400 for missing message field', async () => {
      const req = createRequest({ name: 'Jane', email: 'a@b.com' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.message).toBeDefined();
    });

    it('returns 400 for message too short (less than 10 chars)', async () => {
      const req = createRequest({
        name: 'Jane',
        email: 'a@b.com',
        message: 'Short',
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.message).toBeDefined();
    });

    it('returns 400 for name exceeding 100 characters', async () => {
      const req = createRequest({
        name: 'A'.repeat(101),
        email: 'a@b.com',
        message: 'Valid message here.',
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.name).toBeDefined();
    });

    it('returns 400 for message exceeding 2000 characters', async () => {
      const req = createRequest({
        name: 'Jane',
        email: 'a@b.com',
        message: 'A'.repeat(2001),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.message).toBeDefined();
    });

    it('returns 400 for subject exceeding 200 characters', async () => {
      const req = createRequest({
        name: 'Jane',
        email: 'a@b.com',
        subject: 'S'.repeat(201),
        message: 'Valid message here.',
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.subject).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Honeypot detection
  // -------------------------------------------------------------------------

  describe('honeypot detection', () => {
    it('returns fake 200 success when honeypot field has value', async () => {
      const req = createRequest({ ...validBody, website: 'http://spam.bot' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        "Thank you for your enquiry. We'll be in touch soon.",
      );
    });

    it('does not call sendContactEmail when honeypot is triggered', async () => {
      const req = createRequest({ ...validBody, website: 'spam' });
      await POST(req);

      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('response is identical in structure to real success', async () => {
      // Honeypot response
      const honeypotReq = createRequest({ ...validBody, website: 'bot' });
      const honeypotResponse = await POST(honeypotReq);
      const honeypotData = await honeypotResponse.json();

      // Real success response
      const realReq = createRequest(validBody);
      const realResponse = await POST(realReq);
      const realData = await realResponse.json();

      expect(honeypotResponse.status).toBe(realResponse.status);
      expect(honeypotData).toEqual(realData);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe('happy path', () => {
    it('returns 200 with success message for valid submission', async () => {
      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        "Thank you for your enquiry. We'll be in touch soon.",
      );
    });

    it('calls sendContactEmail with sanitised data', async () => {
      const req = createRequest(validBody);
      await POST(req);

      expect(mockSendContactEmail).toHaveBeenCalledTimes(1);
      expect(mockSendContactEmail).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Hello there',
        message: 'This is a valid message that is long enough.',
      });
    });

    it('strips HTML from input fields before sending email', async () => {
      const htmlBody = {
        name: '<b>Jane</b>',
        email: 'jane@example.com',
        subject: '<script>alert("xss")</script>Subject',
        message: '<p>This is a message with HTML tags inside.</p>',
      };

      const req = createRequest(htmlBody);
      await POST(req);

      // stripHtml should be called for each field
      expect(mockStripHtml).toHaveBeenCalled();
      // The sanitised values (tags stripped) should be passed to sendContactEmail
      const callArgs = mockSendContactEmail.mock.calls[0][0];
      expect(callArgs.name).not.toContain('<b>');
      expect(callArgs.subject).not.toContain('<script>');
      expect(callArgs.message).not.toContain('<p>');
    });
  });

  // -------------------------------------------------------------------------
  // SES failure
  // -------------------------------------------------------------------------

  describe('SES failure', () => {
    it('returns 500 with generic SEND_FAILED error when SES throws', async () => {
      mockSendContactEmail.mockRejectedValue(new Error('SES network timeout'));

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('SEND_FAILED');
      expect(data.error.message).toBe(
        'Unable to send your message. Please try again later.',
      );
    });

    it('does not reveal internal error details to client', async () => {
      mockSendContactEmail.mockRejectedValue(
        new Error('MessageRejected: Email address is not verified'),
      );

      const req = createRequest(validBody);
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(JSON.stringify(data)).not.toContain('MessageRejected');
      expect(JSON.stringify(data)).not.toContain('not verified');
    });
  });
});
