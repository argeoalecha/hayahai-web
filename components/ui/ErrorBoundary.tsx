'use client'

import React from 'react'
import { Button } from './Button'
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void
  level?: 'page' | 'component' | 'section'
}

interface ErrorFallbackProps {
  error: Error
  errorId: string
  resetError: () => void
  level: string
}

function DefaultErrorFallback({ error, errorId, resetError, level }: ErrorFallbackProps) {
  const isPageLevel = level === 'page'

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center",
      isPageLevel ? "min-h-[60vh]" : "min-h-[200px]"
    )}>
      <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />

      <h2 className="text-lg font-semibold text-destructive mb-2">
        {isPageLevel ? 'Page Error' : 'Something went wrong'}
      </h2>

      <p className="text-muted-foreground mb-4 max-w-md">
        {isPageLevel
          ? 'This page encountered an error. Please try refreshing or go back to the homepage.'
          : 'This section encountered an error. You can try reloading it.'
        }
      </p>

      {/* Error ID for support */}
      <p className="text-xs text-muted-foreground mb-4 font-mono">
        Error ID: {errorId}
      </p>

      {/* Development error details */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4 text-left w-full max-w-2xl">
          <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
            Development Error Details
          </summary>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto border">
            <strong>Error:</strong> {error.message}
            {error.stack && (
              <>
                <br /><br />
                <strong>Stack Trace:</strong><br />
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}

      <div className="flex gap-2">
        <Button onClick={resetError} variant="outline">
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Try Again
        </Button>

        {isPageLevel && (
          <Button onClick={() => window.location.href = '/'} variant="default">
            <HomeIcon className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'

    console.error(`ErrorBoundary [${errorId}]:`, error, errorInfo)

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, errorId)
    }

    this.props.onError?.(error, errorInfo, errorId)
    this.setState({ errorInfo })
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    try {
      // Send to Sentry or other error tracking service
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            errorBoundary: true,
            level: this.props.level || 'component',
            errorId,
          },
          extra: {
            errorInfo,
            componentStack: errorInfo.componentStack,
          },
        })
      }

      // Send to API endpoint for logging
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.props.level,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error) // Don't let error reporting fail the boundary
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    })
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          errorId={this.state.errorId}
          resetError={this.resetError}
          level={this.props.level || 'component'}
        />
      )
    }

    return this.props.children
  }
}

// HOC for easy component wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for throwing errors that error boundaries can catch
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
    throw error
  }, [])
}