# Build stage
FROM public.ecr.aws/docker/library/node:24-slim AS builder
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
FROM public.ecr.aws/docker/library/node:24-slim AS runner

COPY --from=public.ecr.aws/awsguru/aws-lambda-web-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

ARG WEBINY_API_URL
ARG WEBINY_API_TOKEN

ENV PORT=3000
ENV NODE_ENV=production
ENV WEBINY_API_URL=${WEBINY_API_URL}
ENV WEBINY_API_TOKEN=${WEBINY_API_TOKEN}

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/run.sh ./run.sh
RUN ln -s /tmp/cache ./.next/cache

CMD ["./run.sh"]
