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

    // Client-specific configuration
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof Error) {
        // Filter out network errors that are user-caused
        if (error.message.includes('Failed to fetch')) {
          return null;
        }

        // Filter out AbortError from user navigation
        if (error.name === 'AbortError') {
          return null;
        }

        // Filter out known non-critical errors
        const ignoredMessages = [
          'ResizeObserver loop limit exceeded',
          'Script error',
          'Non-Error promise rejection captured',
          'ChunkLoadError',
          'Network request failed',
        ];

        if (ignoredMessages.some(msg => error.message.includes(msg))) {
          return null;
        }
      }

      return event;
    },

    // Performance monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Track specific operations
        tracePropagationTargets: ['localhost', 'hayah-ai.com'],
      }),
    ],

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // Custom tags for client environment
    initialScope: {
      tags: {
        component: 'client',
        version: process.env.npm_package_version || 'unknown',
        environment: env.NODE_ENV,
      },
    },

    // Filter transactions to reduce noise
    beforeSendTransaction(event) {
      // Don't send health check transactions
      if (event.transaction?.includes('/api/health')) {
        return null;
      }

      // Don't send metrics transactions
      if (event.transaction?.includes('/api/metrics')) {
        return null;
      }

      return event;
    },
  });
}