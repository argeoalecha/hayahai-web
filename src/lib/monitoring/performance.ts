import { useEffect, useCallback, useRef } from 'react';
import { alertManager } from './alerts';

interface PerformanceMetric {
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
  recent: number[]; // Last 10 measurements
}

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private webVitals: WebVitalsMetric[] = [];
  private maxStoredValues = 1000; // Keep last 1000 measurements per metric
  private alertThresholds = {
    'page-load': 3000,      // 3 seconds
    'api-response': 5000,   // 5 seconds
    'database-query': 2000, // 2 seconds
    'render-time': 1000,    // 1 second
  };

  startTiming(label: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  recordMetric(label: string, value: number, tags?: Record<string, string>) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }

    const values = this.metrics.get(label)!;
    values.push(value);

    // Keep only last N measurements
    if (values.length > this.maxStoredValues) {
      values.shift();
    }

    // Check for performance degradation
    this.checkPerformanceThresholds(label, value, values);

    // Send to external monitoring service if configured
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(label, value, tags);
    }
  }

  private checkPerformanceThresholds(label: string, currentValue: number, allValues: number[]) {
    const threshold = this.alertThresholds[label as keyof typeof this.alertThresholds];

    if (threshold && currentValue > threshold) {
      // Alert on individual slow operation
      const error = new Error(`Slow ${label}: ${currentValue.toFixed(2)}ms (threshold: ${threshold}ms)`);
      alertManager.recordError('performance-errors', error, {
        metric: label,
        value: currentValue,
        threshold,
        type: 'slow-operation',
      });
    }

    // Check for sustained performance degradation
    if (allValues.length >= 10) {
      const recent = allValues.slice(-10);
      const average = recent.reduce((a, b) => a + b) / recent.length;

      if (threshold && average > threshold * 0.8) { // 80% of threshold for average
        const error = new Error(`Sustained slow performance for ${label}: avg ${average.toFixed(2)}ms`);
        alertManager.recordError('performance-errors', error, {
          metric: label,
          averageValue: average,
          threshold,
          type: 'sustained-degradation',
          recentValues: recent,
        });
      }
    }
  }

  private async sendToExternalService(label: string, value: number, tags?: Record<string, string>) {
    try {
      // This could send to DataDog, New Relic, Grafana, etc.
      if (process.env.METRICS_ENDPOINT) {
        await fetch(process.env.METRICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.METRICS_API_KEY}`,
          },
          body: JSON.stringify({
            metric: label,
            value,
            timestamp: Date.now(),
            tags: {
              environment: process.env.NODE_ENV,
              version: process.env.npm_package_version,
              region: process.env.VERCEL_REGION,
              ...tags,
            },
          }),
        });
      }
    } catch (error) {
      console.warn('Failed to send metrics to external service:', error);
    }
  }

  recordWebVital(name: string, value: number) {
    let rating: 'good' | 'needs-improvement' | 'poor';

    // Web Vitals thresholds based on Google's recommendations
    switch (name) {
      case 'CLS':
        rating = value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
        break;
      case 'FID':
        rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
        break;
      case 'FCP':
        rating = value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
        break;
      case 'LCP':
        rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
        break;
      case 'TTFB':
        rating = value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
        break;
      default:
        rating = 'good';
    }

    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.webVitals.push(metric);

    // Keep only last 100 Web Vitals measurements
    if (this.webVitals.length > 100) {
      this.webVitals.shift();
    }

    // Alert on poor Web Vitals
    if (rating === 'poor') {
      const error = new Error(`Poor Web Vital: ${name} = ${value} (rating: ${rating})`);
      alertManager.recordError('performance-errors', error, {
        webVital: name,
        value,
        rating,
        type: 'poor-web-vital',
      });
    }

    // Record as regular metric
    this.recordMetric(`web-vital-${name.toLowerCase()}`, value);
  }

  getMetrics(): Record<string, PerformanceMetric> {
    const report: Record<string, PerformanceMetric> = {};

    for (const [label, values] of this.metrics) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        report[label] = {
          count: values.length,
          average: values.reduce((a, b) => a + b) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p95: this.percentile(sorted, 95),
          p99: this.percentile(sorted, 99),
          recent: values.slice(-10),
        };
      }
    }

    return report;
  }

  getWebVitals(): WebVitalsMetric[] {
    return [...this.webVitals];
  }

  getWebVitalsSummary() {
    const summary: Record<string, {
      latest: number;
      average: number;
      rating: string;
      count: number;
    }> = {};

    const vitalsGroups = this.webVitals.reduce((acc, vital) => {
      if (!acc[vital.name]) acc[vital.name] = [];
      acc[vital.name].push(vital);
      return acc;
    }, {} as Record<string, WebVitalsMetric[]>);

    for (const [name, vitals] of Object.entries(vitalsGroups)) {
      const values = vitals.map(v => v.value);
      const latest = vitals[vitals.length - 1];

      summary[name] = {
        latest: latest.value,
        average: values.reduce((a, b) => a + b) / values.length,
        rating: latest.rating,
        count: vitals.length,
      };
    }

    return summary;
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  // Clear old metrics (useful for memory management)
  clearOldMetrics(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = Date.now() - maxAge;
    this.webVitals = this.webVitals.filter(vital => vital.timestamp > cutoff);
  }

  // Export metrics for external analysis
  exportMetrics() {
    return {
      performance: this.getMetrics(),
      webVitals: this.getWebVitals(),
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    performanceMonitor.recordMetric(`component-${componentName}`, renderTime);
  });

  const trackAction = useCallback((actionName: string) => {
    return performanceMonitor.startTiming(`${componentName}-${actionName}`);
  }, [componentName]);

  return { trackAction };
}

// Hook for API call performance tracking
export function useAPIPerformanceTracking() {
  const trackAPICall = useCallback((endpoint: string, method: string = 'GET') => {
    return performanceMonitor.startTiming(`api-${method.toLowerCase()}-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`);
  }, []);

  return { trackAPICall };
}

// Hook for database query performance tracking
export function useDatabasePerformanceTracking() {
  const trackQuery = useCallback((operation: string, table?: string) => {
    const label = table ? `db-${operation}-${table}` : `db-${operation}`;
    return performanceMonitor.startTiming(label);
  }, []);

  return { trackQuery };
}

// Web Vitals integration
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Import web-vitals dynamically to avoid SSR issues
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(metric => performanceMonitor.recordWebVital('CLS', metric.value));
    getFID(metric => performanceMonitor.recordWebVital('FID', metric.value));
    getFCP(metric => performanceMonitor.recordWebVital('FCP', metric.value));
    getLCP(metric => performanceMonitor.recordWebVital('LCP', metric.value));
    getTTFB(metric => performanceMonitor.recordWebVital('TTFB', metric.value));
  }).catch(error => {
    console.warn('Failed to initialize Web Vitals:', error);
  });
}

// Performance optimization helpers
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: any[]) => {
    const endTiming = performanceMonitor.startTiming(label);
    try {
      const result = fn(...args);

      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => endTiming());
      }

      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  }) as T;
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;

    performanceMonitor.recordMetric('memory-used', memory.usedJSHeapSize);
    performanceMonitor.recordMetric('memory-total', memory.totalJSHeapSize);
    performanceMonitor.recordMetric('memory-limit', memory.jsHeapSizeLimit);

    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    if (usagePercent > 90) {
      const error = new Error(`High memory usage: ${usagePercent.toFixed(1)}%`);
      alertManager.recordError('performance-errors', error, {
        memoryUsage: usagePercent,
        usedHeap: memory.usedJSHeapSize,
        totalHeap: memory.totalJSHeapSize,
        heapLimit: memory.jsHeapSizeLimit,
        type: 'high-memory-usage',
      });
    }
  }
}

// Start periodic monitoring
export function startPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Initialize Web Vitals
  initWebVitals();

  // Monitor memory usage every 30 seconds
  setInterval(monitorMemoryUsage, 30000);

  // Clear old metrics daily
  setInterval(() => {
    performanceMonitor.clearOldMetrics();
  }, 24 * 60 * 60 * 1000);
}