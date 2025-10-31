# Staging Deployment Guide - Hayah-AI Blog Platform

**Status:** Ready for Vercel Staging Deployment
**Date:** November 1, 2025

---

## ✅ Pre-Deployment Checklist

- [x] Prisma schema updated to PostgreSQL
- [x] NEXTAUTH_SECRET generated
- [x] .env.production template created
- [ ] Vercel Postgres database created
- [ ] Environment variables configured in Vercel
- [ ] Initial deployment completed

---

## 📋 Step-by-Step Deployment Instructions

### **Step 1: Create Vercel Postgres Database**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import this repository from GitHub (if not already done)
3. Go to your project → **Storage** tab
4. Click **"Create Database"** → Select **"Postgres"**
5. Name: `hayahai-blog-db` (or your preference)
6. Select region closest to your users
7. Click **"Create"**

### **Step 2: Copy Database Connection Strings**

After database creation, Vercel will show environment variables. Copy these values:

```
POSTGRES_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb
POSTGRES_PRISMA_URL=postgres://default:xxx@xxx-pooler.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb
```

### **Step 3: Configure Environment Variables in Vercel**

Go to your project → **Settings** → **Environment Variables**

**REQUIRED Variables (Add these now):**

| Variable Name | Value | Source |
|---------------|-------|--------|
| `DATABASE_URL` | `POSTGRES_PRISMA_URL` from Vercel | Copy from Vercel Postgres |
| `POSTGRES_URL_NON_POOLING` | `POSTGRES_URL_NON_POOLING` from Vercel | Copy from Vercel Postgres |
| `NEXTAUTH_URL` | Your Vercel app URL (e.g., `https://hayahai-blog.vercel.app`) | Will be shown after first deploy |
| `NEXTAUTH_SECRET` | `9a9d424b46c81a6bd43cd36fdb752876f1c0f1f5e9c9988c3a3a092a32742326` | Pre-generated |
| `NODE_ENV` | `production` | Manual entry |

**OPTIONAL Variables (Can add later):**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth
- `SENTRY_DSN` - For error tracking
- `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` - For file uploads
- `RESEND_API_KEY` - For email notifications

### **Step 4: Update Local Environment**

Update your local `.env` file with the database connection:

```bash
# Copy POSTGRES_PRISMA_URL from Vercel to DATABASE_URL
DATABASE_URL="postgres://default:xxx@xxx-pooler.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&sslmode=require"

# Copy POSTGRES_URL_NON_POOLING
POSTGRES_URL_NON_POOLING="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"

# Use the same secret
NEXTAUTH_SECRET="9a9d424b46c81a6bd43cd36fdb752876f1c0f1f5e9c9988c3a3a092a32742326"
```

### **Step 5: Run Database Migrations Locally First**

```bash
# Generate Prisma client with PostgreSQL
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# OR run migrations (if you prefer migration files)
npx prisma migrate deploy
```

**Expected output:**
```
✔ Generated Prisma Client
✔ Database synchronized with schema
```

### **Step 6: Verify Local Setup**

```bash
# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

### **Step 7: Deploy to Vercel**

**Option A: Deploy via Vercel Dashboard (Recommended)**
1. Go to your project in Vercel
2. Go to **Deployments** tab
3. Click **"Redeploy"** or push to your main branch

**Option B: Deploy via CLI**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### **Step 8: Post-Deployment Verification**

After deployment completes:

1. **Check Deployment Status**
   - Vercel will show deployment URL (e.g., `https://hayahai-blog.vercel.app`)
   - Check build logs for any errors

2. **Update NEXTAUTH_URL**
   - Go to Vercel → Settings → Environment Variables
   - Update `NEXTAUTH_URL` to your actual deployment URL
   - Redeploy for changes to take effect

3. **Test Health Endpoint**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

4. **Test Key Pages**
   - Homepage: `https://your-app.vercel.app/`
   - Blog: `https://your-app.vercel.app/blog`
   - Health: `https://your-app.vercel.app/api/health`

---

## 🔍 Troubleshooting

### Build Fails with Database Error
**Problem:** Can't connect to database during build
**Solution:** Ensure `DATABASE_URL` is set in Vercel environment variables

### "Module not found" Errors
**Problem:** Missing dependencies
**Solution:** Vercel should auto-install. Check `package.json` is committed

### Prisma Client Not Generated
**Problem:** Build fails at Prisma step
**Solution:** Build command includes `npx prisma generate` - check build logs

### 500 Errors After Deployment
**Problem:** Runtime errors
**Solution:**
- Check Vercel function logs: Project → Logs
- Verify all required env vars are set
- Check database connection

### Database Connection Pool Errors
**Problem:** Too many connections
**Solution:** Use `POSTGRES_PRISMA_URL` (with pgbouncer) for `DATABASE_URL`

---

## 📊 Monitoring Your Staging Deployment

### Vercel Dashboard
- **Analytics**: View traffic and performance
- **Logs**: Real-time function logs
- **Deployments**: History of all deploys

### Health Check Endpoint
```bash
# Monitor health
watch -n 30 'curl https://your-app.vercel.app/api/health'
```

### Key Metrics to Watch
- Response times (target: < 2s)
- Error rates (target: < 1%)
- Database query performance
- Build times

---

## 🎯 Next Steps After Staging

Once staging is running successfully:

1. **Test All Features**
   - User registration
   - Login/logout
   - Blog post viewing
   - Admin access (if available)

2. **Configure Optional Services**
   - Set up Sentry for error tracking
   - Add OAuth providers
   - Configure file upload service

3. **Performance Testing**
   - Run Lighthouse audits
   - Test on mobile devices
   - Check Core Web Vitals

4. **Prepare for Production**
   - Fix TypeScript errors
   - Add comprehensive tests
   - Complete missing features
   - Security audit

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project Docs**: See `reference_docs/` folder

---

**Generated:** November 1, 2025
**Status:** Ready for staging deployment
**Contact:** Development Team
