import { NextRequest } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Maximum unique tokens per interval
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const store = new Map<string, RateLimitRecord>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (record.resetTime < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimit(config: RateLimitConfig) {
  return {
    async check(
      request: NextRequest,
      limit: number,
      token?: string
    ): Promise<void> {
      const identifier = token || getClientIdentifier(request)
      const key = `${identifier}:${limit}`
      const now = Date.now()
      const resetTime = now + config.interval

      const record = store.get(key)

      if (!record) {
        // First request for this identifier
        store.set(key, { count: 1, resetTime })
        return
      }

      if (now > record.resetTime) {
        // Reset window has passed
        store.set(key, { count: 1, resetTime })
        return
      }

      if (record.count >= limit) {
        const error = new Error(`Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`)
        error.name = 'RateLimitError'
        throw error
      }

      // Increment count
      record.count += 1
      store.set(key, record)
    },

    getHeaders(request: NextRequest, limit: number, token?: string) {
      const identifier = token || getClientIdentifier(request)
      const key = `${identifier}:${limit}`
      const record = store.get(key)
      const now = Date.now()

      if (!record || now > record.resetTime) {
        return {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': (limit - 1).toString(),
          'X-RateLimit-Reset': Math.ceil((now + config.interval) / 1000).toString(),
          'X-RateLimit-Window': Math.ceil(config.interval / 1000).toString(),
        }
      }

      return {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, limit - record.count).toString(),
        'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000).toString(),
        'X-RateLimit-Window': Math.ceil(config.interval / 1000).toString(),
      }
    }
  }
}

function getClientIdentifier(request: NextRequest): string {
  // Priority order for identifying clients:
  // 1. Authenticated user ID from session
  // 2. X-Forwarded-For header (proxy/CDN)
  // 3. X-Real-IP header
  // 4. Connection remote address

  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const connectionIp = request.ip

  // Use the first IP from X-Forwarded-For if available
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }

  if (realIp) {
    return realIp
  }

  if (connectionIp) {
    return connectionIp
  }

  // Fallback to a default identifier
  return 'unknown'
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  auth: rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 500,
  }),

  // General API endpoints
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
  }),

  // File upload endpoints
  upload: rateLimit({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 100,
  }),

  // Search endpoints
  search: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 200,
  }),

  // Public read endpoints (more lenient)
  public: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 1000,
  }),
}

// Utility function to check if error is a rate limit error
export function isRateLimitError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'RateLimitError'
}

// Middleware helper for rate limiting
export async function withRateLimit<T>(
  request: NextRequest,
  limiter: ReturnType<typeof rateLimit>,
  limit: number,
  token?: string,
  operation?: () => Promise<T>
): Promise<T> {
  try {
    await limiter.check(request, limit, token)

    if (operation) {
      return await operation()
    }

    return undefined as T
  } catch (error) {
    if (isRateLimitError(error)) {
      const headers = limiter.getHeaders(request, limit, token)
      const rateLimitError = new Error(error.message)
      rateLimitError.name = 'RateLimitError'
      ;(rateLimitError as any).headers = headers
      throw rateLimitError
    }
    throw error
  }
}

// Rate limit decorator for API route handlers
export function rateLimited(
  limiter: ReturnType<typeof rateLimit>,
  limit: number
) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!

    descriptor.value = (async function (this: any, request: NextRequest, ...args: any[]) {
      await limiter.check(request, limit)
      return method.call(this, request, ...args)
    }) as T

    return descriptor
  }
}