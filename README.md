# Hayah-AI Blog Platform

A bulletproof, error-free blog platform for Technology, Travel, and Sites content built with zero-tolerance error prevention methodology.

## 🛡️ Error Prevention Philosophy

This project follows a "Defense in Depth" approach with multi-layer error prevention:

1. **Type Safety First**: TypeScript strict mode with comprehensive type definitions
2. **Validation Everywhere**: Input validation at API, database, and UI levels
3. **Defensive Coding**: Error boundaries, fallbacks, graceful degradation
4. **Testing Strategy**: 100% critical path coverage
5. **Monitoring & Alerts**: Real-time error tracking
6. **Fail-Safe Defaults**: All components designed to fail gracefully
7. **Progressive Enhancement**: Core functionality works without JavaScript

## 🏗️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js
- **Hosting**: Vercel (Primary), Netlify (Backup)
- **File Storage**: Uploadthing
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Error Tracking**: Sentry

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hayahai_web
```

2. Install dependencies:
```bash
npm ci
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Validate environment:
```bash
npm run env:validate
```

5. Set up the database:
```bash
npm run db:migrate:deploy
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:all` - Run all tests (unit + e2e)
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:performance` - Run performance tests
- `npm run test:smoke:staging` - Run smoke tests on staging

### Database
- `npm run db:migrate:deploy` - Deploy database migrations
- `npm run db:migrate:rollback` - Preview migration rollback
- `npm run db:seed:staging` - Seed staging data

### Security & Monitoring
- `npm run security:scan` - Run security audit
- `npm run env:validate` - Validate environment configuration
- `npm run health:external` - Check external service health
- `npm run health:comprehensive` - Run comprehensive health check

### Deployment
- `npm run pre-deploy:checks` - Run pre-deployment checks
- `npm run backup:create` - Create database backup
- `npm run verify:deployment` - Verify deployment

### Analysis
- `npm run analyze` - Analyze bundle size

## 🔧 Configuration

### Environment Variables

See `.env.example` for all required and optional environment variables.

### Database Schema

The database schema is defined in `prisma/schema.prisma` with comprehensive data integrity features:
- Soft deletes with `deletedAt` timestamps
- Audit trails with `ActivityLog` model
- Performance indexes on critical queries
- Proper foreign key relationships with cascade protection

### Error Handling

The application includes comprehensive error handling:
- **Error Boundaries**: Catch and handle React component errors
- **API Error Responses**: Standardized error format across all endpoints
- **Database Error Handling**: Transaction rollback and retry logic
- **Client-Side Error Reporting**: Automatic error reporting to monitoring service

## 🏗️ Architecture

### Directory Structure

```
hayahai_web/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/             # UI components
├── lib/                # Utility functions
│   ├── database/       # Database client and utilities
│   └── env.ts          # Environment validation
├── prisma/             # Database schema and migrations
├── reference_docs/     # Technical specifications
└── scripts/            # Utility scripts
```

### Error Prevention Layers

1. **Compile-time**: TypeScript strict mode catches type errors
2. **Runtime**: Environment validation and input sanitization
3. **Database**: Schema validation and transaction management
4. **UI**: Error boundaries and graceful degradation
5. **API**: Rate limiting and comprehensive error handling
6. **Monitoring**: Real-time error tracking and alerting

## 📊 Monitoring & Health Checks

- **Health Endpoint**: `/api/health` - Application health status
- **Error Reporting**: `/api/errors` - Client-side error reporting
- **Database Monitoring**: Connection pool status and query performance
- **External Services**: Dependency health validation

## 🚨 Error Response Format

All API endpoints follow a standardized error format:

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Technical details (dev mode only)",
    "field": "field_name (for validation errors)",
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "unique-request-id",
    "path": "/api/endpoint"
  }
}
```

## 🔐 Security Features

- **Security Headers**: Comprehensive security headers via Vercel configuration
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Per-endpoint rate limiting
- **Authentication**: NextAuth.js with secure session management
- **Database Security**: Parameterized queries and transaction isolation

## 📈 Performance

- **Bundle Analysis**: Use `npm run analyze` to analyze bundle size
- **Database Optimization**: Automatic query monitoring and slow query detection
- **Caching**: Strategic caching with cache invalidation
- **Error Recovery**: Graceful degradation and fallback mechanisms

## 🔄 Deployment

The application is configured for deployment on Vercel with:
- Automatic deployments from main branch
- Preview deployments for pull requests
- Security headers and optimizations
- Health check endpoints

## 📚 Documentation

Comprehensive documentation is available in the `reference_docs/` directory:
- Technical specifications
- API documentation
- Deployment runbook
- Performance optimization guide
- Admin user manual

## 🤝 Contributing

1. Follow the error prevention philosophy
2. Run pre-deployment checks before commits
3. Maintain comprehensive test coverage
4. Document any new error scenarios
5. Update CLAUDE.md for architectural changes

## 📄 License

This project is proprietary and confidential.