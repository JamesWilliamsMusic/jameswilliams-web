---
name: Bootstrap TypeScript Project
inclusion: manual
---

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

Apply these practices when generating code:

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

All project types should include this as a starting point:

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

Project-type-specific entries are appended in each section below.

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

Use `semantic-release` to automatically determine version numbers based on conventional commits.

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
    [
      "@semantic-release/changelog",
      { "changelogFile": "CHANGELOG.md" }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): v${nextRelease.version} [skip ci]"
      }
    ],
    "@semantic-release/github"
  ]
}
```

#### Versioning Behavior

- `main` branch: standard semver with git tag (e.g., `v1.2.3`)
- `feat/*` branches: prerelease with git tag (e.g., `v1.3.0-feat-add-auth.1`) — no changelog update
- `fix/*` branches: prerelease with git tag (e.g., `v1.2.1-fix-login-bug.1`) — no changelog update
- All releases create a corresponding git tag and GitHub release
- CHANGELOG.md is only updated on `main` branch merges
- Feature and fix branches must be squash-merged into `main` to keep changelog clean

#### Branch Merge Strategy

- Always use **squash merge** when merging `feat/*` or `fix/*` branches into `main`
- The squash commit message should follow conventional commit format
- This ensures CHANGELOG.md contains one clean entry per feature/fix, not individual branch commits
- Configure repository settings to enforce squash merging on PRs

#### Docker Image Tagging

When building Docker images, tag with the semantic version:

- `main`: `1.2.3` and `latest`
- `feat/add-auth`: `1.3.0-feat-add-auth.1`
- `fix/login-bug`: `1.2.1-fix-login-bug.1`

### Git Hooks (Husky + Commitlint)

Set up Husky with the following hooks:

#### Dependencies

```json
{
  "devDependencies": {
    "husky": "^9",
    "@commitlint/cli": "^19",
    "@commitlint/config-conventional": "^19"
  }
}
```

#### package.json — add prepare script

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

#### commitlint.config.js

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

#### .husky/commit-msg

Enforces conventional commit messages:

```sh
npx --no -- commitlint --edit $1
```

#### .husky/pre-push

Runs tests with coverage before pushing:

```sh
npm run test:coverage
```

#### Conventional Commit Format

All commit messages must follow:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### GitHub Actions Pipeline (shared structure)

All project types use this pipeline structure in `.github/workflows/deploy.yml`:

1. Lint and type-check
2. Run unit tests
3. Run integration tests
4. Build Docker image
5. Push to ECR
6. Deploy (update Lambda function)

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - 'feat/**'
      - 'fix/**'
  pull_request:
    branches: [main]

env:
  AWS_REGION: ${{ vars.AWS_REGION || 'ap-southeast-2' }}
  ECR_REPOSITORY: ${{ vars.ECR_REPOSITORY }}

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:integration

  sast:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      - name: Run Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/typescript
            p/nodejs
            p/security-audit

  release:
    needs: [quality, sast]
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    outputs:
      new_release_version: ${{ steps.semantic.outputs.new_release_version }}
      new_release_published: ${{ steps.semantic.outputs.new_release_published }}
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - name: Semantic Release
        id: semantic
        uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  build-and-deploy:
    needs: release
    if: needs.release.outputs.new_release_published == 'true'
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          VERSION: ${{ needs.release.outputs.new_release_version }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$VERSION .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$VERSION
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$VERSION $ECR_REGISTRY/$ECR_REPOSITORY:latest
            docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          fi
```

### GitHub Actions Cleanup Pipeline (.github/workflows/cleanup.yml)

Triggers when a branch is deleted and removes all ECR images and git tags created from that branch:

```yaml
name: Cleanup ECR

on:
  delete:
    branches:
      - 'feat/**'
      - 'fix/**'

env:
  AWS_REGION: ${{ vars.AWS_REGION || 'ap-southeast-2' }}
  ECR_REPOSITORY: ${{ vars.ECR_REPOSITORY }}

jobs:
  cleanup-ecr:
    if: github.event.ref_type == 'branch'
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Derive image tag prefix from branch name
        id: prefix
        run: |
          BRANCH="${{ github.event.ref }}"
          PREFIX=$(echo "$BRANCH" | sed 's/\//-/g')
          echo "prefix=$PREFIX" >> "$GITHUB_OUTPUT"

      - name: List and delete ECR images with branch prefix
        run: |
          PREFIX="${{ steps.prefix.outputs.prefix }}"
          echo "Cleaning up images with prefix: $PREFIX"

          IMAGE_TAGS=$(aws ecr list-images \
            --repository-name $ECR_REPOSITORY \
            --filter tagStatus=TAGGED \
            --query "imageIds[?starts_with(imageTag, '${PREFIX}') || contains(imageTag, '${PREFIX}')].imageTag" \
            --output text)

          if [ -z "$IMAGE_TAGS" ]; then
            echo "No images found with prefix $PREFIX"
            exit 0
          fi

          IMAGE_IDS=""
          for TAG in $IMAGE_TAGS; do
            IMAGE_IDS="$IMAGE_IDS imageTag=$TAG"
          done

          aws ecr batch-delete-image \
            --repository-name $ECR_REPOSITORY \
            --image-ids $IMAGE_IDS

          echo "Deleted images: $IMAGE_TAGS"

      - name: Delete git tags for branch
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PREFIX="${{ steps.prefix.outputs.prefix }}"
          echo "Cleaning up git tags with prefix: $PREFIX"

          TAGS=$(git tag -l "*${PREFIX}*")

          if [ -z "$TAGS" ]; then
            echo "No tags found with prefix $PREFIX"
            exit 0
          fi

          for TAG in $TAGS; do
            git push --delete origin "$TAG" || true
            echo "Deleted tag: $TAG"
          done
```

### README Content (all project types)

Generate a README that includes:
- Project description
- Prerequisites (Node.js 24, Docker, AWS CLI)
- Local development setup instructions
- Available npm scripts
- Docker build and run commands
- Environment variables table
- Deployment overview
- Architecture diagram (text-based)
- Commit message conventions (conventional commits)

---

## Project Type: Express API

### Project Structure

```
├── src/
│   ├── handlers/          # Lambda handler entry points
│   │   └── index.ts
│   ├── routes/            # API route definitions
│   │   └── health.ts
│   ├── middleware/        # Shared middleware (error handling, logging, validation)
│   │   └── errorHandler.ts
│   ├── services/          # Business logic layer
│   ├── models/            # Type definitions and interfaces
│   └── utils/             # Shared utilities
├── tests/
│   ├── unit/
│   └── integration/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Dockerfile
├── .dockerignore
├── tsconfig.json
├── package.json
├── jest.config.ts
├── .eslintrc.json
├── .prettierrc
├── .env.example
└── README.md
```

### Technology Stack

- Runtime: Node.js 24.x
- Language: TypeScript 5.x (strict mode)
- Framework: Express.js with `@vendia/serverless-express` for Lambda compatibility
- Testing: Jest with ts-jest
- Linting: ESLint with @typescript-eslint
- Formatting: Prettier
- Build: tsc (TypeScript compiler)
- Container: Docker multi-stage build
- CI/CD: GitHub Actions

### tsconfig.json

Extend the shared base with:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Lambda Handler Pattern

```typescript
import serverlessExpress from '@vendia/serverless-express';
import { app } from './app';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    cachedHandler = serverlessExpress({ app });
  }
  return cachedHandler(event, context);
};
```

### Dockerfile

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production stage
FROM public.ecr.aws/lambda/nodejs:24 AS production
COPY --from=builder /app/dist ${LAMBDA_TASK_ROOT}/dist
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=builder /app/package.json ${LAMBDA_TASK_ROOT}/
CMD ["dist/handlers/index.handler"]
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/handlers/index.js",
    "dev": "ts-node-dev --respawn src/handlers/index.ts",
    "lint": "eslint 'src/**/*.ts' 'tests/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' 'tests/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

### .gitignore (Express API additions)

Append to the shared base:

```
# Build output
dist/
```

### .env.example

```
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

---

## Project Type: Next.js (Lambda via Docker)

### Project Structure

```
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/           # API routes
│   │       └── health/
│   │           └── route.ts
│   ├── components/        # React components
│   ├── lib/               # Shared utilities and services
│   │   ├── services/      # Business logic layer
│   │   └── utils/         # Helper functions
│   ├── models/            # Type definitions and interfaces
│   └── middleware.ts      # Next.js middleware
├── tests/
│   ├── unit/
│   └── integration/
├── public/                # Static assets
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Dockerfile
├── .dockerignore
├── next.config.js
├── tsconfig.json
├── package.json
├── jest.config.ts
├── .eslintrc.json
├── .prettierrc
├── .env.example
└── README.md
```

### Technology Stack

- Runtime: Node.js 24.x
- Language: TypeScript 5.x (strict mode)
- Framework: Next.js 14+ (App Router) with `output: 'standalone'`
- Styling: Tailwind CSS 4.x
- Lambda Adapter: AWS Lambda Web Adapter (`aws-lambda-web-adapter`)
- Testing: Jest with ts-jest and @testing-library/react
- Linting: ESLint with next/core-web-vitals
- Formatting: Prettier
- Build: `next build`
- Container: Docker multi-stage build
- CI/CD: GitHub Actions

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

module.exports = nextConfig;
```

### Tailwind CSS

Install and configure Tailwind CSS 4.x:

#### Dependencies

```json
{
  "devDependencies": {
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4"
  }
}
```

#### postcss.config.mjs

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

#### src/app/globals.css

```css
@import "tailwindcss";
```

#### src/app/layout.tsx

Ensure the global stylesheet is imported:

```typescript
import './globals.css';
```

### Dockerfile

Uses the AWS Lambda Web Adapter to run Next.js standalone output on Lambda:

```dockerfile
# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM public.ecr.aws/lambda/nodejs:24 AS production

# Install AWS Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=3000
ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ${LAMBDA_TASK_ROOT}/
COPY --from=builder /app/.next/static ${LAMBDA_TASK_ROOT}/.next/static
COPY --from=builder /app/public ${LAMBDA_TASK_ROOT}/public

CMD ["node", "server.js"]
```

### .dockerignore (additional entries)

Append to the shared base:

```
.next
out
.eslintrc.json
.prettierrc
jest.config.ts
tsconfig.json
next.config.js
next-env.d.ts
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx}' 'tests/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

### Lambda Web Adapter Notes

- The AWS Lambda Web Adapter allows running standard web apps (like Next.js) on Lambda without code changes.
- It listens on the configured `PORT` and proxies Lambda events to the HTTP server.
- No custom Lambda handler code is needed — Next.js runs as-is.
- Set the `AWS_LWA_INVOKE_MODE` env var to `response_stream` for streaming SSR responses (requires Lambda function URL with response streaming enabled).

### .gitignore (Next.js additions)

Append to the shared base:

```
# Next.js
.next/
out/

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Vercel
.vercel
```

### .env.example

```
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Project Type: Node Module

### Project Structure

```
├── src/
│   ├── index.ts           # Main entry point (exports public API)
│   ├── lib/               # Core library code
│   └── types/             # Type definitions
├── tests/
│   ├── unit/
│   └── integration/
├── .github/
│   └── workflows/
│       └── publish.yml
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── jest.config.ts
├── .eslintrc.json
├── .prettierrc
├── .npmignore
└── README.md
```

### Technology Stack

- Runtime: Node.js 24.x
- Language: TypeScript 5.x (strict mode)
- Testing: Jest with ts-jest
- Linting: ESLint with @typescript-eslint
- Formatting: Prettier
- Build: tsc (TypeScript compiler)
- Package Registry: npm (GitHub Packages or npmjs.org)
- CI/CD: GitHub Actions

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
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
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsconfig.build.json

Excludes test files from the build output:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "tests", "**/*.spec.ts", "**/*.test.ts"]
}
```

### package.json

```json
{
  "name": "@scope/package-name",
  "version": "0.0.0-development",
  "description": "",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "prepublishOnly": "npm run build",
    "lint": "eslint 'src/**/*.ts' 'tests/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' 'tests/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "prepare": "husky"
  },
  "engines": {
    "node": ">=24"
  }
}
```

### .gitignore (Node Module additions)

Append to the shared base:

```
# Build output
dist/

# TypeScript
*.tsbuildinfo
```

### .npmignore

```
src/
tests/
.github/
.husky/
.eslintrc.json
.prettierrc
jest.config.ts
tsconfig.json
tsconfig.build.json
coverage/
.env*
```

### .releaserc.json (override for npm publish)

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
    [
      "@semantic-release/changelog",
      { "changelogFile": "CHANGELOG.md" }
    ],
    [
      "@semantic-release/npm",
      { "npmPublish": true }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): v${nextRelease.version} [skip ci]"
      }
    ],
    "@semantic-release/github"
  ]
}
```

### GitHub Actions Pipeline (.github/workflows/publish.yml)

```yaml
name: Publish

on:
  push:
    branches:
      - main
      - 'feat/**'
      - 'fix/**'
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage

  sast:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      - name: Run Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/typescript
            p/nodejs
            p/security-audit

  release:
    needs: [quality, sast]
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      packages: write
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          registry-url: 'https://npm.pkg.github.com'
      - run: npm ci
      - name: Semantic Release
        uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Actions Cleanup Pipeline (.github/workflows/cleanup.yml)

Triggers when a branch is deleted and removes npm package versions and git tags created from that branch:

```yaml
name: Cleanup Packages

on:
  delete:
    branches:
      - 'feat/**'
      - 'fix/**'

jobs:
  cleanup:
    if: github.event.ref_type == 'branch'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Derive prefix from branch name
        id: prefix
        run: |
          BRANCH="${{ github.event.ref }}"
          PREFIX=$(echo "$BRANCH" | sed 's/\//-/g')
          echo "prefix=$PREFIX" >> "$GITHUB_OUTPUT"

      - name: Delete prerelease package versions
        uses: actions/delete-package-versions@v5
        with:
          package-name: ${{ vars.PACKAGE_NAME }}
          package-type: npm
          min-versions-to-keep: 0
          delete-only-pre-release-versions: true
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Delete git tags for branch
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PREFIX="${{ steps.prefix.outputs.prefix }}"
          echo "Cleaning up git tags with prefix: $PREFIX"

          TAGS=$(git tag -l "*${PREFIX}*")

          if [ -z "$TAGS" ]; then
            echo "No tags found with prefix $PREFIX"
            exit 0
          fi

          for TAG in $TAGS; do
            git push --delete origin "$TAG" || true
            echo "Deleted tag: $TAG"
          done
```

### Module Design Guidelines

- Export a clean public API from `src/index.ts`
- Use barrel exports — only expose what consumers need
- Keep internal implementation details unexported
- Provide TypeScript types alongside the compiled output
- Document public APIs with JSDoc comments
- Avoid side effects on import
- Support both CommonJS and ESM consumers if needed (use `exports` field in package.json)
- Include a `peerDependencies` section for shared dependencies consumers are expected to provide

---

## GitHub Repository Configuration Requirements

After scaffolding the project, display the following requirements to the user and remind them to configure these in their GitHub repository settings.

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Required For | Description |
|--------|-------------|-------------|
| `AWS_ROLE_ARN` | Express API, Next.js | IAM role ARN for GitHub OIDC authentication to AWS (used by `aws-actions/configure-aws-credentials`) |
| `GITHUB_TOKEN` | All | Automatically provided by GitHub Actions — no manual setup needed |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Required For | Default | Description |
|----------|-------------|---------|-------------|
| `AWS_REGION` | Express API, Next.js | `ap-southeast-2` | AWS region for ECR and deployment |
| `ECR_REPOSITORY` | Express API, Next.js | — | Name of the ECR repository to push images to |
| `PACKAGE_NAME` | Node Module | — | Scoped package name (e.g., `@org/package-name`) for cleanup pipeline |

### Repository Settings

| Setting | Location | Value |
|---------|----------|-------|
| Squash merging | Settings → General → Pull Requests | Enable "Allow squash merging", disable others |
| Branch protection | Settings → Branches → `main` | Require PR, require status checks (quality, sast) |
| OIDC trust policy | AWS IAM | Configure the IAM role to trust `token.actions.githubusercontent.com` for this repo |

### AWS Prerequisites

- An ECR repository must exist before the first pipeline run
- The IAM role must have permissions: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:BatchDeleteImage`, `ecr:ListImages`
- OIDC identity provider (`token.actions.githubusercontent.com`) must be configured in the AWS account
