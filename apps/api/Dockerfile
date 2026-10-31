# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for Express API in Monorepo
FROM node:lts-alpine AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
RUN npm ci

# Stage 2: Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN npx turbo run build --filter=@jeans-store/api

# Stage 3: Production Runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist

# Secure non-root user
USER node

EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
