# Multi-stage Dockerfile for Next.js production build

# 1. Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# 2. Build assets
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Run the Next.js app
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built assets and dependencies
COPY --from=builder /app/ .

# Expose the port Next.js listens on
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
