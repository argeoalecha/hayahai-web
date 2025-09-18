# Hayah-AI Blog Platform Deployment Runbook

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedures](#deployment-procedures)
3. [Rollback Procedures](#rollback-procedures)
4. [Monitoring & Health Checks](#monitoring--health-checks)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Emergency Procedures](#emergency-procedures)
7. [Maintenance Tasks](#maintenance-tasks)

---

## Pre-Deployment Checklist

### 🔍 Code Quality Verification
```bash
# Run complete test suite
npm run test:all
npm run test:e2e
npm run test:performance

# Security audit
npm audit --audit-level moderate
npm run security:scan

# Type checking and linting
npm run type-check
npm run lint
npm run format:check

# Bundle analysis
npm run analyze
```

### 🗄️ Database Preparation
```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Test migrations on staging
npm run db:migrate:deploy -- --preview
npm run db:seed:staging

# Verify migration rollback
npm run db:migrate:rollback -- --preview
```

### 🔧 Environment Configuration
```bash
# Validate environment variables
npm run env:validate

# Check external service connectivity
npm run health:external

# Verify SSL certificates
openssl x509 -in cert.pem -text -noout
```

### 📊 Performance Baseline
```bash
# Capture current performance metrics
npm run lighthouse:baseline
npm run load:test:baseline

# Monitor resource usage
htop
iostat 1 5
```

---

## Deployment Procedures

### 🚀 Standard Deployment

#### 1. Staging Deployment
```bash
#!/bin/bash
set -e

echo "Starting staging deployment..."

# Switch to staging branch
git checkout staging
git pull origin staging

# Install dependencies
npm ci --production

# Run database migrations
npm run db:migrate:deploy

# Build application
NODE_ENV=staging npm run build

# Deploy to staging environment
vercel --prod --env=staging

# Run smoke tests
npm run test:smoke:staging

echo "Staging deployment complete!"
```

#### 2. Production Deployment
```bash
#!/bin/bash
set -e

echo "Starting production deployment..."

# Pre-deployment checks
npm run pre-deploy:checks

# Create backup
npm run backup:create

# Set maintenance mode (optional for zero-downtime)
# npm run maintenance:enable

# Deploy to production
git checkout main
git pull origin main

# Install production dependencies
npm ci --production --frozen-lockfile

# Build optimized bundle
NODE_ENV=production npm run build

# Run database migrations
npm run db:migrate:deploy

# Deploy to Vercel
vercel --prod

# Disable maintenance mode
# npm run maintenance:disable

# Run post-deployment verification
npm run verify:deployment

echo "Production deployment complete!"
```

### 🔄 Zero-Downtime Deployment

#### Blue-Green Deployment Script
```bash
#!/bin/bash
set -e

CURRENT_ENV=$(curl -s https://api.hayah-ai.com/health | jq -r '.environment')
NEW_ENV=$([ "$CURRENT_ENV" = "blue" ] && echo "green" || echo "blue")

echo "Current environment: $CURRENT_ENV"
echo "Deploying to: $NEW_ENV"

# Deploy to inactive environment
vercel --prod --env=$NEW_ENV

# Health check new environment
npm run health:check:$NEW_ENV

# Switch traffic gradually
npm run traffic:switch:gradual $NEW_ENV

# Monitor for 5 minutes
npm run monitor:deployment --duration=300

echo "Blue-green deployment complete!"
```

### 🔧 Environment-Specific Configurations

#### Staging Environment
```yaml
# vercel.staging.json
{
  "env": {
    "NODE_ENV": "staging",
    "DATABASE_URL": "@database-url-staging",
    "NEXTAUTH_URL": "https://staging.hayah-ai.com",
    "REDIS_URL": "@redis-url-staging"
  },
  "build": {
    "env": {
      "ANALYZE": "true"
    }
  }
}
```

#### Production Environment
```yaml
# vercel.production.json
{
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url-production",
    "NEXTAUTH_URL": "https://hayah-ai.com",
    "REDIS_URL": "@redis-url-production"
  },
  "regions": ["cle1", "iad1"],
  "functions": {
    "app/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

---

## Rollback Procedures

### 🔙 Automatic Rollback Triggers
```typescript
// scripts/auto-rollback.ts
interface RollbackTrigger {
  errorRate: number        // > 5% error rate
  responseTime: number     // > 5 seconds p95
  healthCheck: boolean     // Health check fails
  userReports: number      // > 10 user reports in 5 minutes
}

async function checkRollbackTriggers(): Promise<boolean> {
  const metrics = await getMetrics()
  
  if (metrics.errorRate > 0.05) {
    await triggerRollback('High error rate detected')
    return true
  }
  
  if (metrics.responseTime > 5000) {
    await triggerRollback('High response time detected')
    return true
  }
  
  const healthStatus = await checkHealth()
  if (!healthStatus.healthy) {
    await triggerRollback('Health check failed')
    return true
  }
  
  return false
}
```

### 🔄 Manual Rollback Procedure
```bash
#!/bin/bash
set -e

echo "Starting rollback procedure..."

# Get last known good deployment
LAST_GOOD_DEPLOYMENT=$(vercel ls --meta.status=ready | head -n2 | tail -n1 | cut -d' ' -f1)
echo "Rolling back to: $LAST_GOOD_DEPLOYMENT"

# Create emergency backup of current state
npm run backup:emergency

# Rollback database if needed
if [ "$1" = "--with-db" ]; then
  echo "Rolling back database..."
  npm run db:rollback:to-version $2
fi

# Promote previous deployment
vercel promote $LAST_GOOD_DEPLOYMENT

# Verify rollback
npm run verify:rollback

# Alert team
npm run alert:rollback-complete

echo "Rollback complete!"
```

### 🗄️ Database Rollback
```sql
-- Emergency database rollback procedure
BEGIN;

-- Create rollback point
SAVEPOINT rollback_point;

-- Identify migration to rollback to
SELECT version, name, applied_at 
FROM _prisma_migrations 
ORDER BY applied_at DESC 
LIMIT 10;

-- Rollback to specific version (replace VERSION with actual version)
-- This should be automated through Prisma migrate
UPDATE _prisma_migrations 
SET rolled_back_at = NOW() 
WHERE version = 'VERSION';

-- Verify rollback
SELECT * FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL;

COMMIT;
```

---

## Monitoring & Health Checks

### 🏥 Health Check Endpoints

#### Application Health
```bash
# Basic health check
curl https://hayah-ai.com/api/health

# Detailed health check
curl https://hayah-ai.com/api/health/detailed

# Database health
curl https://hayah-ai.com/api/health/database

# External services health
curl https://hayah-ai.com/api/health/services
```

#### Expected Health Responses
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production",
  "version": "1.2.3",
  "uptime": 86400,
  "checks": {
    "database": { "status": "healthy", "responseTime": 45 },
    "redis": { "status": "healthy", "responseTime": 12 },
    "storage": { "status": "healthy", "freeSpace": "85%" },
    "memory": { "status": "healthy", "usage": "45%" }
  }
}
```

### 📊 Monitoring Dashboards

#### Key Metrics to Monitor
```typescript
interface SystemMetrics {
  application: {
    responseTime: number      // p95 < 2000ms
    errorRate: number        // < 1%
    throughput: number       // requests/second
    activeUsers: number      // concurrent users
  }
  infrastructure: {
    cpuUsage: number         // < 80%
    memoryUsage: number      // < 80%
    diskUsage: number        // < 85%
    networkLatency: number   // < 100ms
  }
  business: {
    pageViews: number
    newUsers: number
    conversionRate: number
    revenueImpact: number
  }
}
```

#### Alerting Thresholds
```yaml
# alerts.yml
alerts:
  critical:
    - metric: error_rate
      threshold: 5%
      window: 5m
      channels: [slack, pagerduty]
    
    - metric: response_time_p95
      threshold: 5000ms
      window: 5m
      channels: [slack, pagerduty]
    
    - metric: health_check_failures
      threshold: 3
      window: 1m
      channels: [slack, pagerduty, sms]
  
  warning:
    - metric: cpu_usage
      threshold: 80%
      window: 10m
      channels: [slack]
    
    - metric: memory_usage
      threshold: 85%
      window: 10m
      channels: [slack]
```

---

## Troubleshooting Guide

### 🔧 Common Issues & Solutions

#### Issue: High Error Rate
**Symptoms:**
- Error rate > 5%
- Multiple 500 status codes
- User complaints

**Diagnosis:**
```bash
# Check error logs
vercel logs --follow
kubectl logs -f deployment/hayah-ai

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check external service status
curl -I https://api.external-service.com/health
```

**Solutions:**
1. **Database Connection Issues:**
   ```bash
   # Restart database connections
   npm run db:pool:restart
   
   # Scale up database
   heroku pg:resize $DATABASE_URL --size=standard-2
   ```

2. **Memory Leaks:**
   ```bash
   # Restart application instances
   vercel redeploy --prod
   
   # Monitor memory usage
   npm run monitor:memory
   ```

3. **External Service Failures:**
   ```bash
   # Enable circuit breaker
   npm run circuit-breaker:enable
   
   # Use cached responses
   npm run cache:fallback:enable
   ```

#### Issue: Slow Response Times
**Symptoms:**
- Response time > 5 seconds
- Timeout errors
- User experience degradation

**Diagnosis:**
```bash
# Profile slow queries
npm run db:slow-queries

# Check CDN performance
curl -H "Cache-Control: no-cache" https://hayah-ai.com

# Monitor function execution time
vercel functions inspect
```

**Solutions:**
1. **Database Optimization:**
   ```sql
   -- Identify slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_posts_category_published 
   ON posts(category, published, created_at);
   ```

2. **Cache Optimization:**
   ```bash
   # Clear and rebuild cache
   npm run cache:clear
   npm run cache:warm
   
   # Optimize cache headers
   npm run cache:optimize
   ```

3. **CDN Configuration:**
   ```bash
   # Purge CDN cache
   vercel env rm CACHE_VERSION
   vercel env add CACHE_VERSION $(date +%s)
   ```

#### Issue: Database Connection Failures
**Symptoms:**
- "Connection refused" errors
- Database timeout errors
- Authentication failures

**Diagnosis:**
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool status
npm run db:pool:status

# Verify credentials
npm run db:auth:test
```

**Solutions:**
1. **Connection Pool Issues:**
   ```bash
   # Reset connection pool
   npm run db:pool:reset
   
   # Increase pool size
   export DATABASE_POOL_SIZE=20
   npm run app:restart
   ```

2. **Database Overload:**
   ```bash
   # Scale database
   heroku pg:resize --size=standard-4
   
   # Add read replicas
   heroku addons:create heroku-postgresql:standard-2 --follow
   ```

#### Issue: Authentication Problems
**Symptoms:**
- Login failures
- Token validation errors
- Session timeouts

**Diagnosis:**
```bash
# Check JWT configuration
npm run auth:debug

# Verify NextAuth configuration
npm run nextauth:test

# Check session store
redis-cli info keyspace
```

**Solutions:**
1. **JWT Issues:**
   ```bash
   # Rotate JWT secret
   vercel env rm NEXTAUTH_SECRET
   vercel env add NEXTAUTH_SECRET $(openssl rand -base64 32)
   ```

2. **Session Store Issues:**
   ```bash
   # Clear Redis sessions
   redis-cli FLUSHDB
   
   # Restart Redis
   heroku addons:restart heroku-redis
   ```

### 🚨 Emergency Response Procedures

#### Immediate Response Checklist
```bash
# 1. Assess severity (< 2 minutes)
npm run incident:assess

# 2. Enable maintenance mode if needed (< 5 minutes)
npm run maintenance:enable --message="We're experiencing technical difficulties"

# 3. Notify team (< 5 minutes)
npm run alert:incident --severity=critical

# 4. Begin investigation (< 10 minutes)
npm run logs:collect --since=30m
npm run metrics:snapshot

# 5. Implement fix or rollback (< 30 minutes)
npm run rollback:auto || npm run fix:apply

# 6. Verify resolution (< 5 minutes)
npm run verify:fix

# 7. Disable maintenance mode (< 2 minutes)
npm run maintenance:disable

# 8. Post-incident communication (< 1 hour)
npm run incident:report:generate
```

#### Incident Severity Levels
```typescript
enum IncidentSeverity {
  P0 = 'critical',    // Service completely down
  P1 = 'high',        // Major feature unavailable
  P2 = 'medium',      // Minor feature degraded
  P3 = 'low'          // Performance impact only
}

interface IncidentResponse {
  responseTime: {
    P0: '15 minutes',
    P1: '1 hour',
    P2: '4 hours',
    P3: '24 hours'
  }
  escalation: {
    P0: ['oncall-engineer', 'lead-engineer', 'engineering-manager'],
    P1: ['oncall-engineer', 'lead-engineer'],
    P2: ['oncall-engineer'],
    P3: ['assigned-engineer']
  }
}
```

---

## Maintenance Tasks

### 🔄 Regular Maintenance Schedule

#### Daily Tasks
```bash
#!/bin/bash
# daily-maintenance.sh

# Health check
npm run health:comprehensive

# Log rotation
npm run logs:rotate

# Cache cleanup
npm run cache:cleanup

# Performance monitoring
npm run metrics:collect

# Security scan
npm run security:daily-scan
```

#### Weekly Tasks
```bash
#!/bin/bash
# weekly-maintenance.sh

# Database maintenance
npm run db:vacuum
npm run db:analyze
npm run db:reindex

# Dependency updates
npm audit
npm update

# Performance optimization
npm run optimize:images
npm run optimize:database

# Backup verification
npm run backup:verify
```

#### Monthly Tasks
```bash
#!/bin/bash
# monthly-maintenance.sh

# Full security audit
npm run security:full-audit

# Dependency upgrade
npm run deps:major-update

# Performance baseline update
npm run performance:baseline:update

# Disaster recovery test
npm run dr:test

# Capacity planning review
npm run capacity:review
```

### 📊 Performance Optimization

#### Database Optimization
```sql
-- Monthly database maintenance
VACUUM ANALYZE;
REINDEX DATABASE hayah_blog;

-- Update statistics
UPDATE pg_stats SET;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0;
```

#### Image Optimization
```bash
# Optimize all images
npm run images:optimize --quality=85

# Generate WebP variants
npm run images:webp

# Update CDN cache
npm run cdn:cache:update
```

#### Code Optimization
```bash
# Bundle analysis
npm run analyze:bundle

# Dead code elimination
npm run code:dead-code-elimination

# Dependency audit
npm run deps:audit
```

### 🔐 Security Maintenance

#### Security Checklist
```bash
# SSL certificate renewal
certbot renew --dry-run

# Security headers audit
npm run security:headers:check

# Vulnerability scanning
npm audit --audit-level high
npm run security:cve-scan

# Access review
npm run access:review

# Backup encryption verification
npm run backup:encryption:verify
```

#### Log Analysis
```bash
# Analyze access logs for suspicious activity
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -20

# Check for failed authentication attempts
grep "401\|403" access.log | tail -100

# Monitor API usage patterns
grep "/api/" access.log | awk '{print $7}' | sort | uniq -c | sort -nr
```

This deployment runbook provides comprehensive procedures for safely deploying, monitoring, and maintaining the Hayah-AI blog platform in production environments.
