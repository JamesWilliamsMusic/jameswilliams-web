# jameswilliams-web

Full-stack Next.js application deployed to AWS Lambda via Docker and the AWS Lambda Web Adapter.

## Prerequisites

- Node.js 24+
- Docker
- AWS CLI (configured)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run tests with coverage report |

## Docker

```bash
docker build -t jameswilliams-web .
docker run -p 3000:3000 jameswilliams-web
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `debug` | Logging verbosity |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | Public API base URL |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  CloudFront/ALB │────▶│  Lambda (Docker) │────▶│  Next.js    │
│                 │     │  Web Adapter      │     │  Standalone │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

The AWS Lambda Web Adapter proxies Lambda events to the Next.js standalone HTTP server — no custom handler code required.

## Deployment

Automated via GitHub Actions on push to `main` or `feat/*`/`fix/*` branches:

1. Quality checks (lint, typecheck, tests)
2. SAST (CodeQL + Semgrep)
3. Semantic release (version bump, changelog, git tag)
4. Docker build → push to ECR → deploy to Lambda

## Commit Conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
