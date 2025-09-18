# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hayah-AI Interactive Blog Platform - A bulletproof, error-free blog platform for Technology, Travel, and Sites content. This is an 8-week project focused on zero-tolerance error prevention using Next.js 14 with TypeScript.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js
- **Hosting**: Vercel (Primary), Netlify (Backup)
- **File Storage**: Uploadthing
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Error Tracking**: Sentry

## Common Development Commands

### Build and Development
```bash
# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format:check

# Bundle analysis
npm run analyze
```

### Testing
```bash
# Run all tests
npm run test:all

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Smoke tests for staging
npm run test:smoke:staging
```

### Database Operations
```bash
# Run migrations
npm run db:migrate:deploy

# Rollback migrations (preview mode)
npm run db:migrate:rollback -- --preview

# Seed staging data
npm run db:seed:staging

# Database health check
npm run health:external

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Security and Monitoring
```bash
# Security audit
npm audit --audit-level moderate
npm run security:scan

# Environment validation
npm run env:validate

# Health checks
npm run health:comprehensive
npm run health:check:staging
npm run health:check:production
```

### Deployment
```bash
# Pre-deployment checks
npm run pre-deploy:checks

# Create backup before deployment
npm run backup:create

# Deploy to staging
vercel --prod --env=staging

# Deploy to production
vercel --prod

# Verify deployment
npm run verify:deployment
```

## Architecture Overview

### Error Prevention Philosophy
The codebase follows a "Defense in Depth" approach with multi-layer error prevention:

1. **Type Safety First**: TypeScript strict mode with comprehensive type definitions
2. **Validation Everywhere**: Input validation at API, database, and UI levels
3. **Defensive Coding**: Error boundaries, fallbacks, graceful degradation
4. **Fail-Safe Defaults**: All components designed to fail gracefully

### Key Directories and Structures

- `reference_docs/` - Contains comprehensive technical specifications:
  - `hayah-ai_dotcom.md` - Main project specification with error-proof architecture
  - `api-documentation.md` - Complete API documentation with error handling
  - `deployment-runbook.md` - Production deployment and maintenance procedures
  - `admin-user-manual.md` - Admin interface documentation
  - `performance-optimization-guide.md` - Performance best practices

### Database Design
Uses Prisma ORM with PostgreSQL, featuring:
- Comprehensive schema validation
- Soft deletes with `deletedAt` timestamps
- Audit trails with `ActivityLog` model
- Performance indexes on critical queries
- Connection pooling and retry logic

### API Architecture
- RESTful API endpoints with comprehensive error handling
- Rate limiting per endpoint type
- JWT-based authentication with role-based access control
- Validation using Zod schemas
- Automatic error reporting and monitoring

### Frontend Architecture
- Next.js App Router with TypeScript
- Error boundaries at page and component levels
- Optimistic updates with fallback mechanisms
- Progressive enhancement for core functionality
- Comprehensive input validation and sanitization

## Error Handling Standards

### Error Boundaries
All components should be wrapped with error boundaries that:
- Log errors with unique IDs for tracking
- Provide user-friendly fallback UI
- Report errors to Sentry in production
- Include retry mechanisms where appropriate

### API Error Responses
All API endpoints follow a standardized error format:
```typescript
interface ErrorResponse {
  error: {
    code: string           // Error code (e.g., "VALIDATION_001")
    message: string        // Human-readable message
    details?: string       // Technical details (dev mode only)
    field?: string         // Field name for validation errors
    timestamp: string      // ISO 8601 timestamp
    requestId: string      // Unique request identifier
    path: string          // API endpoint path
  }
}
```

### Database Error Handling
- All database operations wrapped in try-catch blocks
- Transaction rollback on failures
- Connection pool monitoring and recovery
- Automatic retry logic for transient failures

## Development Best Practices

### Code Quality
- Always run `npm run type-check` and `npm run lint` before commits
- Use defensive programming patterns
- Implement proper input validation at all layers
- Include comprehensive error handling in all functions

### Testing Strategy
- Unit tests for all utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user journeys
- Performance tests for database queries

### Security Considerations
- Never commit secrets or API keys
- Always validate and sanitize user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization checks
- Follow OWASP security guidelines

## Deployment and Monitoring

### Deployment Process
1. Run pre-deployment checks
2. Create database backup
3. Deploy to staging first
4. Run smoke tests
5. Deploy to production
6. Monitor for 5 minutes post-deployment
7. Verify all health checks pass

### Monitoring and Alerting
- Application health checks at `/api/health`
- Database connection monitoring
- Error rate tracking (alert if > 5%)
- Response time monitoring (alert if p95 > 5s)
- User experience monitoring with analytics

### Rollback Procedures
Automatic rollback triggers:
- Error rate > 5% for 5 minutes
- Health check failures > 3 in 1 minute
- Response time p95 > 5 seconds for 5 minutes

Manual rollback: `npm run rollback:auto`

## Environment Configuration

The project uses environment validation with Zod schemas. Required environment variables are documented in the reference docs. Always run `npm run env:validate` to ensure proper configuration.

## Important Notes

- This is a documentation-heavy project with extensive reference materials
- Error prevention is the primary concern - every component should fail gracefully
- Follow the established patterns in the reference documentation
- Always prioritize user experience and system reliability over feature velocity
- The project follows a zero-tolerance approach to production errors
- add to memory