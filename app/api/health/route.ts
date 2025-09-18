import { NextResponse } from 'next/server'
import { checkDBHealth } from '@/lib/database/client'

export async function GET() {
  try {
    const dbHealth = await checkDBHealth()

    const health = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime || 'N/A',
          error: dbHealth.error || undefined
        },
        memory: {
          status: 'healthy',
          usage: `${Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)}%`
        }
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          database: { status: 'error' },
          memory: { status: 'unknown' }
        }
      },
      { status: 503 }
    )
  }
}