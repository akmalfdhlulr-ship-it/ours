# ==============================================================================
# Dockerfile for OURS Monorepo Backend API (Railway / Docker Production)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable modern pnpm via corepack
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Install OpenSSL for Prisma engine
RUN apk add --no-cache openssl

# Copy workspace package definitions
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY apps/worker/ apps/worker/
COPY prisma/ prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client for linux targets
RUN cd packages/database && pnpm exec prisma generate

# Build monorepo packages and NestJS API
RUN pnpm --filter @ours/api... build

# ==============================================================================
# Production Runner
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built artifacts
COPY --from=builder /app /app

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
