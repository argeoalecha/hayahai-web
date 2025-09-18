# Production Environment Setup Guide

This guide provides step-by-step instructions for configuring production environment variables for the Hayah-AI blog platform.

## 🚀 **Required Environment Variables**

### Core Configuration
```bash
NODE_ENV=production
NEXTAUTH_URL=https://hayah-ai.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require
```

## 📊 **Monitoring & Error Tracking**

### 1. Sentry Setup (Error Tracking)
1. Create account at [sentry.io](https://sentry.io)
2. Create new project for "Next.js"
3. Copy the DSN from project settings
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. Slack Webhooks (Alert Notifications)
For each alert type, create a webhook in your Slack workspace:

#### Database Alerts
1. Go to Slack → Apps → Incoming Webhooks
2. Add to Channel: `#database-alerts`
3. Copy webhook URL
```bash
SLACK_WEBHOOK_DB=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK-FOR-DB
```

#### API Alerts
```bash
SLACK_WEBHOOK_API=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK-FOR-API
```

#### Authentication Alerts
```bash
SLACK_WEBHOOK_AUTH=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK-FOR-AUTH
```

#### Performance Alerts
```bash
SLACK_WEBHOOK_PERF=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK-FOR-PERF
```

#### Security Alerts
```bash
SLACK_WEBHOOK_SEC=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK-FOR-SEC
```

## 🔐 **Authentication Providers**

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://hayah-ai.com/api/auth/callback/google`
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### GitHub OAuth
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth app
3. Authorization callback URL: `https://hayah-ai.com/api/auth/callback/github`
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 📎 **File Upload (UploadThing)**

1. Create account at [uploadthing.com](https://uploadthing.com)
2. Create new app
3. Copy API keys from dashboard
```bash
UPLOADTHING_SECRET=sk_live_your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## 📧 **Email Service (Resend)**

1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Create API key
```bash
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@hayah-ai.com
```

## 📈 **Analytics**

### Google Analytics 4
1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID
```bash
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Performance Monitoring
```bash
# WebPageTest API (optional)
WPT_API_KEY=your-webpagetest-api-key

# Custom metrics endpoint (optional)
METRICS_ENDPOINT=https://your-metrics-endpoint.com/api/metrics
METRICS_API_KEY=your-metrics-api-key
```

## 🛡️ **Security Configuration**

### Feature Flags
```bash
ENABLE_COMMENTS=true
ENABLE_ANALYTICS=true
```

### Performance Limits
```bash
MAX_FILE_SIZE=10485760  # 10MB
RATE_LIMIT_MAX=100      # requests per window
```

### Critical Alerts
```bash
CRITICAL_ALERT_EMAIL=admin@hayah-ai.com
```

## 🚀 **Vercel Deployment Setup**

### 1. Environment Variables in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables above for "Production" environment
3. Ensure sensitive variables are encrypted

### 2. Domain Configuration
1. Add custom domain: `hayah-ai.com`
2. Configure DNS:
   - A record: `185.199.108.153`
   - AAAA record: `2606:50c0:8000::153`
3. Enable HTTPS (automatic with Vercel)

### 3. Build Configuration
Ensure these are set in Vercel:
- Node.js Version: 18.x
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `.next`

## 🔍 **Validation Commands**

### Before Deployment
```bash
# Validate environment
node scripts/validate-env.js

# Run all tests
npm run test:all

# Security audit
npm run security:scan

# Type checking
npm run type-check
```

### After Deployment
```bash
# Verify deployment
node scripts/verify-deployment.js

# Check health
curl https://hayah-ai.com/api/health

# Test alerts (development only)
# This will test the alerting system
```

## 🚨 **Security Checklist**

- [ ] All secrets are at least 32 characters long
- [ ] No test/demo values in production
- [ ] Database uses SSL connection
- [ ] OAuth redirect URIs are correct
- [ ] Slack channels exist for all webhook URLs
- [ ] Domain is verified for email service
- [ ] HTTPS is enabled and working
- [ ] Environment variables are encrypted in Vercel

## 📚 **Additional Resources**

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

## 🆘 **Troubleshooting**

### Common Issues

1. **Environment variables not loading**
   - Check variable names match exactly
   - Ensure no extra spaces in values
   - Restart Vercel function after changes

2. **Database connection fails**
   - Verify SSL mode is enabled
   - Check IP whitelist settings
   - Test connection string format

3. **OAuth authentication fails**
   - Verify redirect URIs are exact matches
   - Check client ID/secret are correct
   - Ensure OAuth app is not in test mode

4. **Alerts not sending**
   - Test webhook URLs manually
   - Check Slack channel permissions
   - Verify environment variables are set

For additional support, check the project documentation or create an issue in the repository.