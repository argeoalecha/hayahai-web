import * as Sentry from '@sentry/nextjs';

// This file is required for Edge Runtime support
// It configures Sentry for middleware and edge API routes

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Adjust sample rate for edge runtime (lower to reduce overhead)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    debug: process.env.NODE_ENV === 'development',

    environment: process.env.NODE_ENV || 'development',

    // Minimal configuration for edge runtime
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error instanceof Error) {
        // Filter out middleware-specific errors that are expected
        if (error.message.includes('Authentication failed')) {
          return null;
        }

        if (error.message.includes('Rate limit exceeded')) {
          return null;
        }
      }

      return event;
    },

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // Minimal tags for edge runtime
    initialScope: {
      tags: {
        component: 'edge',
        environment: process.env.NODE_ENV || 'development',
      },
    },
  });
}