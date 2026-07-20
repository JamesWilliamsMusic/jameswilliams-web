# Implementation Plan: Site Polish and Contact

## Overview

This plan implements four complementary enhancements: dynamic favicon/title from Webiny CMS, a contact page with validated form and email delivery via AWS SES, a privacy policy page, and security headers. Tasks are ordered so foundational utilities come first, followed by features that depend on them, and finally integration wiring and tests.

## Tasks

- [x] 1. Install dependencies and extend CMS types
  - [x] 1.1 Install new dependencies (@aws-sdk/client-ses, isomorphic-dompurify, fast-check)
    - Run `npm install @aws-sdk/client-ses isomorphic-dompurify` and `npm install -D fast-check @types/dompurify`
    - Verify packages resolve correctly in `package.json`
    - _Requirements: 3.8, 3.9_

  - [x] 1.2 Extend Webiny SiteSettings type and query with favicon field
    - Add `favicon?: string` to `SiteSettings` interface in `src/lib/webiny/types.ts`
    - Update `GET_SITE_SETTINGS` query in `src/lib/webiny/queries.ts` to include `favicon` in the values selection set
    - Add `favicon` field to mock site settings in `src/lib/webiny/mock-data.ts`
    - _Requirements: 1.4_

- [x] 2. Implement metadata helper utilities
  - [x] 2.1 Create metadata helper functions (resolveArtistName, resolveFavicon, truncateTitle)
    - Create file `src/lib/metadata/helpers.ts`
    - Implement `resolveArtistName`: return trimmed artistName or fallback "James Williams"
    - Implement `resolveFavicon`: return trimmed favicon URL or fallback "/favicon.ico"
    - Implement `truncateTitle`: combine artistName + pageName within 60 chars, truncate pageName with "…" if needed
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.2 Write property test for favicon resolution
    - **Property 1: Favicon Resolution**
    - Test that `resolveFavicon` returns trimmed non-empty string or "/favicon.ico" for any input
    - Use `fc.option(fc.oneof(fc.string(), fc.constant(''), fc.stringOf(fc.constant(' '))))` generators
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 2.3 Write property test for artist name resolution
    - **Property 2: Artist Name Resolution**
    - Test that `resolveArtistName` returns trimmed non-empty string or "James Williams" for any input
    - Use same generator strategy as Property 1
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.4 Write property test for title truncation invariant
    - **Property 3: Title Truncation Invariant**
    - Test that `truncateTitle` output never exceeds 60 characters, starts with artistName + " | ", and truncated names end with "…"
    - Use `fc.tuple(fc.string({minLength:1, maxLength:30}), fc.string({minLength:1, maxLength:100}))` generators
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 2.5 Write unit tests for metadata helpers
    - Test `resolveArtistName` with null, undefined, empty string, whitespace-only, and valid names
    - Test `resolveFavicon` with null, undefined, empty string, whitespace-only, and valid URLs
    - Test `truncateTitle` with short names, exactly 60 chars, over 60 chars, unicode characters
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [x] 3. Convert root layout to dynamic metadata
  - [x] 3.1 Replace static metadata export with generateMetadata() in root layout
    - Modify `src/app/layout.tsx` to export `generateMetadata()` async function
    - Fetch site settings, resolve artistName and favicon using helper utilities
    - Return metadata with `title: { default: artistName, template: \`${artistName} | %s\` }` and `icons: { icon: faviconUrl }`
    - Wrap `getSiteSettings()` call in try/catch to handle CMS errors gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3_

- [x] 4. Checkpoint - Verify metadata changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement contact form validation and sanitisation
  - [x] 5.1 Create contact form Zod validation schema
    - Create file `src/lib/validation/contact.ts`
    - Define `contactFormSchema` with name (1-100 chars), email (valid format, max 254), subject (optional, max 200), message (10-2000 chars)
    - Apply `.trim()` transforms to all string fields
    - Export `ContactFormInput` type
    - _Requirements: 3.2, 3.7, 3.11, 3.13_

  - [ ]* 5.2 Write property test for contact form schema validation
    - **Property 4: Contact Form Schema Validation**
    - Test that schema accepts valid inputs and rejects invalid inputs with per-field errors
    - Use custom generators for valid/invalid ContactFormInput objects
    - **Validates: Requirements 3.2, 3.7, 3.11, 3.13**

  - [x] 5.3 Create input sanitisation utility with DOMPurify
    - Create file `src/lib/sanitize/index.ts`
    - Implement `stripHtml(input: string): string` using `DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })`
    - _Requirements: 3.8_

  - [ ]* 5.4 Write property test for input sanitisation
    - **Property 5: Input Sanitisation Strips HTML**
    - Test that `stripHtml()` output never contains HTML tags or script content for any input string
    - Use `fc.string()` with injected HTML tags via `fc.oneof`
    - **Validates: Requirements 3.8**

- [x] 6. Implement email service and rate limiter
  - [x] 6.1 Create AWS SES email service for contact notifications
    - Create file `src/lib/email/ses.ts`
    - Implement `sendContactEmail(data: ContactEmailData): Promise<void>`
    - Configure SES client with region from `process.env.AWS_REGION` (default `ap-southeast-2`)
    - Use `SES_FROM_EMAIL` and `CONTACT_RECIPIENT_EMAIL` environment variables
    - _Requirements: 3.9, 3.12_

  - [x] 6.2 Configure contact rate limiter (5 requests per 15 minutes)
    - Add `contactLimiter` to existing `src/lib/rate-limit/limiter.ts`
    - Configure with `windowMs: 15 * 60 * 1000` and `maxAttempts: 5`
    - _Requirements: 4.1, 4.2_

- [x] 7. Build contact page and API route
  - [x] 7.1 Create contact form component with honeypot and accessibility
    - Create file `src/components/contact/ContactForm.tsx` as a client component
    - Include fields: name, email, subject, message with labels and aria attributes
    - Add honeypot field (name="website") positioned off-screen via CSS
    - Display consent statement and link to /privacy
    - Use `useActionState` for progressive enhancement (works without JS)
    - Display field-level errors and success/rate-limit messages inline
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3, 4.5, 4.6_

  - [x] 7.2 Create contact API route with validation, sanitisation, honeypot, and rate limiting
    - Create file `src/app/api/contact/route.ts`
    - Implement POST handler with: rate limit check → parse body → honeypot check → Zod validation → sanitise fields → send email → return response
    - Return 429 with retryAfterMinutes for rate-limited requests
    - Return fake 200 success for honeypot-triggered submissions
    - Return 400 with per-field errors for validation failures
    - Return 500 with generic message for SES failures
    - _Requirements: 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 4.1, 4.2, 4.4_

  - [ ]* 7.3 Write property test for honeypot silent rejection
    - **Property 6: Honeypot Silent Rejection**
    - Test that any submission with non-empty honeypot field returns identical response structure to success, without invoking email service
    - Use `fc.string({minLength:1})` for honeypot field with valid data for other fields
    - **Validates: Requirements 4.4**

  - [x] 7.4 Create contact page with metadata
    - Create file `src/app/contact/page.tsx` as server component
    - Export `generateMetadata` returning `{ title: 'Contact' }` for title template
    - Render the ContactForm component
    - _Requirements: 3.1_

  - [x] 7.5 Write unit tests for contact API route
    - Test happy path with mocked SES and rate limiter
    - Test validation error responses (missing fields, invalid email, exceeded lengths)
    - Test honeypot detection returns fake success
    - Test rate limit exceeded returns 429
    - Test SES failure returns 500 with generic message
    - _Requirements: 3.7, 3.9, 3.10, 3.11, 3.12, 4.1, 4.2, 4.4_

- [x] 8. Checkpoint - Verify contact form flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create privacy policy page
  - [x] 9.1 Create privacy policy page at /privacy
    - Create file `src/app/privacy/page.tsx` as static server component
    - Include: data collected (name, email, subject, message), purpose (responding to enquiries), storage (AWS ap-southeast-2, encrypted, access-restricted), retention (90 days), rights under Australian Privacy Act 1988 (access, correction, OAIC complaint), contact method for privacy enquiries, and last updated date
    - Export `generateMetadata` returning `{ title: 'Privacy Policy' }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 10. Add security headers to next.config.js
  - [x] 10.1 Add headers() function to next.config.js with all required security headers
    - Add async `headers()` function to `next.config.js`
    - Configure Content-Security-Policy with script-src 'self' (no 'unsafe-inline'), style-src 'self' 'unsafe-inline', img-src for known domains, frame-ancestors 'self'
    - Add Strict-Transport-Security with max-age=63072000, includeSubDomains, preload
    - Add Cross-Origin-Opener-Policy: same-origin
    - Add X-Content-Type-Options: nosniff
    - Add Referrer-Policy: strict-origin-when-cross-origin
    - Add X-Frame-Options: SAMEORIGIN
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 10.2 Write unit test for security headers configuration
    - Snapshot test ensuring all required headers are present in the headers() output
    - Verify CSP does not contain 'unsafe-inline' in script-src
    - Verify HSTS max-age is at least 31536000
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The design specifies TypeScript throughout; all implementation uses TypeScript
- New environment variables `SES_FROM_EMAIL` and `CONTACT_RECIPIENT_EMAIL` must be configured before testing email delivery
- CSP may require tuning in production if Next.js inline scripts cause issues

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "5.1", "5.3"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.1", "5.2", "5.4", "6.1", "6.2"] },
    { "id": 3, "tasks": ["7.1", "7.2", "9.1", "10.1"] },
    { "id": 4, "tasks": ["7.3", "7.4", "7.5", "10.2"] }
  ]
}
```
