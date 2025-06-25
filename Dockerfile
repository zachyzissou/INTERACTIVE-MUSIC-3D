# syntax=docker/dockerfile:1.4
# Optimized multi-stage Dockerfile for Next.js production build

FROM node:18-alpine AS deps
WORKDIR /app

# Install system packages first to leverage caching
RUN apk add --no-cache python3 make g++

# Copy only package manifests to install dependencies
COPY package.json package-lock.json .

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm ci

FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build && npm prune --production

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "run", "start"]
