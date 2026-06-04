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
