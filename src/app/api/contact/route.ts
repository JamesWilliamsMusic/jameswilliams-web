import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validation/contact';
import { stripHtml } from '@/lib/sanitize';
import { sendContactEmail } from '@/lib/email/ses';
import { contactLimiter } from '@/lib/rate-limit/limiter';

export async function POST(request: NextRequest) {
  // 1. Rate limit check
  const rateCheck = contactLimiter(request);
  if (!rateCheck.allowed) {
    const retryAfterMinutes = Math.ceil(
      (rateCheck.resetAt - Date.now()) / (60 * 1000),
    );
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

  // 2. Parse JSON body
  const body = await request.json();

  // 3. Honeypot check — bots filling hidden field get a fake success
  if (body.website && typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({
      message: "Thank you for your enquiry. We'll be in touch soon.",
    });
  }

  // 4. Zod validation
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      if (!fields[field]) fields[field] = [];
      fields[field].push(issue.message);
    }
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', fields } },
      { status: 400 },
    );
  }

  // 5. Sanitise all string fields
  const sanitised = {
    name: stripHtml(parsed.data.name),
    email: stripHtml(parsed.data.email),
    subject: stripHtml(parsed.data.subject),
    message: stripHtml(parsed.data.message),
  };

  // 6. Send email via SES
  try {
    await sendContactEmail(sanitised);
  } catch {
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

  // 7. Return success
  return NextResponse.json({
    message: "Thank you for your enquiry. We'll be in touch soon.",
  });
}
