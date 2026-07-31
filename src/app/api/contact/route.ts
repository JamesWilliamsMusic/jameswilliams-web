import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation/contact';
import { stripHtml } from '@/lib/sanitize';
import { sendContactEmail } from '@/lib/email/ses';
import { contactLimiter } from '@/lib/rate-limit/limiter';
import { verifyRecaptcha } from '@/lib/recaptcha/verify';
import { createLogger } from '@/lib/logger';

const log = createLogger('api/contact');

export async function POST(request: NextRequest) {
  log.debug('Incoming POST request', { url: request.url });

  // 1. Rate limit check
  const rateCheck = contactLimiter(request);
  log.debug('Rate limit check', { allowed: rateCheck.allowed, remaining: rateCheck.remaining });
  if (!rateCheck.allowed) {
    const retryAfterMinutes = Math.ceil(
      (rateCheck.resetAt - Date.now()) / (60 * 1000),
    );
    log.warn('Rate limited', { retryAfterMinutes });
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: `Too many submissions. Please try again in ${retryAfterMinutes} minutes.`,
          retryAfterMinutes,
        },
      },
      { status: 429 },
    );
  }

  // 2. Parse body (supports JSON and form-encoded)
  let body: Record<string, unknown>;
  const contentType = request.headers.get('content-type') ?? '';
  log.debug('Content-Type', { contentType });
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  }
  log.debug('Parsed body fields', { fields: Object.keys(body), hasRecaptchaToken: !!body.recaptchaToken, tokenLength: String(body.recaptchaToken ?? '').length });

  // 3. Honeypot check — bots filling hidden field get a fake success
  if (body.website && typeof body.website === 'string' && body.website.length > 0) {
    log.info('Honeypot triggered — returning fake success');
    return NextResponse.json({
      message: "Thank you for your enquiry. We'll be in touch soon.",
    });
  }

  // 4. reCAPTCHA verification
  const recaptchaToken = (body.recaptchaToken as string) ?? '';
  log.debug('Verifying reCAPTCHA', { tokenLength: recaptchaToken.length });
  const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'contact_submit');
  log.debug('reCAPTCHA result', recaptchaResult);
  if (!recaptchaResult.valid) {
    log.warn('reCAPTCHA failed', { error: recaptchaResult.error, score: recaptchaResult.score });
    return NextResponse.json(
      {
        error: {
          code: 'RECAPTCHA_FAILED',
          message: 'reCAPTCHA verification failed. Please try again.',
        },
      },
      { status: 400 },
    );
  }

  // 5. Zod validation
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fields[field]) fields[field] = [];
      fields[field].push(issue.message);
    }
    log.debug('Validation failed', { fields });
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', fields } },
      { status: 400 },
    );
  }
  log.debug('Validation passed', { name: parsed.data.name, email: parsed.data.email });

  // 6. Sanitise all string fields
  const sanitised = {
    name: stripHtml(parsed.data.name),
    email: stripHtml(parsed.data.email),
    subject: stripHtml(parsed.data.subject),
    message: stripHtml(parsed.data.message),
  };
  log.debug('Sanitised data', { name: sanitised.name, subject: sanitised.subject });

  // 7. Send email via SES
  log.debug('Sending email via SES', {
    from: process.env.SES_FROM_EMAIL ?? '(not set)',
    to: process.env.CONTACT_RECIPIENT_EMAIL ?? '(not set)',
  });
  try {
    await sendContactEmail(sanitised);
    log.info('Email sent successfully', { to: sanitised.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error('SES send failed', { error: message, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      {
        error: {
          code: 'SEND_FAILED',
          message: 'Unable to send your message. Please try again later.',
        },
      },
      { status: 500 },
    );
  }

  // 8. Return success
  log.info('Contact form submitted successfully');
  return NextResponse.json({
    message: "Thank you for your enquiry. We'll be in touch soon.",
  });
}
