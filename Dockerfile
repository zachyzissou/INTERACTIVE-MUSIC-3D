# syntax=docker/dockerfile:1.4
# Optimized multi-stage Dockerfile for Next.js production build

FROM node:18.20.8-bullseye-slim AS deps
WORKDIR /app

# Install system packages first to leverage caching
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && npm install -g npm@10.8.2 \
    && rm -rf /var/lib/apt/lists/*

# Copy only package manifests to install dependencies
COPY package.json package-lock.json .

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm ci --legacy-peer-deps

FROM node:18.20.8-bullseye-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build && npm prune --production

FROM node:18.20.8-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV LOG_DIR=/app/logs

RUN mkdir -p "$LOG_DIR"

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "run", "start"]
