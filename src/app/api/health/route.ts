import { NextResponse } from 'next/server';
import { checkDBHealth } from '@/lib/database/client';
import { validateExternalServices } from '@/lib/env';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  error?: string;
  [key: string]: any;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: Record<string, HealthCheck>;
}

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, HealthCheck> = {};

  try {
    // Database health check
    try {
      const dbHealth = await checkDBHealth(5000); // 5 second timeout
      checks.database = {
        status: 'healthy',
        responseTime: dbHealth.responseTime || 0,
        connectionPool: dbHealth.connectionPool || 'unknown',
        ...dbHealth
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }

    // External services check
    try {
      const servicesHealth = await validateExternalServices();
      checks.services = {
        status: 'healthy',
        ...servicesHealth
      };
    } catch (error) {
      checks.services = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Service check failed'
      };
    }

    // File system check
    try {
      await import('fs').then(fs => fs.promises.access('/tmp', fs.constants.W_OK));
      checks.filesystem = {
        status: 'healthy',
        writable: true
      };
    } catch (error) {
      checks.filesystem = {
        status: 'unhealthy',
        error: 'File system not writable',
        writable: false
      };
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memoryPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    checks.memory = {
      status: memoryPercentage > 90 ? 'unhealthy' : 'healthy',
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: memoryPercentage,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    };

    // Environment variables check
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      missingVariables: missingEnvVars,
      nodeVersion: process.version,
      platform: process.platform
    };

  } catch (error) {
    checks.general = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown health check error'
    };
  }

  // Response time calculation
  const responseTime = Date.now() - startTime;
  checks.responseTime = {
    status: responseTime > 5000 ? 'unhealthy' : 'healthy',
    value: responseTime,
    unit: 'ms'
  };

  // Overall health status
  const isHealthy = Object.values(checks).every(check =>
    check.status === 'healthy'
  );

  const response: HealthResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'unknown',
    uptime: process.uptime(),
    checks
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
      'X-Health-Check': 'true'
    }
  });
}

// Simplified health check for load balancers
export async function HEAD() {
  try {
    // Quick database connectivity check
    await checkDBHealth(1000); // 1 second timeout
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}