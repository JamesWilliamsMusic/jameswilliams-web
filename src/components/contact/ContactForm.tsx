'use client';

import { useState, FormEvent } from 'react';

interface FormState {
  success?: string;
  fieldErrors?: Record<string, string[]>;
  rateLimited?: { message: string; retryAfterMinutes: number };
  serverError?: string;
}

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<FormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      website: formData.get('website') as string,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setFormState({ success: data.message });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        return;
      }

      if (response.status === 429) {
        setFormState({
          rateLimited: {
            message: data.error.message,
            retryAfterMinutes: data.error.retryAfterMinutes,
          },
        });
        return;
      }

      if (response.status === 400 && data.error?.code === 'VALIDATION_ERROR') {
        setFormState({ fieldErrors: data.error.fields });
        return;
      }

      setFormState({ serverError: data.error?.message || 'Something went wrong. Please try again.' });
    } catch {
      setFormState({ serverError: 'Unable to connect. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return formState.fieldErrors?.[field]?.[0];
  };

  const nameError = getFieldError('name');
  const emailError = getFieldError('email');
  const subjectError = getFieldError('subject');
  const messageError = getFieldError('message');

  return (
    <form
      onSubmit={handleSubmit}
      action="/api/contact"
      method="POST"
      noValidate
      className="space-y-6"
    >
      {formState.success && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
        >
          {formState.success}
        </div>
      )}

      {formState.rateLimited && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
        >
          Too many submissions. Please try again in {formState.rateLimited.retryAfterMinutes} minutes.
        </div>
      )}

      {formState.serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
        >
          {formState.serverError}
        </div>
      )}

      {/* Honeypot field - hidden from humans, catches bots */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label
          htmlFor="contact-name"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-required="true"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'contact-name-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            nameError ? 'border-red-400' : 'border-[var(--color-surface2)]'
          }`}
          placeholder="Your name"
        />
        {nameError && (
          <p id="contact-name-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'contact-email-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            emailError ? 'border-red-400' : 'border-[var(--color-surface2)]'
          }`}
          placeholder="you@example.com"
        />
        {emailError && (
          <p id="contact-email-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-invalid={!!subjectError}
          aria-describedby={subjectError ? 'contact-subject-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] ${
            subjectError ? 'border-red-400' : 'border-[var(--color-surface2)]'
          }`}
          placeholder="What is this about?"
        />
        {subjectError && (
          <p id="contact-subject-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {subjectError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="font-label block mb-2 text-[var(--color-text)]"
        >
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-required="true"
          aria-invalid={!!messageError}
          aria-describedby={messageError ? 'contact-message-error' : undefined}
          className={`w-full rounded-md border px-4 py-3 text-[var(--color-text)] bg-white placeholder:text-[var(--color-text)]/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:border-[var(--color-amber)] resize-y ${
            messageError ? 'border-red-400' : 'border-[var(--color-surface2)]'
          }`}
          placeholder="Your message (minimum 10 characters)"
        />
        {messageError && (
          <p id="contact-message-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {messageError}
          </p>
        )}
      </div>

      <p className="text-sm text-[var(--color-text)]/70">
        By submitting this form, you consent to your data being used solely to respond to your enquiry.
        {' '}
        <a
          href="/privacy"
          className="text-[var(--color-amber)] hover:text-[var(--color-amber-hover)] transition-colors duration-200 underline"
        >
          Privacy Policy
        </a>
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--color-amber)] px-6 py-3 font-label text-white transition-all duration-300 hover:bg-[var(--color-amber-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-amber)]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
