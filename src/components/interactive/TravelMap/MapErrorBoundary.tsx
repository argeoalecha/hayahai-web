'use client';

import React, { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

interface MapErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class MapErrorBoundary extends React.Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    const errorId = `map_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    const errorDetails = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
    };

    console.error('TravelMap Error Boundary caught an error:', errorDetails);

    // Report to external service in production
    if (process.env.NODE_ENV === 'production') {
      try {
        // Send to Sentry or other error reporting service
        this.reportError(errorDetails);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (errorDetails: any) => {
    try {
      // In a real implementation, this would send to your error reporting service
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (error) {
      console.error('Error reporting failed:', error);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorId: '',
      });
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Map Failed to Load
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              We're having trouble displaying the interactive map. This could be due to
              network issues or a temporary service disruption.
            </p>

            <div className="space-y-2">
              {this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Reload page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
                <p className="text-xs text-gray-500 mt-1">
                  Error ID: {this.state.errorId}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;