import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';
import { alertManager } from '@/lib/monitoring/alerts';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: Request) {
  // Check authentication for metrics access
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized access to metrics' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const timeRange = searchParams.get('range') || '1h';

    // Get performance metrics
    const performanceMetrics = performanceMonitor.getMetrics();
    const webVitals = performanceMonitor.getWebVitalsSummary();
    const errorCounts = alertManager.getErrorCounts();

    // System metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
    };

    const metricsData = {
      timestamp: new Date().toISOString(),
      timeRange,
      performance: performanceMetrics,
      webVitals,
      errors: errorCounts,
      system: systemMetrics,
    };

    // Return different formats
    if (format === 'prometheus') {
      return new NextResponse(formatPrometheusMetrics(metricsData), {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    }

    return NextResponse.json(metricsData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

function formatPrometheusMetrics(data: any): string {
  const lines: string[] = [];

  // Add help and type information
  lines.push('# HELP hayah_ai_performance_duration_seconds Performance metric durations');
  lines.push('# TYPE hayah_ai_performance_duration_seconds histogram');

  // Performance metrics
  for (const [name, metric] of Object.entries(data.performance as Record<string, any>)) {
    const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`hayah_ai_performance_duration_seconds{metric="${sanitizedName}",quantile="0.95"} ${(metric.p95 / 1000).toFixed(6)}`);
    lines.push(`hayah_ai_performance_duration_seconds{metric="${sanitizedName}",quantile="0.99"} ${(metric.p99 / 1000).toFixed(6)}`);
    lines.push(`hayah_ai_performance_duration_seconds_count{metric="${sanitizedName}"} ${metric.count}`);
    lines.push(`hayah_ai_performance_duration_seconds_sum{metric="${sanitizedName}"} ${(metric.average * metric.count / 1000).toFixed(6)}`);
  }

  // Web Vitals
  lines.push('# HELP hayah_ai_web_vitals Web Vitals metrics');
  lines.push('# TYPE hayah_ai_web_vitals gauge');
  for (const [name, vital] of Object.entries(data.webVitals as Record<string, any>)) {
    lines.push(`hayah_ai_web_vitals{metric="${name.toLowerCase()}"} ${vital.latest}`);
  }

  // Error counts
  lines.push('# HELP hayah_ai_errors_total Total error counts by type');
  lines.push('# TYPE hayah_ai_errors_total counter');
  for (const [type, count] of Object.entries(data.errors as Record<string, number>)) {
    const sanitizedType = type.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`hayah_ai_errors_total{type="${sanitizedType}"} ${count}`);
  }

  // System metrics
  lines.push('# HELP hayah_ai_memory_bytes Memory usage in bytes');
  lines.push('# TYPE hayah_ai_memory_bytes gauge');
  lines.push(`hayah_ai_memory_bytes{type="heap_used"} ${data.system.memory.heapUsed}`);
  lines.push(`hayah_ai_memory_bytes{type="heap_total"} ${data.system.memory.heapTotal}`);
  lines.push(`hayah_ai_memory_bytes{type="external"} ${data.system.memory.external}`);

  lines.push('# HELP hayah_ai_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE hayah_ai_uptime_seconds counter');
  lines.push(`hayah_ai_uptime_seconds ${data.system.uptime.toFixed(2)}`);

  return lines.join('\n') + '\n';
}