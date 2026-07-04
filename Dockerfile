# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

ARG WEBINY_API_URL
ARG WEBINY_API_TOKEN
ENV WEBINY_API_URL=$WEBINY_API_URL
ENV WEBINY_API_TOKEN=$WEBINY_API_TOKEN

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM public.ecr.aws/lambda/nodejs:24 AS production

ARG WEBINY_API_URL
ARG WEBINY_API_TOKEN

# Install AWS Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=3000
ENV NODE_ENV=production
ENV WEBINY_API_URL=${WEBINY_API_URL}
ENV WEBINY_API_TOKEN=${WEBINY_API_TOKEN}

# Copy standalone output
COPY --from=builder /app/.next/standalone ${LAMBDA_TASK_ROOT}/
COPY --from=builder /app/.next/static ${LAMBDA_TASK_ROOT}/.next/static
COPY --from=builder /app/public ${LAMBDA_TASK_ROOT}/public

CMD ["node", "server.js"]
