// lib/env.ts - Comprehensive validation preventing configuration errors
import { z } from 'zod'

const envSchema = z.object({
  // Database with URL validation
  DATABASE_URL: z.string().url("Invalid database URL"),
  DIRECT_URL: z.string().url().optional(),

  // Authentication with security requirements
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth secret must be at least 32 characters"),

  // OAuth providers with conditional validation
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // File upload services (optional)
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // Email services (optional)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().optional(),

  // Analytics (optional)
  GOOGLE_ANALYTICS_ID: z.string().optional(),

  // Error tracking (optional)
  SENTRY_DSN: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Feature flags with safe defaults
  ENABLE_COMMENTS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),

  // Performance limits
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('10485760'), // 10MB
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
})

const envParsed = envSchema.safeParse(process.env)

if (!envParsed.success) {
  console.error("❌ Environment validation failed:")
  envParsed.error.errors.forEach(error => {
    console.error(`  ${error.path.join('.')}: ${error.message}`)
  })

  if (process.env.NODE_ENV === 'development') {
    throw new Error("Fix environment variables before continuing")
  } else {
    process.exit(1)
  }
}

export const env = envParsed.data

// Runtime validation for external services
export async function validateExternalServices() {
  const errors: string[] = []

  // Test database
  try {
    const { checkDBHealth } = await import('@/lib/database/client')
    const health = await checkDBHealth()
    if (health.status !== 'healthy') {
      errors.push(`Database: ${health.error}`)
    }
  } catch (error) {
    errors.push(`Database connection failed: ${error}`)
  }

  if (errors.length > 0) {
    throw new Error(`Service validation failed:\n${errors.join('\n')}`)
  }

  return { status: 'healthy', timestamp: new Date().toISOString() }
}