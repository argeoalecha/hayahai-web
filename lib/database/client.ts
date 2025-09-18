// lib/database/client.ts - Connection pooling and error recovery
import { PrismaClient } from '@prisma/client'
import { env } from '@/lib/env'

declare global {
  var __prisma: PrismaClient | undefined
}

export const db = globalThis.__prisma || new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],

  datasources: {
    db: { url: env.DATABASE_URL },
  },

  errorFormat: 'pretty',
})

// Prevent multiple instances in development
if (env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}

// Connection management with retry logic
let isConnected = false
const maxRetries = 5

export async function connectDB() {
  if (isConnected) return

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.$connect()
      await db.$queryRaw`SELECT 1` // Test query
      isConnected = true
      console.log('✅ Database connected successfully')
      return
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt}/${maxRetries} failed:`, error)

      if (attempt === maxRetries) {
        throw new Error(`Database connection failed after ${maxRetries} attempts`)
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Health check with comprehensive diagnostics
export async function checkDBHealth(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const start = Date.now()
      await db.$queryRaw`SELECT 1 as health_check`
      const responseTime = Date.now() - start

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        attempt: i + 1
      }
    } catch (error) {
      if (i === retries - 1) {
        return {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          attempts: retries
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Performance monitoring middleware
db.$use(async (params, next) => {
  const start = Date.now()

  try {
    const result = await next(params)
    const duration = Date.now() - start

    // Log slow queries
    if (duration > 1000) {
      console.warn(`🐌 Slow query: ${params.model}.${params.action} took ${duration}ms`)
    }

    return result
  } catch (error) {
    console.error(`❌ Database error in ${params.model}.${params.action}:`, error)
    throw error
  }
})

// Transaction wrapper with retry logic
export async function withTransaction<T>(
  fn: (prisma: typeof db) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(fn, {
        maxWait: 5000,
        timeout: 10000,
      })
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Don't retry validation errors
      if (error instanceof Error && (
        error.message.includes('Unique constraint') ||
        error.message.includes('Foreign key constraint')
      )) {
        throw error
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Transaction failed')
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.$disconnect()
  process.exit(0)
})