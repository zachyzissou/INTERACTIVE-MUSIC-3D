
# Deployment & DevOps Guide

## Immediate Deployment Steps

### 1. Security Patches (CRITICAL - Deploy Immediately)

```bash

## Fix critical security vulnerabilities

npm audit fix
npm audit fix --force


## Verify fixes

npm audit --audit-level=moderate


## Test functionality after updates

npm run dev
npm run build
npm run test
```

### 2. Environment Configuration

```bash

## Verify production environment settings

grep -r "NODE_ENV" package.json  # Should show "production"

grep -r "productionBrowserSourceMaps" next.config.js  # Should be true


## Test production build

npm run build
npm run start  # Now correctly uses NODE_ENV=production

```

### 3. Security Headers Verification

```bash

## Test security headers locally

curl -I http://localhost:3000


## Should see headers


## X-Frame-Options: DENY


## X-Content-Type-Options: nosniff


## Referrer-Policy: origin-when-cross-origin


## Permissions-Policy: camera=(), microphone=(), geolocation=()


```

## Docker Deployment (Recommended)

### Updated Dockerfile

```dockerfile

## Use multi-stage build for optimization

FROM node:20-

WORKDIR /app
COPY package*

RUN npm ci --only=production --legacy-peer-deps

FROM node:20-

WORKDIR /app
COPY package*

RUN npm ci -

COPY . .
RUN npm run build

FROM node:20-

WORKDIR /app
ENV NODE_ENV=production
ENV LOG_DIR=/app/logs

RUN addgroup -

RUN adduser --system --uid 1001 nextjs

COPY -

COPY -

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose Configuration

```yaml

## docker-compose.yml

version: '3.8'

services:
  interactive-music-3d:
    build: .
    ports:
      * "3000:3000"
    environment:
      * NODE_ENV=production
      * LOG_DIR=/app/logs
    volumes:
      * ./logs:/app/logs
      * ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.

```

## GitHub Actions CI/CD

### Workflow Configuration

```yaml

## .github/workflows/deploy.yml

name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      * uses: actions/checkout@v4
      * uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      * run: npm ci --legacy-peer-deps
      * run: npm audit --audit-level=moderate
      * run: npx eslint . --max-warnings=0

  test:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      * uses: actions/checkout@v4
      * uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      * run: npm ci --legacy-peer-deps
      * run: npm run test:unit
      * run: npm run build
      * name: Verify build directory
        run: ls -al .next | head

      # Upload build artifacts
      * uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: .next/

  deploy:
    needs: [security-scan, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      * uses: actions/checkout@v4

      * name: Build and push Docker image
        env:
          DOCKER_BUILDKIT: 1
        run: |
          docker build -t interactive-music-3d:latest .
          # Push to your registry here

      * name: Deploy to production
        run: |
          # Your deployment commands here
          echo "Deploying to production..."
```

## Production Monitoring

### Health Check Endpoint

Create `pages/api/health.ts`:

```typescript

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic health check
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    node_env: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
}
```

### Logging Configuration

Update `src/lib/logger.server.ts`:

```typescript

import fs from 'fs';
import path from 'path';

const logDir = process.env.LOG_DIR || '/app/logs';
const logFile = path.join(logDir, 'app.log');

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

function writeLog(level: string, message: string, metadata?: Record<string,
any>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata && { metadata })
  };

  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to write log file', err);
  }

  // Also log to console for Docker logs
  const output = level === 'error' ? console.error : console.log;
  output(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, metadata || '');
}

export const logger = {
info: (msg: string, meta?: Record<string, any>) => writeLog('info', msg, meta),
warn: (msg: string, meta?: Record<string, any>) => writeLog('warn', msg, meta),
error: (msg: string, meta?: Record<string, any>) => writeLog('error', msg,
meta),
  debug: (msg: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      writeLog('debug', msg, meta);
    }
  }
};
```

## Performance Monitoring

### Core Web Vitals Tracking

Add to `app/layout.tsx`:

```typescript

'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }
  });

  return null;
}
```

## Rollback Procedures

### Automated Rollback

```bash

#!/bin/bash

## rollback.sh


set -e

PREVIOUS_VERSION=${1:-"latest-stable"}

echo "Rolling back to version: $PREVIOUS_VERSION"


## Stop current container

docker stop interactive-

docker rm interactive-music-3d || true


## Start previous version

docker run -d \
  --name interactive-music-3d \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_DIR=/app/logs \
  -v $(pwd)/logs:/app/logs \
  interactive-music-3d:$PREVIOUS_VERSION

echo "Rollback completed successfully"
```

### Manual Rollback

```bash

## 1. Identify current deployment

docker ps | grep interactive-music-3d


## 2. Stop current version

docker stop interactive-

docker rm interactive-music-3d


## 3. Start previous version

docker run -d --name interactive-music-3d \
  --restart unless-stopped \
  -p 3000:3000 \
  interactive-music-3d:previous-tag


## 4. Verify deployment

curl -

```

## Disaster Recovery

### Backup Strategy

```bash

## Daily backup script

#!/bin/bash

DATE=$(date +

BACKUP_DIR="/backups/interactive-music-3d"


## Create backup directory

mkdir -p $BACKUP_DIR


## Backup application data

tar -czf "$BACKUP_DIR/app-data-$DATE.tar.gz" \
  /app/logs \
  /app/uploads \
  /app/config


## Backup database (if applicable)


## pg_dump $DATABASE_URL > "$BACKUP_DIR/database-$DATE.sql"



## Cleanup old backups (keep 30 days)

find $BACKUP_DIR -

```

### Recovery Procedures

1. **Application Recovery**

   ```bash

   # Restore from backup
   tar -xzf /backups/interactive-music-3d/app-data-YYYYMMDD.tar.gz -C /

   # Restart services
   docker-compose up -d
   ```

1. **Database Recovery** (if applicable)

   ```bash

   # Restore database
   psql $DATABASE_URL < /backups/interactive-music-3d/database-YYYYMMDD.sql
   ```

## Security Hardening

### Production Security Checklist

* [ ] Security vulnerabilities fixed (npm audit)
* [ ] Security headers configured
* [ ] HTTPS enabled (Let's Encrypt or CloudFlare)
* [ ] Firewall configured (only ports 80, 443, 22)
* [ ] Log monitoring enabled
* [ ] Intrusion detection configured
* [ ] Regular security updates scheduled
* [ ] Backup and recovery tested

### Ongoing Maintenance

```bash

## Weekly security check

npm audit
docker image prune
docker system prune


## Monthly dependency updates

npm update
npm audit fix


## Quarterly security review


## - Review access logs


## - Update SSL certificates


## - Review firewall rules


## - Test backup/recovery procedures


```
