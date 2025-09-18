import { PrismaClient } from '@prisma/client';
import { env } from '@/lib/env';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with optimized configuration
export const db = globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Database health check function
export async function checkDBHealth(timeoutMs: number = 5000): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  connectionPool?: string;
  error?: string;
}> {
  const startTime = performance.now();

  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timeout')), timeoutMs);
    });

    // Simple query to test database connectivity
    const healthQuery = db.$queryRaw`SELECT 1 as health`;

    // Race between query and timeout
    await Promise.race([healthQuery, timeoutPromise]);

    const responseTime = performance.now() - startTime;

    // Get connection pool status (if available)
    let connectionPool = 'unknown';
    try {
      // Prisma doesn't expose pool stats directly, but we can infer health
      connectionPool = responseTime < 1000 ? 'healthy' : 'degraded';
    } catch (error) {
      connectionPool = 'unavailable';
    }

    return {
      status: 'healthy',
      responseTime: Math.round(responseTime),
      connectionPool,
    };

  } catch (error) {
    const responseTime = performance.now() - startTime;

    return {
      status: 'unhealthy',
      responseTime: Math.round(responseTime),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// Database transaction wrapper with retry logic
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(callback, {
        timeout: 30000, // 30 second timeout
        isolationLevel: 'ReadCommitted',
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown transaction error');

      // Don't retry on certain errors
      if (
        lastError.message.includes('Unique constraint') ||
        lastError.message.includes('Foreign key constraint') ||
        lastError.message.includes('Check constraint')
      ) {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError!;
}

// Database connection test
export async function testConnection(): Promise<boolean> {
  try {
    await db.$connect();
    await db.$disconnect();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnect(): Promise<void> {
  try {
    await db.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// Handle process termination
process.on('beforeExit', () => {
  disconnect();
});

process.on('SIGINT', () => {
  disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  disconnect();
  process.exit(0);
});