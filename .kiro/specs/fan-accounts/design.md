# Fan Accounts — Technical Design Document

## 1. Overview

The fan-accounts feature adds authenticated user accounts, exclusive content gating, and email notifications to the James Williams website. The architecture leverages AWS-native services already available in the `ap-southeast-2` deployment:

- **AWS Cognito** for authentication (sign-up, login, password reset, email verification)
- **DynamoDB** for notification preferences and deletion audit logs
- **Amazon SES** for transactional and notification emails
- **AWS KMS** for PII encryption at rest
- **Webiny CMS** for exclusive content management (existing integration)
- **Next.js middleware** for route protection with httpOnly cookie-based JWT sessions

Key architectural decisions:
- Use `amazon-cognito-identity-js` directly — no Amplify dependency (smaller bundle, fewer abstractions)
- Store JWT tokens in httpOnly secure cookies (not localStorage) to mitigate XSS
- Server-side token validation in API routes for security
- Email transport abstraction layer enabling SES ↔ SendGrid swap via config

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                    │
│  React UI (login, signup, preferences, exclusive content pages)      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS (TLS 1.2+)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS (Lambda Container)                       │
│                                                                      │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Middleware   │  │   API Routes     │  │   Server Components  │  │
│  │  (auth gate) │  │   /api/auth/*    │  │   /exclusive/*       │  │
│  │              │  │   /api/prefs     │  │                      │  │
│  │              │  │   /api/account/* │  │                      │  │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│         │                   │                        │               │
│  ┌──────▼───────────────────▼────────────────────────▼───────────┐  │
│  │                    Service Layer                                │  │
│  │  AuthService │ PreferencesService │ NotificationService        │  │
│  │  PrivacyService │ ContentService                               │  │
│  └──────┬──────────────┬─────────────────┬───────────────────────┘  │
└─────────┼──────────────┼─────────────────┼──────────────────────────┘
          │              │                 │
          ▼              ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Cognito    │ │  DynamoDB    │ │  Amazon SES  │ │  Webiny CMS  │
│  User Pool   │ │  Preferences │ │  (Email)     │ │  (GraphQL)   │
│              │ │  Audit Log   │ │              │ │              │
└──────────────┘ └──────┬───────┘ └──────────────┘ └──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   AWS KMS    │
                 │  (Encryption)│
                 └──────────────┘
```

---

## 3. Authentication Flow

### 3.1 Library Choice

Use `amazon-cognito-identity-js` for client-side auth operations (SRP authentication).
Use `@aws-sdk/client-cognito-identity-provider` for server-side admin operations (deletion, global sign-out).

**Rationale:** Amplify bundles ~200KB+ of unused code. `cognito-identity-js` is ~45KB gzipped and provides exactly the Cognito operations needed.

### 3.2 Token Storage Strategy

```
┌────────────────────────────────────────────────┐
│ Cookie: access_token                           │
│   httpOnly: true                               │
│   secure: true                                 │
│   sameSite: strict                             │
│   path: /                                      │
│   maxAge: 3600 (1 hour)                        │
├────────────────────────────────────────────────┤
│ Cookie: refresh_token                          │
│   httpOnly: true                               │
│   secure: true                                 │
│   sameSite: strict                             │
│   path: /api/auth/refresh                      │
│   maxAge: 2592000 (30 days)                    │
├────────────────────────────────────────────────┤
│ Cookie: id_token                               │
│   httpOnly: true                               │
│   secure: true                                 │
│   sameSite: strict                             │
│   path: /                                      │
│   maxAge: 3600 (1 hour)                        │
└────────────────────────────────────────────────┘
```

**Why httpOnly cookies over localStorage:**
- Immune to XSS (JavaScript cannot read httpOnly cookies)
- Automatically sent with requests (no manual header management)
- Works with Next.js middleware for server-side validation

### 3.3 Middleware Route Protection

```typescript
// middleware.ts — pseudocode
const protectedRoutes = ['/exclusive', '/account'];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');

  if (isProtectedRoute(request.pathname) && !accessToken) {
    return redirect(`/login?returnTo=${request.pathname}`);
  }

  // Decode JWT (without full verification — just check expiry)
  // Full verification happens in API routes
  if (accessToken && isExpired(accessToken)) {
    return redirect('/api/auth/refresh?returnTo=' + request.pathname);
  }
}
```

### 3.4 Server-Side Token Validation

API routes perform full JWT validation:
1. Extract token from httpOnly cookie
2. Decode JWT header to get `kid`
3. Fetch Cognito JWKS (cached in memory with TTL)
4. Verify signature against the correct public key
5. Validate `iss`, `aud`, `exp`, `token_use` claims

### 3.5 Login Flow Sequence

```
Fan          Browser         /api/auth/login      Cognito
 │              │                  │                  │
 │─── email ───▶│                  │                  │
 │─── pass ────▶│                  │                  │
 │              │── POST {email, ──▶│                  │
 │              │   password}      │                  │
 │              │                  │── SRP Auth ──────▶│
 │              │                  │◀── tokens ───────│
 │              │◀── Set-Cookie ───│                  │
 │              │   (httpOnly)     │                  │
 │◀── redirect ─│                  │                  │
│   to returnTo │                  │                  │
```

---

## 4. Route Structure

### 4.1 Page Routes (App Router)

| Route | Auth Required | Description |
|-------|:---:|-------------|
| `/login` | No | Login form with email/password |
| `/signup` | No | Sign-up form with consent checkbox |
| `/forgot-password` | No | Password reset request & confirmation |
| `/account` | Yes | Account settings (preferences, data export, delete) |
| `/account/preferences` | Yes | Notification preference toggles |
| `/exclusive` | Yes | Exclusive blog content listing |
| `/exclusive/[slug]` | Yes | Individual exclusive blog post |

### 4.2 API Routes

| Route | Method | Auth | Description |
|-------|--------|:---:|-------------|
| `/api/auth/login` | POST | No | Authenticate fan, set cookies |
| `/api/auth/signup` | POST | No | Create Cognito user, record consent |
| `/api/auth/logout` | POST | Yes | Clear cookies, global sign-out |
| `/api/auth/refresh` | POST | Cookie | Refresh access token silently |
| `/api/auth/forgot-password` | POST | No | Initiate password reset |
| `/api/auth/confirm-signup` | POST | No | Verify email confirmation code |
| `/api/auth/reset-password` | POST | No | Set new password with reset code |
| `/api/preferences` | GET | Yes | Fetch fan's notification preferences |
| `/api/preferences` | PUT | Yes | Update notification preferences |
| `/api/account/delete` | POST | Yes | Initiate account deletion |
| `/api/account/export` | GET | Yes | Generate and return data export (JSON) |
| `/api/notifications/unsubscribe` | GET | No | One-click unsubscribe via token |

---

## 5. Data Models

### 5.1 Fan Preferences (DynamoDB)

**Table:** `jameswilliams-fan-preferences`

```typescript
interface FanPreferences {
  fanId: string;              // Cognito sub UUID (partition key)
  email: string;             // KMS-encrypted email address
  categories: {
    new_song: boolean;
    new_album: boolean;
    blog_post: boolean;
  };
  unsubscribeToken: string;  // UUID for one-click unsubscribe links
  consentVersion: string;    // e.g., "1.0"
  consentDate: string;       // ISO 8601
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
}
```

**GSIs:**
- `email-index` — partition key: `email` (for unsubscribe lookups)
- `category-index` — for querying fans by subscription category (used in notification sends)

### 5.2 Deletion Audit Log (DynamoDB)

**Table:** `jameswilliams-fan-deletion-audit`

```typescript
interface DeletionAuditEntry {
  auditId: string;           // UUID (partition key)
  anonymisedId: string;      // SHA-256 hash of Cognito sub
  deletedAt: string;         // ISO 8601
  expiresAt: number;         // Unix timestamp (TTL) — 7 years retention
}
```

### 5.3 Session Token Structure (JWT Claims)

```typescript
interface AccessTokenClaims {
  sub: string;               // Cognito user sub UUID
  iss: string;               // Cognito issuer URL
  client_id: string;         // Cognito app client ID
  token_use: 'access';
  scope: string;             // "openid email profile"
  exp: number;               // Expiry (1 hour)
  iat: number;               // Issued at
}

interface IdTokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  'custom:consent_version': string;
  'custom:consent_date': string;
  token_use: 'id';
  exp: number;
  iat: number;
}
```

### 5.4 Exclusive Content (Webiny CMS Content Model)

```typescript
interface ExclusivePost {
  id: string;
  title: string;
  slug: string;
  body: string;              // Rich text (HTML)
  excerpt: string;           // Teaser for unauthenticated visitors
  coverImage: string | null;
  publishedAt: string;       // ISO 8601
  category: 'blog' | 'announcement';
  isExclusive: boolean;      // Always true for gated content
}
```

This content model is created in Webiny CMS admin panel. The existing `fetchFromCMS` client in `src/lib/webiny/client.ts` handles the GraphQL query.

---

## 6. Notification Service Design

### 6.1 Email Transport Abstraction

```typescript
interface EmailTransport {
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  sendTemplatedEmail(params: SendTemplatedEmailParams): Promise<SendEmailResult>;
}

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  headers?: Record<string, string>;  // List-Unsubscribe, etc.
}

interface SendTemplatedEmailParams {
  to: string;
  templateId: string;
  templateData: Record<string, string>;
  headers?: Record<string, string>;
}

interface SendEmailResult {
  messageId: string;
  success: boolean;
}
```

**Implementations:**
- `SesEmailTransport` — primary (uses `@aws-sdk/client-ses`)
- `SendGridEmailTransport` — fallback (uses `@sendgrid/mail`)

The active transport is selected by the `EMAIL_TRANSPORT` environment variable (`ses` | `sendgrid`).

### 6.2 Notification Trigger Mechanism

Two approaches for detecting new CMS content:

**Option A: Webiny Webhook (preferred)**
- Configure a Webiny lifecycle event hook on publish
- Webiny sends POST to `/api/notifications/trigger` with the published entry
- API route validates webhook signature, queries subscribed fans, sends emails

**Option B: Polling Fallback**
- A scheduled handler (invoked via EventBridge every 60s) queries Webiny for entries published since last check
- If new exclusive content or release is found, trigger notification sends
- Store `lastCheckedAt` in DynamoDB or SSM parameter

**Recommendation:** Start with Option A (webhook). Fall back to Option B if Webiny's webhook support is insufficient for the use case.

### 6.3 Notification Send Flow

```
Webiny CMS publish event
         │
         ▼
/api/notifications/trigger (webhook)
         │
         ├── Validate webhook signature
         ├── Determine notification category (new_song, new_album, blog_post)
         ├── Query DynamoDB: fans subscribed to category
         │
         ▼
    For each fan (batched):
         │
         ├── Decrypt email (KMS)
         ├── Build email from template
         ├── Add List-Unsubscribe header with fan's unsubscribe token
         ├── Send via EmailTransport
         │
         ├── On failure: log + retry (3x exponential backoff)
         └── Throttle to stay within SES rate limits
```

### 6.4 Email Template Structure

Templates stored as TypeScript modules (for type safety and testability):

```typescript
// src/lib/notifications/templates/release-notification.ts
export function buildReleaseNotificationEmail(data: {
  fanName?: string;
  releaseTitle: string;
  releaseType: 'song' | 'album';
  releaseUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string; text: string } {
  // Returns rendered HTML and plain-text versions
}
```

Templates include:
- `welcome` — post-verification welcome
- `release-notification` — new song/album
- `blog-notification` — new exclusive blog post
- `password-reset` — reset link
- `account-deleted` — final confirmation

### 6.5 Unsubscribe Flow

```
Fan clicks unsubscribe link in email
  https://jameswilliams.com.au/api/notifications/unsubscribe
    ?token=<unsubscribeToken>&category=new_song
         │
         ▼
GET /api/notifications/unsubscribe
         │
         ├── Lookup fan by unsubscribeToken (DynamoDB GSI)
         ├── Set categories[category] = false
         ├── Return success page (no login required)
         │
         ▼
    RFC 8058 List-Unsubscribe-Post header also supported:
    POST /api/notifications/unsubscribe
      List-Unsubscribe=One-Click
```

---

## 7. Privacy & Compliance

### 7.1 PII Encryption Approach

| Data | Storage | Encryption |
|------|---------|-----------|
| Email address | Cognito | SSE-KMS (AWS-managed) |
| Email address (in DynamoDB) | DynamoDB | Application-level KMS envelope encryption |
| Notification preferences | DynamoDB | Table-level SSE-KMS |
| Consent records | Cognito custom attributes | SSE-KMS (AWS-managed) |

**Envelope Encryption for Email in DynamoDB:**
1. Call `KMS.GenerateDataKey` to get plaintext + encrypted data key
2. Encrypt email with plaintext data key (AES-256-GCM)
3. Store encrypted email + encrypted data key in DynamoDB
4. Discard plaintext data key from memory

**Decryption:**
1. Read encrypted data key from DynamoDB record
2. Call `KMS.Decrypt` to recover plaintext data key
3. Decrypt email field
4. Discard plaintext data key

### 7.2 Account Deletion Workflow

```
1. Fan clicks "Delete Account" on /account page
2. UI shows confirmation dialog:
   "This will permanently delete all your data. This cannot be undone."
3. Fan confirms → POST /api/account/delete
4. Server:
   a. Revoke all sessions (Cognito GlobalSignOut)
   b. Clear auth cookies immediately
   c. Delete DynamoDB preference record
   d. Delete Cognito user (AdminDeleteUser)
   e. Write anonymised audit log entry (SHA-256 of sub + timestamp)
   f. Send final "account deleted" confirmation email
   g. Email address is then purged (not stored anywhere)
5. Fan is redirected to homepage with success message
```

**Timeline:** Steps 4a–4g complete within seconds (synchronous). The 72-hour SLA in requirements is a compliance buffer for edge cases.

### 7.3 Consent Recording

- During sign-up, fan must check: "I agree to the Privacy Policy (v1.0)"
- Consent version and ISO 8601 timestamp stored as Cognito custom attributes
- Also stored in the DynamoDB preferences record for redundancy
- If privacy policy is updated, a banner prompts existing fans to re-consent

### 7.4 Data Export Format

`GET /api/account/export` returns:

```json
{
  "exportVersion": "1.0",
  "exportDate": "2025-07-14T10:00:00Z",
  "account": {
    "email": "fan@example.com",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "consentVersion": "1.0",
    "consentDate": "2025-01-01T00:00:00Z"
  },
  "preferences": {
    "new_song": true,
    "new_album": true,
    "blog_post": false
  }
}
```

### 7.5 Audit Logging

- PII is **never** logged (email, name, tokens)
- Cognito sub UUIDs are logged for debugging (not PII on their own)
- Deletion audit entries are anonymised (SHA-256 hash of sub, timestamp only)
- Audit records have a 7-year TTL for compliance retention

---

## 8. Security Considerations

### 8.1 CSRF Protection

- All state-changing API routes require POST/PUT/DELETE (no mutations via GET)
- `sameSite: strict` on auth cookies prevents cross-origin cookie sending
- Additionally, validate `Origin` header matches allowed origins in API routes
- Double-submit cookie pattern as defence-in-depth for non-auth forms

### 8.2 Rate Limiting

| Endpoint | Limit | Window | Response |
|----------|-------|--------|----------|
| `/api/auth/login` | 5 attempts | 15 minutes | 429 + retry-after header |
| `/api/auth/signup` | 3 attempts | 1 hour | 429 |
| `/api/auth/forgot-password` | 3 attempts | 1 hour | 429 |
| `/api/auth/confirm-signup` | 5 attempts | 15 minutes | 429 |
| `/api/notifications/trigger` | 10 requests | 1 minute | 429 |

Implementation: In-memory rate limiter (Map-based) for Lambda — acceptable given Lambda's request isolation. For shared state, use DynamoDB atomic counters if needed.

### 8.3 Token Rotation Strategy

- **Access token:** 1-hour TTL, refreshed silently via `/api/auth/refresh`
- **Refresh token:** 30-day TTL, rotated on each refresh (Cognito issues a new refresh token)
- **On logout:** `GlobalSignOut` invalidates all tokens server-side
- **On password change:** All existing sessions are revoked

### 8.4 Input Validation (Zod Schemas)

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy' }),
  }),
});

export const preferencesSchema = z.object({
  categories: z.object({
    new_song: z.boolean(),
    new_album: z.boolean(),
    blog_post: z.boolean(),
  }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
```

All API routes validate request bodies with Zod before processing. Invalid input returns 400 with structured error details.

### 8.5 Additional Security Measures

- **No email enumeration:** Login and password reset return generic messages regardless of whether the email exists
- **Cognito adaptive auth:** Enabled for anomaly detection (unfamiliar devices, unusual locations)
- **Content-Security-Policy:** Restrict inline scripts, limit form action targets
- **No PII in logs:** Logger utility strips known PII fields before writing

---

## 9. New Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `amazon-cognito-identity-js` | `^6.3.0` | Client-side Cognito SRP auth |
| `@aws-sdk/client-cognito-identity-provider` | `^3.600.0` | Server-side admin operations |
| `@aws-sdk/client-dynamodb` | `^3.600.0` | DynamoDB operations |
| `@aws-sdk/lib-dynamodb` | `^3.600.0` | DynamoDB document client |
| `@aws-sdk/client-ses` | `^3.600.0` | Amazon SES email sending |
| `@aws-sdk/client-kms` | `^3.600.0` | KMS encrypt/decrypt |
| `zod` | `^3.23.0` | Runtime input validation |
| `jose` | `^5.6.0` | JWT verification (lightweight, no native deps) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/jsonwebtoken` | — | Not needed (jose has built-in types) |

**Bundle impact:** ~65KB gzipped total for client-side (cognito-identity-js + zod). Server-side AWS SDK is tree-shaken and only loaded in API routes.

---

## 10. Environment Variables

Add to Lambda function environment (via CDK + SSM):

```bash
# Cognito
COGNITO_USER_POOL_ID=ap-southeast-2_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=ap-southeast-2

# DynamoDB
FAN_PREFERENCES_TABLE=jameswilliams-fan-preferences
FAN_DELETION_AUDIT_TABLE=jameswilliams-fan-deletion-audit

# SES
SES_FROM_ADDRESS=notifications@jameswilliams.com.au
SES_REGION=ap-southeast-2

# KMS
KMS_KEY_ARN=arn:aws:kms:ap-southeast-2:ACCOUNT:key/KEY_ID

# Email transport selection
EMAIL_TRANSPORT=ses

# Cookies
COOKIE_DOMAIN=jameswilliams.com.au
COOKIE_SECURE=true

# App
NEXT_PUBLIC_APP_URL=https://jameswilliams.com.au

# Webhook secret (for Webiny notification trigger)
WEBHOOK_SECRET=<random-secret>

# SendGrid fallback (optional)
# SENDGRID_API_KEY=<from-secrets-manager>
```

**SSM Parameter paths** (fetched at deploy time):
- `/jameswilliams/dev/cognito/user-pool-id`
- `/jameswilliams/dev/cognito/client-id`
- `/jameswilliams/dev/dynamodb/fan-preferences-table`
- `/jameswilliams/dev/ses/from-address`
- `/jameswilliams/dev/kms/fan-data-key-arn`

---

## 11. File Structure

```
src/
├── app/
│   ├── (auth)/                          # Auth route group (no layout nesting)
│   │   ├── login/
│   │   │   └── page.tsx                 # Login form
│   │   ├── signup/
│   │   │   └── page.tsx                 # Sign-up form with consent
│   │   └── forgot-password/
│   │       └── page.tsx                 # Password reset flow
│   ├── (protected)/                     # Protected route group
│   │   ├── account/
│   │   │   ├── page.tsx                 # Account settings
│   │   │   └── preferences/
│   │   │       └── page.tsx             # Notification preferences
│   │   └── exclusive/
│   │       ├── page.tsx                 # Exclusive content listing
│   │       └── [slug]/
│   │           └── page.tsx             # Individual exclusive post
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts           # POST: authenticate
│   │   │   ├── signup/route.ts          # POST: create account
│   │   │   ├── logout/route.ts          # POST: sign out
│   │   │   ├── refresh/route.ts         # POST: refresh token
│   │   │   ├── forgot-password/route.ts # POST: initiate reset
│   │   │   ├── reset-password/route.ts  # POST: confirm reset
│   │   │   └── confirm-signup/route.ts  # POST: verify email
│   │   ├── preferences/route.ts         # GET/PUT: notification prefs
│   │   ├── account/
│   │   │   ├── delete/route.ts          # POST: delete account
│   │   │   └── export/route.ts          # GET: data export
│   │   └── notifications/
│   │       ├── unsubscribe/route.ts     # GET/POST: one-click unsubscribe
│   │       └── trigger/route.ts         # POST: webhook from CMS
│   └── ...
├── lib/
│   ├── auth/
│   │   ├── cognito.ts                   # Cognito client wrapper
│   │   ├── tokens.ts                    # JWT verification, cookie helpers
│   │   ├── middleware.ts                # Auth check logic for middleware
│   │   └── session.ts                   # Get current user from request
│   ├── db/
│   │   ├── client.ts                    # DynamoDB document client
│   │   ├── preferences.ts              # CRUD for fan preferences
│   │   └── audit.ts                     # Deletion audit log operations
│   ├── email/
│   │   ├── transport.ts                 # EmailTransport interface
│   │   ├── ses-transport.ts             # SES implementation
│   │   ├── sendgrid-transport.ts        # SendGrid implementation
│   │   └── factory.ts                   # Transport factory (env-based)
│   ├── notifications/
│   │   ├── service.ts                   # Notification orchestration
│   │   └── templates/
│   │       ├── welcome.ts
│   │       ├── release-notification.ts
│   │       ├── blog-notification.ts
│   │       ├── password-reset.ts
│   │       └── account-deleted.ts
│   ├── privacy/
│   │   ├── encryption.ts               # KMS envelope encryption helpers
│   │   ├── deletion.ts                  # Account deletion workflow
│   │   └── export.ts                    # Data export builder
│   ├── validation/
│   │   └── schemas.ts                   # Zod schemas for all inputs
│   ├── rate-limit/
│   │   └── limiter.ts                   # In-memory rate limiter
│   └── webiny/                          # (existing)
│       ├── api.ts
│       ├── client.ts
│       ├── queries.ts                   # Add exclusive content queries
│       └── types.ts                     # Add ExclusivePost type
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── AuthGuard.tsx                # Client-side auth state provider
│   ├── account/
│   │   ├── PreferencesForm.tsx
│   │   ├── DeleteAccountDialog.tsx
│   │   └── DataExportButton.tsx
│   └── exclusive/
│       ├── PostCard.tsx
│       ├── PostList.tsx
│       └── ContentTeaser.tsx            # Shown to unauthenticated users
├── middleware.ts                         # Next.js middleware (route protection)
└── ...

tests/
├── unit/
│   ├── auth/
│   │   ├── tokens.test.ts
│   │   └── cognito.test.ts
│   ├── db/
│   │   └── preferences.test.ts
│   ├── email/
│   │   └── ses-transport.test.ts
│   ├── notifications/
│   │   └── service.test.ts
│   ├── privacy/
│   │   ├── encryption.test.ts
│   │   └── deletion.test.ts
│   └── validation/
│       └── schemas.test.ts
└── integration/
    ├── auth-flow.test.ts
    ├── preferences-api.test.ts
    └── unsubscribe.test.ts
```

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth library | `amazon-cognito-identity-js` | ~45KB vs ~200KB+ Amplify; only need SRP auth |
| Token storage | httpOnly cookies | XSS-proof; works with server-side middleware |
| Email provider | Amazon SES (primary) | Already in AWS ecosystem; cheaper; SLA compatible |
| Email fallback | SendGrid (via abstraction) | Config-only swap; no code changes needed |
| Input validation | Zod | Runtime type safety; great TS inference; small bundle |
| JWT verification | jose | Pure JS; no native bindings; works in Lambda/Edge |
| Route protection | Next.js middleware | Runs before page render; fast redirect for unauthed |
| PII encryption | KMS envelope encryption | Field-level encryption; key rotation without re-encrypt |
| Preferences store | DynamoDB on-demand | Low-latency; pay-per-request; no capacity planning |
| Framework | No Amplify | Smaller bundle; direct control; avoid vendor lock-in |
