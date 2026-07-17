# Build stage
FROM public.ecr.aws/docker/library/node:24-slim AS builder
WORKDIR /app

# Only NEXT_PUBLIC_* vars are needed at build time (inlined into client JS by Next.js)
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM public.ecr.aws/docker/library/node:24-slim AS runner

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=3000
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/run.sh ./run.sh
RUN ln -s /tmp/cache ./.next/cache

# Runtime env vars (WEBINY_API_URL, WEBINY_API_TOKEN, COGNITO_*, etc.)
# are set on the Lambda function configuration at deploy time, not baked into the image.

CMD ["./run.sh"]
