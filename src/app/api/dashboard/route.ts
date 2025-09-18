import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { monitoringDashboard } from '@/lib/monitoring/dashboard';
import { reportError } from '@/lib/monitoring/sentry';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const format = searchParams.get('format') || 'json';

    let data;

    try {
      switch (type) {
        case 'system':
          data = await monitoringDashboard.getSystemMetrics();
          break;
        case 'database':
          data = await monitoringDashboard.getDatabaseMetrics();
          break;
        case 'performance':
          data = await monitoringDashboard.getPerformanceMetrics();
          break;
        case 'alerts':
          data = monitoringDashboard.getAlertMetrics();
          break;
        case 'traffic':
          data = await monitoringDashboard.getTrafficMetrics();
          break;
        case 'health':
          const allMetrics = await monitoringDashboard.getAllMetrics();
          data = monitoringDashboard.getStatusSummary(allMetrics);
          break;
        case 'all':
        default:
          data = await monitoringDashboard.getAllMetrics();
          break;
      }

      // Handle different response formats
      if (format === 'prometheus') {
        return new Response(formatPrometheusMetrics(data), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }

      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        type,
      });

    } catch (metricsError) {
      reportError(metricsError as Error, {
        endpoint: '/api/dashboard',
        type,
        format,
        userId: session.user.id,
      });

      return NextResponse.json(
        {
          error: 'Failed to retrieve metrics',
          details: process.env.NODE_ENV === 'development' ? (metricsError as Error).message : undefined,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    reportError(error as Error, {
      endpoint: '/api/dashboard',
      stage: 'authentication',
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// Format metrics for Prometheus/Grafana
function formatPrometheusMetrics(data: any): string {
  const lines: string[] = [];
  const timestamp = Date.now();

  if (data.system) {
    lines.push(`# HELP hayah_uptime_seconds Application uptime in seconds`);
    lines.push(`# TYPE hayah_uptime_seconds counter`);
    lines.push(`hayah_uptime_seconds ${data.system.uptime} ${timestamp}`);

    lines.push(`# HELP hayah_memory_usage_bytes Memory usage in bytes`);
    lines.push(`# TYPE hayah_memory_usage_bytes gauge`);
    lines.push(`hayah_memory_usage_bytes{type="rss"} ${data.system.memoryUsage.rss} ${timestamp}`);
    lines.push(`hayah_memory_usage_bytes{type="heapUsed"} ${data.system.memoryUsage.heapUsed} ${timestamp}`);
    lines.push(`hayah_memory_usage_bytes{type="heapTotal"} ${data.system.memoryUsage.heapTotal} ${timestamp}`);
  }

  if (data.database) {
    lines.push(`# HELP hayah_database_health Database health status (1=healthy, 0=unhealthy)`);
    lines.push(`# TYPE hayah_database_health gauge`);
    lines.push(`hayah_database_health ${data.database.status === 'healthy' ? 1 : 0} ${timestamp}`);

    if (data.database.responseTime) {
      lines.push(`# HELP hayah_database_response_time_ms Database response time in milliseconds`);
      lines.push(`# TYPE hayah_database_response_time_ms gauge`);
      lines.push(`hayah_database_response_time_ms ${data.database.responseTime} ${timestamp}`);
    }
  }

  if (data.performance) {
    lines.push(`# HELP hayah_error_rate_percent Error rate percentage`);
    lines.push(`# TYPE hayah_error_rate_percent gauge`);
    lines.push(`hayah_error_rate_percent ${data.performance.errorRate} ${timestamp}`);

    lines.push(`# HELP hayah_request_count_total Total number of requests`);
    lines.push(`# TYPE hayah_request_count_total counter`);
    lines.push(`hayah_request_count_total ${data.performance.requestCount} ${timestamp}`);

    // API response times
    Object.entries(data.performance.apiResponseTimes || {}).forEach(([endpoint, time]) => {
      lines.push(`hayah_api_response_time_ms{endpoint="${endpoint}"} ${time} ${timestamp}`);
    });
  }

  if (data.alerts) {
    lines.push(`# HELP hayah_alerts_active_count Number of active alerts`);
    lines.push(`# TYPE hayah_alerts_active_count gauge`);
    lines.push(`hayah_alerts_active_count ${data.alerts.active} ${timestamp}`);

    lines.push(`# HELP hayah_alerts_critical_count Number of critical alerts`);
    lines.push(`# TYPE hayah_alerts_critical_count gauge`);
    lines.push(`hayah_alerts_critical_count ${data.alerts.critical} ${timestamp}`);
  }

  return lines.join('\n') + '\n';
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}