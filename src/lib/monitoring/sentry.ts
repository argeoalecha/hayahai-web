import * as Sentry from '@sentry/nextjs';
import React from 'react';
import { env } from '@/lib/env';

// Initialize Sentry if DSN is provided
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: env.NODE_ENV === 'development',

    environment: env.NODE_ENV,

    // Error filtering to reduce noise
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

        // Filter out bot/crawler errors
        if (event.request?.headers?.['user-agent']?.includes('bot')) {
          return null;
        }

        // Filter out known non-critical errors
        const ignoredMessages = [
          'ResizeObserver loop limit exceeded',
          'Script error',
          'Non-Error promise rejection captured',
          'ChunkLoadError'
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

    // Custom tags for better organization
    initialScope: {
      tags: {
        component: 'blog-platform',
        version: process.env.npm_package_version || 'unknown',
      },
    },

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

    // Custom fingerprinting for better error grouping
    beforeSendTransaction(event) {
      // Don't send health check transactions to reduce noise
      if (event.transaction?.includes('/api/health')) {
        return null;
      }
      return event;
    },
  });
}

// Custom error reporting with context
export function reportError(error: Error, context?: Record<string, any>, level: 'error' | 'warning' | 'info' = 'error') {
  console.error('Error:', error);

  if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
    Sentry.withScope(scope => {
      scope.setLevel(level);

      if (context) {
        scope.setContext('additional', context);
      }

      // Add user context if available
      if (typeof window !== 'undefined' && (window as any).user) {
        scope.setUser({
          id: (window as any).user.id,
          email: (window as any).user.email,
        });
      }

      Sentry.captureException(error);
    });
  }
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

// Set user context
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

// Set extra context
export function setExtraContext(key: string, value: any) {
  Sentry.setExtra(key, value);
}

// Clear user context (on logout)
export function clearUserContext() {
  Sentry.configureScope(scope => scope.clear());
}

// Custom error classes for better categorization
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public service?: string) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}