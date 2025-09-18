import * as Sentry from '@sentry/nextjs';
import { env } from './src/lib/env';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of the transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    debug: env.NODE_ENV === 'development',

    environment: env.NODE_ENV,

    // Server-specific configuration
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out expected server errors
      if (error instanceof Error) {
        // Don't report network timeouts
        if (error.message.includes('timeout')) {
          return null;
        }

        // Don't report client disconnections
        if (error.message.includes('Connection reset by peer')) {
          return null;
        }

        // Don't report auth errors (they're handled)
        if (error.message.includes('Unauthorized')) {
          return null;
        }
      }

      return event;
    },

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // Custom tags for server environment
    initialScope: {
      tags: {
        component: 'server',
        version: process.env.npm_package_version || 'unknown',
        environment: env.NODE_ENV,
      },
    },
  });
}