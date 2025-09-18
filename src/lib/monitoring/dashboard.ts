import { PerformanceMonitor } from './performance';
import { AlertManager } from './alerts';
import { checkDBHealth } from '@/lib/database/client';

export interface DashboardMetrics {
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    loadAverage: number[];
  };
  database: {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    connectionPool?: string;
    error?: string;
  };
  performance: {
    webVitals: {
      CLS: number;
      FID: number;
      FCP: number;
      LCP: number;
      TTFB: number;
    };
    apiResponseTimes: Record<string, number>;
    errorRate: number;
    requestCount: number;
  };
  alerts: {
    active: number;
    resolved: number;
    critical: number;
  };
  traffic: {
    pageViews: number;
    uniqueVisitors: number;
    topPages: Array<{ path: string; views: number }>;
    referrers: Array<{ source: string; count: number }>;
  };
}

export class MonitoringDashboard {
  private performanceMonitor: PerformanceMonitor;
  private alertManager: AlertManager;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.alertManager = new AlertManager();
  }

  async getSystemMetrics(): Promise<DashboardMetrics['system']> {
    const process = globalThis.process;

    if (!process) {
      return {
        uptime: 0,
        memoryUsage: { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 },
        cpuUsage: 0,
        loadAverage: [0, 0, 0],
      };
    }

    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.getCpuUsage(),
      loadAverage: require('os').loadavg?.() || [0, 0, 0],
    };
  }

  private getCpuUsage(): number {
    try {
      const startUsage = process.cpuUsage();
      return (startUsage.user + startUsage.system) / 1000; // Convert to milliseconds
    } catch (error) {
      return 0;
    }
  }

  async getDatabaseMetrics(): Promise<DashboardMetrics['database']> {
    try {
      const health = await checkDBHealth();
      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPerformanceMetrics(): Promise<DashboardMetrics['performance']> {
    const metrics = this.performanceMonitor.getMetrics();

    // Calculate derived metrics
    const totalRequests = Object.values(metrics).reduce((sum, metric) => sum + metric.count, 0);
    const totalErrors = Object.values(metrics).reduce((sum, metric) => sum + metric.errors, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Get API response times
    const apiResponseTimes: Record<string, number> = {};
    Object.entries(metrics).forEach(([key, metric]) => {
      if (key.startsWith('api_')) {
        apiResponseTimes[key] = metric.average;
      }
    });

    return {
      webVitals: {
        CLS: 0, // Will be populated by client-side monitoring
        FID: 0,
        FCP: 0,
        LCP: 0,
        TTFB: 0,
      },
      apiResponseTimes,
      errorRate,
      requestCount: totalRequests,
    };
  }

  getAlertMetrics(): DashboardMetrics['alerts'] {
    const alerts = this.alertManager.getActiveAlerts();

    return {
      active: alerts.length,
      resolved: 0, // TODO: Implement resolved alerts tracking
      critical: alerts.filter(alert => alert.severity === 'critical').length,
    };
  }

  async getTrafficMetrics(): Promise<DashboardMetrics['traffic']> {
    // TODO: Implement actual traffic analytics
    // This would typically come from your analytics provider (Google Analytics, etc.)
    return {
      pageViews: 0,
      uniqueVisitors: 0,
      topPages: [],
      referrers: [],
    };
  }

  async getAllMetrics(): Promise<DashboardMetrics> {
    const [system, database, performance, alerts, traffic] = await Promise.all([
      this.getSystemMetrics(),
      this.getDatabaseMetrics(),
      this.getPerformanceMetrics(),
      Promise.resolve(this.getAlertMetrics()),
      this.getTrafficMetrics(),
    ]);

    return {
      system,
      database,
      performance,
      alerts,
      traffic,
    };
  }

  // Health scoring algorithm
  calculateHealthScore(metrics: DashboardMetrics): number {
    let score = 100;

    // Database health (30 points)
    if (metrics.database.status === 'unhealthy') {
      score -= 30;
    } else if (metrics.database.responseTime && metrics.database.responseTime > 1000) {
      score -= 15;
    }

    // Error rate (25 points)
    if (metrics.performance.errorRate > 5) {
      score -= 25;
    } else if (metrics.performance.errorRate > 1) {
      score -= 10;
    }

    // Memory usage (20 points)
    const memoryUsagePercent = (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      score -= 20;
    } else if (memoryUsagePercent > 75) {
      score -= 10;
    }

    // Critical alerts (15 points)
    if (metrics.alerts.critical > 0) {
      score -= 15;
    }

    // Performance (10 points)
    const avgResponseTime = Object.values(metrics.performance.apiResponseTimes).reduce((sum, time) => sum + time, 0) /
                           Object.values(metrics.performance.apiResponseTimes).length || 0;
    if (avgResponseTime > 2000) {
      score -= 10;
    } else if (avgResponseTime > 1000) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  // Generate status summary
  getStatusSummary(metrics: DashboardMetrics): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    score: number;
  } {
    const score = this.calculateHealthScore(metrics);

    let status: 'healthy' | 'warning' | 'critical';
    let message: string;

    if (score >= 90) {
      status = 'healthy';
      message = 'All systems operational';
    } else if (score >= 70) {
      status = 'warning';
      message = 'Minor issues detected, monitoring';
    } else {
      status = 'critical';
      message = 'Critical issues require immediate attention';
    }

    return { status, message, score };
  }
}

// Global dashboard instance
export const monitoringDashboard = new MonitoringDashboard();