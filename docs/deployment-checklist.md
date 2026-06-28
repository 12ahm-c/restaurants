# Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Set `NODE_ENV=production`
- [ ] Configure `MONGODB_URI` (MongoDB Atlas or self-hosted)
- [ ] Configure `REDIS_URL` (Redis Cloud or self-hosted)
- [ ] Generate strong `JWT_SECRET` (min 32 chars)
- [ ] Generate strong `JWT_REFRESH_SECRET` (min 32 chars)
- [ ] Set `CORS_ORIGIN` to production domain
- [ ] Configure rate limiting (`RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_MAX`)

### Security
- [ ] Enable HTTPS (TLS certificates)
- [ ] Set secure cookie flags (`secure: true`, `sameSite: 'strict'`)
- [ ] Configure CSP headers (Helmet)
- [ ] Review CORS origins (no wildcards in production)
- [ ] Set MongoDB auth and IP whitelist
- [ ] Set Redis password and IP whitelist

### Services
- [ ] Configure WhatsApp Business API (optional)
- [ ] Configure SMTP for email (optional)
- [ ] Configure Sentry DSN (optional)

## Deployment Steps

### Backend
1. [ ] Run `npm install` in `apps/backend`
2. [ ] Run `npm run build` to compile TypeScript
3. [ ] Run `npm run typecheck` to verify types
4. [ ] Run `npm test` to verify tests pass
5. [ ] Start with `npm run start` or use PM2/systemd

### Frontend
1. [ ] Run `npm install` in `apps/frontend`
2. [ ] Run `npm run build` to create production bundle
3. [ ] Deploy `dist/` folder to CDN or static hosting
4. [ ] Configure SPA routing (redirect all routes to index.html)

### Database
1. [ ] Ensure MongoDB is accessible
2. [ ] Ensure Redis is accessible
3. [ ] Run initial backup

## Post-Deployment

### Verification
- [ ] Health check: `GET /health` returns 200
- [ ] Metrics: `GET /health/metrics` returns data
- [ ] Login works: `POST /v1/auth/login`
- [ ] API responds: `GET /v1/dashboard/employee`

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error alerts (Sentry)
- [ ] Set up log aggregation (optional)
- [ ] Monitor MongoDB performance

### Backup
- [ ] Verify backup scripts work
- [ ] Schedule daily backups
- [ ] Test restore procedure

## Rollback Plan

1. [ ] Keep previous version running
2. [ ] Database backup before migration
3. [ ] Monitor error rates after deployment
4. [ ] Have rollback script ready

## Production Environment Variables

```env
# Server
NODE_ENV=production
PORT=3001

# MongoDB (use connection string with auth)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/restomanager

# Redis (use connection string with auth)
REDIS_URL=rediss://user:pass@redis.cloud.com:6380

# JWT (generate strong secrets)
JWT_SECRET=your-32-char-min-secret-here
JWT_REFRESH_SECRET=your-32-char-min-refresh-secret-here

# CORS (production domain only)
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
```

## Docker Deployment (Optional)

```dockerfile
# Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]

# Frontend
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## PM2 Deployment (Optional)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd apps/backend
pm2 start dist/server.js --name restomanager-api

# Save and auto-restart
pm2 save
pm2 startup
```
