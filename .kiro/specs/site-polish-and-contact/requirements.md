# Requirements Document

## Introduction

This feature covers four areas of polish and new functionality for the James Williams Music website: fetching the favicon dynamically from Webiny CMS, updating the page title, building a contact page with a privacy-compliant form, and adding security headers based on Lighthouse audit findings. Together these changes improve branding consistency, user communication, privacy compliance (Australian Privacy Act), and security posture.

## Glossary

- **Website**: The James Williams Music Next.js application deployed on AWS Lambda behind CloudFront
- **CMS**: The Webiny headless CMS instance providing content via GraphQL API
- **Site_Settings**: The Webiny content model accessed via the `listSiteSettingsPlural` query containing site-wide configuration values
- **Contact_Form**: The HTML form on the /contact page collecting visitor enquiries
- **Form_Submission_API**: The server-side Next.js API route that processes contact form submissions
- **Email_Service**: AWS SES or equivalent service used to deliver contact form notifications
- **Rate_Limiter**: Server-side mechanism that restricts the number of form submissions from a single source within a time window
- **Spam_Filter**: A honeypot field or CAPTCHA mechanism used to detect and reject automated form submissions
- **Privacy_Policy_Page**: A dedicated page (/privacy) outlining data collection, usage, and rights under the Australian Privacy Act
- **Security_Headers**: HTTP response headers that mitigate common web vulnerabilities (XSS, clickjacking, protocol downgrade)
- **CSP**: Content-Security-Policy, an HTTP header that restricts resource loading to approved origins
- **HSTS**: HTTP Strict-Transport-Security, an HTTP header that forces HTTPS connections
- **COOP**: Cross-Origin-Opener-Policy, an HTTP header that isolates the browsing context

## Requirements

### Requirement 1: Dynamic Favicon from CMS

**User Story:** As the site owner, I want the favicon to be fetched from the CMS Site Settings model, so that I can update it without redeploying the application.

#### Acceptance Criteria

1. WHEN the Site_Settings model contains a favicon value that is a non-empty string (not null, not undefined, and not blank after trimming whitespace), THE Website SHALL render a `<link rel="icon">` element in the HTML head with the `href` attribute set to that favicon URL
2. IF the Site_Settings model favicon value is null, undefined, or a blank string after trimming whitespace, THEN THE Website SHALL render a `<link rel="icon">` element in the HTML head with the `href` attribute set to `/favicon.ico`
3. IF the CMS is unreachable or returns an error within 5 seconds, THEN THE Website SHALL render a `<link rel="icon">` element in the HTML head with the `href` attribute set to `/favicon.ico`
4. THE Website SHALL fetch the favicon value from the `listSiteSettingsPlural` query field `values.favicon`
5. WHEN the favicon URL retrieved from the CMS changes, THE Website SHALL reflect the updated favicon on the next page load without requiring a redeployment

### Requirement 2: Page Title Update

**User Story:** As the site owner, I want the browser tab title to display "James Williams" without the "Golden Coast Sessions" suffix, so that branding is cleaner and more recognisable.

#### Acceptance Criteria

1. THE Website SHALL set the browser tab title on the root page to the `artistName` value from the Site_Settings model, with no suffix appended
2. IF the Site_Settings model returns no entry or a network error occurs, or the `artistName` field is null, undefined, or a whitespace-only string, THEN THE Website SHALL fall back to "James Williams" as the browser tab title
3. WHEN a child page defines its own page name, THE Website SHALL render the browser tab title in the format "{artistName} | {pageName}", where `artistName` is resolved using the same fallback logic defined in criterion 2
4. THE Website SHALL ensure the resolved browser tab title does not exceed 60 characters, truncating the page name portion with an ellipsis ("…") if necessary

### Requirement 3: Contact Page with Form

**User Story:** As a site visitor, I want a contact page with a message form, so that I can reach the artist or management team.

#### Acceptance Criteria

1. THE Website SHALL provide a contact page accessible at the /contact URL path
2. THE Contact_Form SHALL collect the following fields: name (required, maximum 100 characters), email (required, maximum 254 characters), subject (optional, maximum 200 characters), and message (required, minimum 10 characters, maximum 2000 characters)
3. THE Contact_Form SHALL display a privacy notice informing the visitor how submitted data will be used
4. THE Contact_Form SHALL include a visible link to the Privacy_Policy_Page
5. THE Contact_Form SHALL collect only the minimum data necessary to process the enquiry (name, email, subject, message)
6. THE Contact_Form SHALL display a consent statement above the submit button explaining that submitted data will be used solely to respond to the enquiry
7. WHEN a form submission is received, THE Form_Submission_API SHALL validate that all required fields are present, not empty after trimming whitespace, and that the email field conforms to a valid email address format
8. WHEN a form submission is received, THE Form_Submission_API SHALL sanitise all input values by stripping HTML tags and script content before processing
9. WHEN a valid form submission is processed, THE Email_Service SHALL send a notification email containing the submission details to the configured recipient
10. WHEN a valid form submission is processed, THE Website SHALL display a success confirmation message to the visitor indicating that their enquiry has been received
11. IF form validation fails, THEN THE Form_Submission_API SHALL return error messages identifying each field that is invalid and the reason for rejection
12. IF the Email_Service fails to send the notification, THEN THE Form_Submission_API SHALL log the error and return a generic failure message to the visitor
13. IF any field value exceeds its maximum character limit, THEN THE Form_Submission_API SHALL reject the submission with an error message indicating the field and its maximum allowed length

### Requirement 4: Contact Form Rate Limiting and Spam Protection

**User Story:** As the site owner, I want the contact form to be protected against spam and abuse, so that legitimate enquiries are not drowned out by automated submissions.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL restrict form submissions to a maximum of 5 submissions per IP address within a sliding 15-minute window, where each new submission resets the window start time for that IP address
2. IF a submission exceeds the rate limit, THEN THE Form_Submission_API SHALL return a 429 status code with a message indicating the visitor should try again later and specifying the remaining wait time in minutes
3. THE Spam_Filter SHALL include a honeypot field that is hidden from human users via CSS positioning off-screen but present in the HTML form markup
4. WHEN the honeypot field contains a value, THE Form_Submission_API SHALL reject the submission without sending an email and return a response identical in structure and status code to a successful submission so that the bot cannot distinguish rejection from acceptance
5. THE Contact_Form SHALL allow a user to complete the full submission flow—rendering the form fields, submitting data, and displaying a confirmation or error response—without JavaScript enabled
6. IF the rate limit is exceeded, THEN THE Contact_Form SHALL display an inline message to the visitor indicating that submissions are temporarily restricted and specifying the number of minutes before they may try again

### Requirement 5: Privacy Policy Page

**User Story:** As a site visitor, I want to read the privacy policy, so that I understand how my data is collected, used, and protected.

#### Acceptance Criteria

1. THE Website SHALL provide a privacy policy page accessible at the /privacy URL path
2. THE Privacy_Policy_Page SHALL enumerate the personal information collected via the Contact_Form, specifically: name, email address, subject, and message content
3. THE Privacy_Policy_Page SHALL state that personal information is collected solely for the purpose of responding to visitor enquiries
4. THE Privacy_Policy_Page SHALL describe how personal information is stored and protected, including the general storage region and access restrictions applied to submission data
5. THE Privacy_Policy_Page SHALL describe the visitor's rights under the Australian Privacy Act 1988, including at minimum: the right to access their personal information, the right to request correction, and the right to lodge a complaint with the Office of the Australian Information Commissioner
6. THE Privacy_Policy_Page SHALL state a specific numeric data retention period (in days or months) for contact form submissions, after which submissions are deleted
7. THE Privacy_Policy_Page SHALL provide at least one contact method (email address or postal address) for privacy-related enquiries
8. THE Privacy_Policy_Page SHALL display a "last updated" date indicating when the policy content was most recently revised

### Requirement 6: Security Headers

**User Story:** As the site owner, I want the application to serve recommended security headers, so that common web vulnerabilities are mitigated and Lighthouse audit scores improve.

#### Acceptance Criteria

1. THE Website SHALL serve a Content-Security-Policy header on all HTML document responses and API route responses that restricts script-src to 'self' and explicitly trusted domains
2. THE Website SHALL serve a Strict-Transport-Security header with a max-age of at least 31536000 seconds (one year) and include the includeSubDomains directive
3. THE Website SHALL serve a Cross-Origin-Opener-Policy header set to "same-origin"
4. THE Website SHALL serve a frame-ancestors CSP directive set to 'self' or an equivalent X-Frame-Options header set to "SAMEORIGIN" to prevent clickjacking
5. THE Website CSP header SHALL NOT contain 'unsafe-inline' in the script-src directive
6. THE Website SHALL serve an X-Content-Type-Options header set to "nosniff" and a Referrer-Policy header set to "strict-origin-when-cross-origin"
7. THE Website SHALL serve security headers via Next.js configuration (next.config.js headers function or middleware) so they apply to all routes consistently
