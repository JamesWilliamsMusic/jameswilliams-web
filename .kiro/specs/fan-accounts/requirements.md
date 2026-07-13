# Requirements Document

## Introduction

The Fan Accounts feature adds user authentication, exclusive content access, and email notifications to the James Williams website. Fans can sign up and log in via AWS Cognito to access exclusive blog content managed through Webiny CMS. The system enforces Australian Privacy Act and GDPR compliance, encrypts all personally identifiable information at rest and in transit, and provides full account deletion (right to erasure). Authenticated fans receive email notifications about new releases (songs, albums) with granular subscription preferences.

## Glossary

- **Fan_Account_System**: The overall system encompassing authentication, exclusive content delivery, notification preferences, and privacy compliance for fan users on the James Williams website.
- **Authentication_Service**: The subsystem responsible for user sign-up, login, session management, and account lifecycle via AWS Cognito.
- **Content_Gate**: The subsystem that restricts access to exclusive content (blogs) to authenticated fans only.
- **Notification_Service**: The subsystem responsible for sending email notifications to fans about new releases, using Amazon SES (recommended), SendGrid, or Webiny's built-in mailer as the transport layer.
- **Preference_Manager**: The subsystem that stores and manages per-fan notification subscription preferences in DynamoDB.
- **Privacy_Engine**: The subsystem responsible for PII encryption, data retention policies, consent management, and account deletion workflows.
- **Fan**: An end-user who creates an account on the James Williams website.
- **PII**: Personally Identifiable Information — any data that can identify a specific individual (email, name, etc.).
- **Exclusive_Content**: Blog posts and other content authored in Webiny CMS that is only accessible to authenticated fans.
- **Notification_Category**: A classification of notifications a fan can subscribe to or unsubscribe from (e.g., new_song, new_album, blog_post).

## Requirements

### Requirement 1: Fan Sign-Up

**User Story:** As a fan, I want to create an account with my email address, so that I can access exclusive content and receive notifications.

#### Acceptance Criteria

1. WHEN a fan submits a valid email address and password, THE Authentication_Service SHALL create a new fan account in AWS Cognito and send a verification email to the provided address.
2. WHEN a fan submits an email address that is already registered, THE Authentication_Service SHALL display an error message stating that the email is already in use.
3. WHEN a fan clicks the verification link in the email, THE Authentication_Service SHALL mark the fan account as verified and allow login.
4. IF a fan submits a password that does not meet the minimum complexity requirements (minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character), THEN THE Authentication_Service SHALL display a specific error message indicating which requirements are not met.
5. THE Authentication_Service SHALL collect explicit consent for data processing and the privacy policy during sign-up before creating the account.

### Requirement 2: Fan Login and Session Management

**User Story:** As a fan, I want to log in to my account securely, so that I can access my personalised content and preferences.

#### Acceptance Criteria

1. WHEN a fan submits valid credentials (verified email and correct password), THE Authentication_Service SHALL issue a JWT session token and redirect the fan to the previously requested page or the homepage.
2. WHEN a fan submits invalid credentials, THE Authentication_Service SHALL display a generic error message ("Invalid email or password") without revealing whether the email exists.
3. WHILE a fan session token is valid, THE Authentication_Service SHALL allow access to authenticated routes without re-authentication.
4. WHEN a fan session token expires, THE Authentication_Service SHALL attempt a silent token refresh using the refresh token; IF the refresh token is also expired, THEN THE Authentication_Service SHALL redirect the fan to the login page.
5. WHEN a fan clicks the logout button, THE Authentication_Service SHALL invalidate the current session token and redirect the fan to the homepage.

### Requirement 3: Exclusive Content Access

**User Story:** As a fan, I want to access exclusive blog posts from James, so that I get content not available to the general public.

#### Acceptance Criteria

1. WHEN an authenticated fan navigates to the exclusive content section, THE Content_Gate SHALL retrieve and display exclusive blog posts from Webiny CMS.
2. WHEN an unauthenticated visitor navigates to the exclusive content section, THE Content_Gate SHALL display a preview teaser and a prompt to sign up or log in.
3. WHEN James publishes a new exclusive blog post in Webiny CMS, THE Content_Gate SHALL make the post available to authenticated fans within 60 seconds of publication.
4. THE Content_Gate SHALL display exclusive blog posts in reverse chronological order with pagination (10 posts per page).

### Requirement 4: Email Notifications on New Releases

**User Story:** As a fan, I want to receive email notifications when James releases new songs or albums, so that I never miss new music.

#### Acceptance Criteria

1. WHEN a new album or song is published in Webiny CMS, THE Notification_Service SHALL send an email notification to all fans who are subscribed to the corresponding Notification_Category.
2. THE Notification_Service SHALL use Amazon SES as the primary email transport, with SendGrid as a configurable fallback.
3. THE Notification_Service SHALL include the release title, release type (song or album), and a link to the content in every notification email.
4. IF the email transport returns a delivery failure, THEN THE Notification_Service SHALL log the failure and retry delivery up to 3 times with exponential backoff.
5. THE Notification_Service SHALL throttle outbound emails to remain within the configured sending rate limits of the chosen transport provider.

### Requirement 5: Notification Subscription Preferences

**User Story:** As a fan, I want to choose which types of notifications I receive, so that I only get emails about content I care about.

#### Acceptance Criteria

1. THE Preference_Manager SHALL provide the following Notification_Categories: new_song, new_album, blog_post.
2. WHEN a fan creates a new account, THE Preference_Manager SHALL subscribe the fan to all Notification_Categories by default.
3. WHEN a fan updates subscription preferences via the preferences page, THE Preference_Manager SHALL persist the changes to DynamoDB within 2 seconds.
4. WHEN a fan clicks an unsubscribe link in a notification email, THE Preference_Manager SHALL unsubscribe the fan from the corresponding Notification_Category without requiring login.
5. THE Preference_Manager SHALL include a one-click unsubscribe header (RFC 8058 List-Unsubscribe-Post) in every notification email.

### Requirement 6: Privacy Compliance — Data Encryption

**User Story:** As a fan, I want my personal data to be encrypted at all times, so that my privacy is protected.

#### Acceptance Criteria

1. THE Privacy_Engine SHALL encrypt all PII at rest using AES-256 encryption in the data store (DynamoDB and Cognito).
2. THE Privacy_Engine SHALL enforce TLS 1.2 or higher for all data in transit between the fan's browser and the server, and between internal services.
3. THE Privacy_Engine SHALL store email addresses in Cognito using server-side encryption with AWS-managed keys (SSE-KMS).
4. THE Privacy_Engine SHALL never log PII in application logs or error reporting systems.

### Requirement 7: Privacy Compliance — Right to Erasure (Account Deletion)

**User Story:** As a fan, I want to permanently delete my account and all associated data, so that I can exercise my right to erasure under GDPR and the Australian Privacy Act.

#### Acceptance Criteria

1. WHEN a fan requests account deletion from the account settings page, THE Privacy_Engine SHALL display a confirmation dialog explaining that all data will be permanently deleted.
2. WHEN a fan confirms account deletion, THE Privacy_Engine SHALL delete the Cognito user record, all DynamoDB preference records, and any other PII associated with the fan within 72 hours.
3. WHEN account deletion is complete, THE Privacy_Engine SHALL send a confirmation email to the fan's email address (final communication) and then purge the email address from all systems.
4. THE Privacy_Engine SHALL maintain an anonymised audit log entry recording that a deletion occurred (timestamp and anonymised identifier only) for compliance purposes.
5. IF a fan requests account deletion, THEN THE Privacy_Engine SHALL immediately revoke all active sessions and prevent further login.

### Requirement 8: Privacy Compliance — Consent and Data Transparency

**User Story:** As a fan, I want to understand what data is collected and how it is used, so that I can make informed decisions about my account.

#### Acceptance Criteria

1. THE Privacy_Engine SHALL present a clear, accessible privacy policy during sign-up that explains what PII is collected, how it is used, and how long it is retained.
2. WHEN a fan accesses the account settings page, THE Privacy_Engine SHALL display all PII currently stored (email address, subscription preferences, account creation date).
3. WHEN a fan requests a data export, THE Privacy_Engine SHALL generate a machine-readable (JSON) export of all PII associated with the fan's account and provide a download link within 30 days (GDPR requirement).
4. THE Privacy_Engine SHALL record the date and version of the privacy policy to which the fan consented.

### Requirement 9: Password Reset

**User Story:** As a fan, I want to reset my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a fan requests a password reset, THE Authentication_Service SHALL send a password reset link to the fan's registered email address.
2. WHEN a fan clicks a valid password reset link, THE Authentication_Service SHALL allow the fan to set a new password that meets the complexity requirements.
3. IF a fan clicks an expired password reset link (older than 1 hour), THEN THE Authentication_Service SHALL display a message that the link has expired and offer to send a new one.
4. WHEN a fan submits a password reset request for an unregistered email, THE Authentication_Service SHALL display the same success message as for a registered email (to prevent email enumeration).
