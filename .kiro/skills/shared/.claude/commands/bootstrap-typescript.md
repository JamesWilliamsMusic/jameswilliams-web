# Bootstrap TypeScript Project

When the user asks to bootstrap or scaffold a TypeScript project, determine the project type. If not specified, ask:

> What type of project would you like to bootstrap?
> 1. **Express API** — REST API using Express.js with serverless-express
> 2. **Next.js** — Full-stack Next.js app with SSR/API routes
> 3. **Node Module** — Reusable npm package/library

Then follow the corresponding section below.

---

## Shared Configuration (All Project Types)

### TypeScript Configuration

Use strict TypeScript settings as a base (project types may extend this):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Development Best Practices

#### Error Handling
- Use a centralized error handler middleware
- Define custom error classes extending a base `AppError` class
- Never expose internal error details in responses
- Always return structured error responses: `{ error: { code, message, requestId } }`

#### Logging
- Use structured JSON logging (e.g., pino or winston)
- Include correlation/request IDs in all log entries
- Log at appropriate levels: error, warn, info, debug
- Never log sensitive data (tokens, passwords, PII)

#### Security
- Validate all input using a schema validation library (e.g., zod)
- Set security headers (helmet)
- Implement rate limiting where appropriate
- Use environment variables for all secrets and configuration
- Never commit .env files

#### Code Organization
- Follow single responsibility principle per file
- Keep handlers thin — delegate to services
- Use dependency injection for testability
- Define interfaces for all service boundaries

#### Testing
- Enforce 80% minimum code coverage on unit tests (configured in jest.config.ts)
- Unit test services and utilities in isolation
- Integration test API endpoints with supertest
- Mock external dependencies in unit tests

#### Environment Configuration
- Use a typed config module that reads from environment variables
- Provide sensible defaults for local development
- Validate required env vars at startup and fail fast

### Jest Configuration (jest.config.ts)

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
```

### .gitignore (shared base)

All project types include:

```
# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

Project-type-specific additions: Express API adds `dist/`. Next.js adds `.next/`, `out/`, `*.tsbuildinfo`, `next-env.d.ts`, `.vercel`. Node Module adds `dist/`, `*.tsbuildinfo`.

### .dockerignore (shared base)

```
node_modules
.git
.github
.husky
tests
*.md
.env*
coverage
```

### Semantic Versioning

Use `semantic-release` with conventional commits.

#### Dependencies

```json
{
  "devDependencies": {
    "semantic-release": "^24",
    "@semantic-release/changelog": "^6",
    "@semantic-release/git": "^10",
    "@semantic-release/github": "^11"
  }
}
```

#### .releaserc.json

```json
{
  "branches": [
    "main",
    { "name": "feat/*", "prerelease": "feat-${name.replace(/^feat\\//, '')}" },
    { "name": "fix/*", "prerelease": "fix-${name.replace(/^fix\\//, '')}" }
  ],
  "tagFormat": "v${version}",
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    "@semantic-release/npm",
    ["@semantic-release/git", { "assets": ["package.json", "CHANGELOG.md"], "message": "chore(release): v${nextRelease.version} [skip ci]" }],
    "@semantic-release/github"
  ]
}
```

#### Versioning Behavior

- `main` branch: standard semver with git tag (e.g., `v1.2.3`)
- `feat/*` branches: prerelease (e.g., `v1.3.0-feat-add-auth.1`) — no changelog update
- `fix/*` branches: prerelease (e.g., `v1.2.1-fix-login-bug.1`) — no changelog update
- Always squash merge feat/fix branches into main
- CHANGELOG.md only updated on main branch merges

#### Docker Image Tagging

- `main`: `1.2.3` and `latest`
- `feat/add-auth`: `1.3.0-feat-add-auth.1`
- `fix/login-bug`: `1.2.1-fix-login-bug.1`

### Git Hooks (Husky + Commitlint)

```json
{
  "devDependencies": {
    "husky": "^9",
    "@commitlint/cli": "^19",
    "@commitlint/config-conventional": "^19"
  }
}
```

commitlint.config.js: `module.exports = { extends: ['@commitlint/config-conventional'] };`

.husky/commit-msg: `npx --no -- commitlint --edit $1`
.husky/pre-push: `npm run test:coverage`

Conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### GitHub Actions Pipeline (shared structure)

All project types use `.github/workflows/deploy.yml` with jobs: quality → sast → release → build-and-deploy. Uses semantic-release, CodeQL, Semgrep, OIDC auth to AWS, Docker build + ECR push.

Also include `.github/workflows/cleanup.yml` to clean up ECR images and git tags when branches are deleted.

---

## Project Type: Express API

Structure: `src/{handlers,routes,middleware,services,models,utils}`, `tests/{unit,integration}`

Stack: Node.js 24, TypeScript 5.x strict, Express.js + `@vendia/serverless-express`, Jest, ESLint, Prettier, Docker multi-stage, GitHub Actions

Lambda handler pattern:
```typescript
import serverlessExpress from '@vendia/serverless-express';
import { app } from './app';
let cachedHandler: any;
export const handler = async (event: any, context: any) => {
  if (!cachedHandler) { cachedHandler = serverlessExpress({ app }); }
  return cachedHandler(event, context);
};
```

Dockerfile: Multi-stage from `node:24-alpine` (build) → `public.ecr.aws/lambda/nodejs:24` (production). CMD: `["dist/handlers/index.handler"]`

---

## Project Type: Next.js (Lambda via Docker)

Structure: `src/{app,components,lib,models}`, `tests/{unit,integration}`, `public/`

Stack: Node.js 24, TypeScript 5.x strict, Next.js 14+ App Router, `output: 'standalone'`, Tailwind CSS 4.x, AWS Lambda Web Adapter, Jest + @testing-library/react, ESLint, Prettier, Docker multi-stage, GitHub Actions

Dockerfile: Multi-stage from `node:24-alpine` (build) → `public.ecr.aws/lambda/nodejs:24` (production). Copies Lambda Web Adapter from `public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1`. CMD: `["node", "server.js"]`

Tailwind CSS 4.x: Use `@tailwindcss/postcss` plugin, `@import "tailwindcss"` in globals.css.

---

## Project Type: Node Module

Structure: `src/{index.ts,lib,types}`, `tests/{unit,integration}`

Stack: Node.js 24, TypeScript 5.x strict, Jest, ESLint, Prettier, tsc build, npm/GitHub Packages, GitHub Actions

Use tsconfig.build.json (extends tsconfig.json, excludes tests). Package.json: `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"files": ["dist"]`.

Pipeline uses `.github/workflows/publish.yml` (quality → sast → release with npm publish).

---

## GitHub Repository Configuration Requirements

After scaffolding, remind the user to configure:

**Secrets:** `AWS_ROLE_ARN` (for OIDC auth)
**Variables:** `AWS_REGION` (default `ap-southeast-2`), `ECR_REPOSITORY`, `PACKAGE_NAME` (for Node Module)
**Settings:** Enable squash merging only, branch protection on main (require PR + status checks)
**AWS:** ECR repo must exist, IAM role with ECR permissions, OIDC provider configured
