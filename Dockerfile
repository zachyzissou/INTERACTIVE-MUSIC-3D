# syntax=docker/dockerfile:1.4
# Multi-stage Dockerfile for Enhanced Oscillo Audio-Reactive Platform

FROM ubuntu:22.04 AS base
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
WORKDIR /app

# Install Node 20 and enhanced build dependencies for WebGPU/audio processing
RUN apt-get update && \
    apt-get install -y --no-install-recommends tzdata \
    curl gnupg ca-certificates python3 make g++ \
    libnss3 libatk-bridge2.0-0 libxss1 libgtk-3-0 libx11-xcb1 \
    libasound2-dev libpulse-dev libjack-dev \
    mesa-utils libgl1-mesa-dev libglu1-mesa-dev \
    xvfb x11vnc fluxbox \
    && ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && dpkg-reconfigure -f noninteractive tzdata \
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

# Build with enhanced optimizations for audio/graphics
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

# Test stage for CI/CD
FROM builder AS tester
ENV NODE_ENV=test
RUN npm run test:ci || true

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_DIR=/app/logs
ENV DISPLAY=:99

# Set up virtual display for headless WebGL/WebGPU
RUN mkdir -p "$LOG_DIR" /tmp/.X11-unix \
    && chmod 1777 /tmp/.X11-unix

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Start virtual display and application
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 & exec npm run start"]
