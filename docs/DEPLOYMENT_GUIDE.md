# Deployment Guide

## Prerequisites

- Supabase project configured and running
- Environment variables set up
- Git repository initialized
- Deployment platform account (Vercel, Netlify, or similar)

## Environment Variables

### Required Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### Optional Variables

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Deployment Platforms

### Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Configure Environment Variables

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

#### 4. Deploy

```bash
vercel --prod
```

#### 5. Configure Domain

- Go to Vercel dashboard
- Navigate to your project
- Add custom domain in Settings → Domains

### Netlify

#### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### 2. Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### 3. Deploy

```bash
netlify deploy --prod
```

#### 4. Configure Environment Variables

- Go to Netlify dashboard
- Navigate to Site settings → Environment variables
- Add all required variables

### Docker

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --app/next.config.ts ./
COPY --from=builder --app/package.json ./
RUN npx next telemetry disable
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["npm", "start"]
```

#### 2. Build and Run

```bash
docker build -t ielts-reading-app .
docker run -p 3000:3000 ielts-reading-app
```

## Post-Deployment Checklist

### Database

- [ ] Verify all migrations ran successfully
- [ ] Check RLS policies are enabled
- [ ] Test database connections
- [ ] Verify indexes are created
- [ ] Enable Point-in-Time Recovery backups

### Authentication

- [ ] Test email/password authentication
- [ ] Test Google OAuth (if configured)
- [ ] Test guest mode
- [ ] Verify session management
- [ ] Test password reset flow

### Data Sync

- [ ] Test reading progress sync
- [ ] Test saved quotes sync
- [ ] Test highlights sync
- [ ] Test AI conversations sync
- [ ] Test offline fallback

### Performance

- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Test page load times
- [ ] Monitor database query performance
- [ ] Set up performance monitoring

### Security

- [ ] Enable HTTPS
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Monitor for suspicious activity
- ] Enable security headers

### Monitoring

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure analytics (Google Analytics, Plausible)
- [ ] Set up uptime monitoring
- [ ] Configure database alerts
- [ ] Set up backup notifications

## Environment-Specific Configuration

### Development

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
```

### Production

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Database Backups

### Automatic Backups

Supabase provides automatic daily backups. Verify these are enabled:
1. Go to Supabase dashboard
2. Navigate to Database → Backups
3. Ensure daily backups are enabled
4. Set retention period (recommended: 30 days)

### Manual Backups

For critical deployments, create manual backups:
1. Go to Database → Backups
2. Click "Create backup"
3. Name and describe the backup
4. Store backup securely

## Rollback Procedure

### Application Rollback

If deployment fails:
```bash
# Vercel
vercel rollback

# Netlify
netlify deploy --prod --build=false
```

### Database Rollback

If database changes cause issues:
1. Go to Database → Backups
2. Select the backup before the issue
3. Click "Restore"
4. Verify data integrity

## Scaling Considerations

### Database Scaling

Monitor these metrics in Supabase:
- Database size
- Query performance
- Connection count
- API rate limits

Upgrade your Supabase plan if:
- Database size exceeds 500MB
- Query latency > 500ms
- Connection count > 50 concurrent
- API rate limits frequently hit

### Application Scaling

- Enable edge functions for faster response times
- Use CDN for static assets
- Implement caching strategies
- Consider server-side rendering for SEO-critical pages

## Troubleshooting

### Build Failures

If build fails:
1. Check build logs for specific errors
2. Verify all dependencies are installed
3. Ensure environment variables are set
4. Check for TypeScript errors locally

### Runtime Errors

If app crashes after deployment:
1. Check server logs
2. Verify database connectivity
3. Test authentication flow
4. Check for missing environment variables

### Performance Issues

If app is slow:
1. Enable database query logging
2. Check for N+1 queries
3. Verify indexes are being used
4. Consider implementing caching
5. Monitor CDN hit rates

## Maintenance

### Regular Tasks

- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Review and optimize database queries
- Annually: Review and update security policies

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Test after updates
npm run build
npm run dev
```

## Support

For issues related to:
- **Supabase**: [Supabase Support](https://supabase.com/support)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Netlify**: [Netlify Documentation](https://docs.netlify.com)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
