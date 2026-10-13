# Multi-stage Dockerfile for Express Backend on Google Cloud Run
FROM node:20-alpine AS base
WORKDIR /app

# Stage 1: Build TypeScript
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production Runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Non-root user for cloud security
USER node

EXPOSE 4000

CMD ["node", "dist/index.js"]
