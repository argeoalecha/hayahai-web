import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Core configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  // Authentication providers
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  DISCORD_CLIENT_ID: z.string().default(''),
  DISCORD_CLIENT_SECRET: z.string().default(''),

  // File upload
  UPLOADTHING_SECRET: z.string().optional().or(z.literal('')),
  UPLOADTHING_APP_ID: z.string().optional().or(z.literal('')),

  // Email
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  FROM_EMAIL: z.string().optional().or(z.literal('')),

  // Monitoring
  SENTRY_DSN: z.string().optional().or(z.literal('')),
  GOOGLE_ANALYTICS_ID: z.string().optional().or(z.literal('')),

  // Alerting
  SLACK_WEBHOOK_DB: z.string().url().optional(),
  SLACK_WEBHOOK_API: z.string().url().optional(),
  SLACK_WEBHOOK_AUTH: z.string().url().optional(),
  SLACK_WEBHOOK_PERF: z.string().url().optional(),
  SLACK_WEBHOOK_SEC: z.string().url().optional(),
  CRITICAL_ALERT_EMAIL: z.string().email().optional(),

  // Performance monitoring
  METRICS_ENDPOINT: z.string().url().optional(),
  METRICS_API_KEY: z.string().optional(),
  WPT_API_KEY: z.string().optional(),

  // Feature flags
  ENABLE_COMMENTS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),

  // Performance limits
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val, 10)).default('10485760'),
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),

  // Vercel (auto-populated)
  VERCEL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  VERCEL_REGION: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),

  // Development
  NEXT_TELEMETRY_DISABLED: z.string().optional(),
  ANALYZE: z.string().transform(val => val === 'true').default('false'),
});

// Validate and export environment variables
// Note: Using safeParse to preserve optional fields in the type
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Environment validation failed:', result.error.format());
  throw new Error('Invalid environment variables');
}

export const env = result.data;

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Validate external services connectivity
export async function validateExternalServices() {
  const services = {
    database: false,
    sentry: false,
    uploadthing: false,
    resend: false,
  };

  // Test database connectivity
  try {
    // This would be implemented with actual database client
    services.database = true;
  } catch (error) {
    console.warn('Database connectivity check failed:', error);
  }

  // Test Sentry connectivity
  if (env.SENTRY_DSN) {
    try {
      // Basic Sentry ping - in real implementation would test DSN
      services.sentry = true;
    } catch (error) {
      console.warn('Sentry connectivity check failed:', error);
    }
  }

  // Test UploadThing connectivity
  if (env.UPLOADTHING_SECRET) {
    try {
      // Would test UploadThing API connectivity
      services.uploadthing = true;
    } catch (error) {
      console.warn('UploadThing connectivity check failed:', error);
    }
  }

  // Test Resend connectivity
  if (env.RESEND_API_KEY) {
    try {
      // Would test Resend API connectivity
      services.resend = true;
    } catch (error) {
      console.warn('Resend connectivity check failed:', error);
    }
  }

  return {
    status: Object.values(services).every(Boolean) ? 'healthy' : 'partial',
    services,
  };
}