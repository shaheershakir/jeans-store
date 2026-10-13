# Multi-stage Dockerfile for Next.js Admin Dashboard in Monorepo
FROM node:20-alpine AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/admin/package.json ./apps/admin/
RUN npm ci

# Stage 2: Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_KEY
ENV NEXT_PUBLIC_ADMIN_API_KEY=$NEXT_PUBLIC_ADMIN_API_KEY

RUN npx turbo run build --filter=@jeans-store/admin

# Stage 3: Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and Next.js standalone bundle
COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "apps/admin/server.js"]
