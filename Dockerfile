# syntax=docker/dockerfile:1.4
# Multi-stage Dockerfile built on Ubuntu 22.04 for Next.js

FROM ubuntu:22.04 AS base
WORKDIR /app

# Install Node 20 and required build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg ca-certificates python3 make g++ \
    libnss3 libatk-bridge2.0-0 libxss1 libgtk-3-0 libx11-xcb1 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@11.4.2 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV LOG_DIR=/app/logs
RUN mkdir -p "$LOG_DIR"
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "run", "start", "--verbose"]
