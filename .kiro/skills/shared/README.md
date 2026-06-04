# Kiro Skills Repository

Shared Kiro skills for bootstrapping TypeScript API projects deployed to AWS Lambda via Docker/ECR.

## Available Skills

| Skill | Description |
|-------|-------------|
| Bootstrap TypeScript Project for AWS Lambda | Scaffolds a production-ready TypeScript project with Docker, GitHub Actions CI/CD, and AWS Lambda deployment |

### Supported Project Types

| Type | Description |
|------|-------------|
| Express API | REST API using Express.js + serverless-express |
| Next.js | Full-stack Next.js app with SSR/API routes via Lambda Web Adapter |
| Node Module | Reusable npm package/library published to GitHub Packages |

## How to Use

### Option 1: Git Submodule (recommended for teams)

Add this repo as a submodule inside your project's `.kiro/skills/` directory:

```bash
# From your project root
mkdir -p .kiro/skills
git submodule add <this-repo-url> .kiro/skills/shared
```

After cloning a project that already has the submodule:

```bash
git submodule update --init --recursive
```

### Option 2: Copy into your project

```bash
# From your project root
mkdir -p .kiro/skills
cp path/to/this-repo/.kiro/skills/*.md .kiro/skills/
```

### Option 3: Symlink for user-level access (all projects)

```bash
ln -s /path/to/this-repo/.kiro/skills/bootstrap-typescript-project.md ~/.kiro/skills/bootstrap-typescript-project.md
```

## Activating a Skill in Kiro

1. Open the Kiro chat
2. Type `#` in the input field
3. Select the skill from the dropdown list
4. Type your prompt (e.g., "bootstrap a new API project called order-service")

The skill instructions are loaded into context and Kiro follows them when generating code.

## GitHub Repository Setup

After scaffolding a project, you'll need to configure the following in your GitHub repository:

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Required For | Description |
|--------|-------------|-------------|
| `AWS_ROLE_ARN` | Express API, Next.js | IAM role ARN for GitHub OIDC authentication to AWS |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Required For | Default | Description |
|----------|-------------|---------|-------------|
| `AWS_REGION` | Express API, Next.js | `ap-southeast-2` | AWS region for ECR |
| `ECR_REPOSITORY` | Express API, Next.js | — | ECR repository name |
| `PACKAGE_NAME` | Node Module | — | Scoped npm package name for cleanup |

### Repository Settings

- Enable squash merging only (for clean changelogs)
- Protect `main` branch with required status checks (`quality`, `sast`)
- Configure AWS OIDC trust policy for the repository

## Updating Skills

If using git submodules, pull the latest:

```bash
git submodule update --remote .kiro/skills/shared
```

## Contributing

Edit or add `.md` files in `.kiro/skills/`. Each skill file uses this format:

```markdown
---
name: Skill Name
inclusion: manual
---

# Skill Title

Instructions go here...
```

- `inclusion: manual` — activated via `#` in chat
- `inclusion: auto` — always loaded into context
