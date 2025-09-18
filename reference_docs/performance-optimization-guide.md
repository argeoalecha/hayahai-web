# Hayah-AI Blog Platform Performance Optimization Guide

## 📋 Table of Contents
1. [Performance Fundamentals](#performance-fundamentals)
2. [Frontend Optimization](#frontend-optimization)
3. [Backend Optimization](#backend-optimization)
4. [Database Performance](#database-performance)
5. [CDN & Caching Strategies](#cdn--caching-strategies)
6. [Monitoring & Profiling](#monitoring--profiling)
7. [Performance Testing](#performance-testing)
8. [Optimization Checklist](#optimization-checklist)

---

## Performance Fundamentals

### 🎯 Performance Goals & Metrics

#### Core Web Vitals Targets
```typescript
interface PerformanceTargets {
  coreWebVitals: {
    LCP: '< 2.5 seconds',    // Largest Contentful Paint
    FID: '< 100 ms',         // First Input Delay
    CLS: '< 0.1',            // Cumulative Layout Shift
    FCP: '< 1.8 seconds',    // First Contentful Paint
    TTI: '< 3.8 seconds'     // Time to Interactive
  },
  serverMetrics: {
    TTFB: '< 600 ms',        // Time to First Byte
    responseTime: '< 200 ms', // API response time
    databaseQuery: '< 100 ms', // Database query time
    cacheHitRate: '> 95%'    // Cache effectiveness
  },
  lighthouse: {
    performance: '> 90',
    accessibility: '> 90',
    bestPractices: '> 90',
    seo: '> 90'
  }
}
```

#### Performance Budget
```javascript
// Performance budgets for different page types
const performanceBudget = {
  homepage: {
    totalSize: '2.5 MB',
    javascript: '500 KB',
    css: '150 KB',
    images: '1.5 MB',
    fonts: '300 KB'
  },
  blogPost: {
    totalSize: '2 MB',
    javascript: '400 KB',
    css: '150 KB',
    images: '1.2 MB',
    fonts: '300 KB'
  },
  adminPanel: {
    totalSize: '4 MB',
    javascript: '1.5 MB',
    css: '300 KB',
    images: '800 KB',
    fonts: '400 KB'
  }
}
```

### 📊 Performance Monitoring Setup

#### Real User Monitoring (RUM)
```typescript
// lib/performance/rum.ts
interface PerformanceMetrics {
  url: string
  timing: {
    navigationStart: number
    fetchStart: number
    domainLookupStart: number
    domainLookupEnd: number
    connectStart: number
    connectEnd: number
    requestStart: number
    responseStart: number
    responseEnd: number
    domLoading: number
    domInteractive: number
    domContentLoadedEventStart: number
    domContentLoadedEventEnd: number
    domComplete: number
    loadEventStart: number
    loadEventEnd: number
  }
  vitals: {
    FCP: number
    LCP: number
    FID: number
    CLS: number
    TTFB: number
  }
  resources: PerformanceResourceTiming[]
  userAgent: string
  connection: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

class RUMCollector {
  private metricsQueue: PerformanceMetrics[] = []
  private batchSize = 10
  private sendInterval = 30000 // 30 seconds

  constructor() {
    this.collectCoreWebVitals()
    this.collectNavigationTiming()
    this.collectResourceTiming()
    this.startBatchSending()
  }

  private collectCoreWebVitals() {
    // FCP Collection
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime)
        }
      }
    }).observe({ entryTypes: ['paint'] })

    // LCP Collection
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // FID Collection
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('FID', entry.processingStart - entry.startTime)
      }
    }).observe({ entryTypes: ['first-input'] })

    // CLS Collection
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          this.recordMetric('CLS', clsValue)
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  }

  private async sendMetrics() {
    if (this.metricsQueue.length === 0) return

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metricsQueue.splice(0, this.batchSize),
          timestamp: Date.now()
        }),
        keepalive: true
      })
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }
}

// Initialize RUM collection
if (typeof window !== 'undefined') {
  new RUMCollector()
}
```

---

## Frontend Optimization

### ⚡ React Performance Optimization

#### Component Optimization
```typescript
// components/optimized/BlogPost.tsx
import React, { memo, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useVirtualizer } from '@tanstack/react-virtual'

// Lazy load heavy components
const CommentSection = dynamic(() => import('./CommentSection'), {
  loading: () => <CommentSkeleton />,
  ssr: false
})

const SocialSharing = dynamic(() => import('./SocialSharing'), {
  loading: () => <div className="w-40 h-8 bg-gray-200 animate-pulse rounded" />
})

// Memoized blog post component
export const BlogPost = memo(({ post, comments }: BlogPostProps) => {
  // Memoize expensive calculations
  const readingTime = useMemo(() => 
    calculateReadingTime(post.content), [post.content]
  )

  const relatedPosts = useMemo(() =>
    findRelatedPosts(post.tags, post.category), [post.tags, post.category]
  )

  // Callback optimization
  const handleLike = useCallback(async () => {
    try {
      await likePost(post.id)
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }, [post.id])

  return (
    <article className="max-w-4xl mx-auto">
      {/* Post header with optimized image */}
      <PostHeader 
        title={post.title}
        image={post.featuredImage}
        readingTime={readingTime}
      />
      
      {/* Post content */}
      <PostContent content={post.content} />
      
      {/* Lazy loaded social sharing */}
      <SocialSharing url={post.url} title={post.title} />
      
      {/* Virtual scrolled related posts */}
      <RelatedPosts posts={relatedPosts} />
      
      {/* Lazy loaded comments */}
      <CommentSection postId={post.id} initialComments={comments} />
    </article>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for shallow equality
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.updatedAt === nextProps.post.updatedAt &&
    prevProps.comments.length === nextProps.comments.length
  )
})

// Virtual scrolling for large lists
function RelatedPosts({ posts }: { posts: Post[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 2
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <PostCard post={posts[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Image Optimization
```typescript
// components/optimized/OptimizedImage.tsx
import Image from 'next/image'
import { useState, useCallback } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  sizes?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500">Image failed to load</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  )
}

// Image preloading hook
export function useImagePreload(urls: string[]) {
  useEffect(() => {
    urls.forEach(url => {
      const img = new Image()
      img.src = url
    })
  }, [urls])
}
```

#### Code Splitting & Lazy Loading
```typescript
// utils/dynamicImports.ts
import dynamic from 'next/dynamic'

// Route-based code splitting
export const AdminDashboard = dynamic(() => import('@/pages/admin/dashboard'), {
  loading: () => <PageSkeleton />,
  ssr: false // Admin pages don't need SSR
})

export const BlogEditor = dynamic(() => import('@/components/editor/BlogEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false
})

// Feature-based code splitting
export const AdvancedChart = dynamic(() => import('@/components/charts/AdvancedChart'), {
  loading: () => <ChartSkeleton />
})

export const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  loading: () => <div>Loading code editor...</div>
})

// Conditional loading based on user permissions
export const AdminOnlyComponent = dynamic(
  () => import('@/components/admin/AdminPanel'),
  {
    loading: () => <div>Loading admin panel...</div>,
    ssr: false
  }
)

// Bundle splitting configuration
// next.config.js
module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    }
    return config
  }
}
```

### 🎨 CSS & Styling Optimization

#### Critical CSS Extraction
```typescript
// scripts/extractCriticalCSS.js
const puppeteer = require('puppeteer')
const critical = require('critical')
const fs = require('fs').promises

async function extractCriticalCSS() {
  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/technology',
    'http://localhost:3000/travel',
    'http://localhost:3000/posts/sample-post'
  ]

  for (const url of urls) {
    try {
      const { css } = await critical.generate({
        base: './public',
        src: url,
        target: {
          css: `critical-${url.split('/').pop() || 'home'}.css`,
          html: `critical-${url.split('/').pop() || 'home'}.html`
        },
        width: 1300,
        height: 900,
        minify: true,
        extract: true,
        ignore: {
          atrule: ['@font-face']
        }
      })

      console.log(`Critical CSS extracted for ${url}`)
    } catch (error) {
      console.error(`Failed to extract critical CSS for ${url}:`, error)
    }
  }
}

extractCriticalCSS()
```

#### CSS-in-JS Optimization
```typescript
// styles/optimizedStyles.ts
import { css } from '@emotion/react'
import { memoize } from 'lodash'

// Memoized style generation
const createButtonStyles = memoize((variant: string, size: string) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  
  ${variant === 'primary' && css`
    background-color: #3b82f6;
    color: white;
    &:hover {
      background-color: #2563eb;
    }
  `}
  
  ${size === 'sm' && css`
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  `}
  
  ${size === 'lg' && css`
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  `}
`)

// Optimized component with style memoization
export const Button = memo(({ variant, size, children, ...props }) => {
  const styles = createButtonStyles(variant, size)
  
  return (
    <button css={styles} {...props}>
      {children}
    </button>
  )
})
```

### 📦 Bundle Optimization

#### Webpack Bundle Analyzer Configuration
```javascript
// next.config.js - Bundle analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  webpack: (config, { isServer }) => {
    // Optimize bundles
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Framework bundle
        framework: {
          chunks: 'all',
          name: 'framework',
          test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
          priority: 40,
          enforce: true,
        },
        // Lib bundle
        lib: {
          test(module) {
            return (
              module.size() > 160000 &&
              /node_modules[/\\]/.test(module.identifier())
            )
          },
          name: 'lib',
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        // Common bundle
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
        },
        // Shared bundle
        shared: {
          test: /[\\/]shared[\\/]/,
          name: 'shared',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    }

    // Tree shaking optimization
    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Image optimization
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Compression
  compress: true,

  // Power-off optimizations
  swcMinify: true,
  
  // Font optimization
  optimizeFonts: true,
})
```

---

## Backend Optimization

### 🚀 API Performance Optimization

#### Response Optimization
```typescript
// lib/api/responseOptimization.ts
import { NextResponse } from 'next/server'
import { compress } from 'compression'

// Response compression middleware
export function withCompression(handler: Function) {
  return async (request: Request) => {
    const response = await handler(request)
    
    // Apply compression for responses > 1KB
    if (response.body && response.body.length > 1024) {
      const compressed = await compress(response.body)
      
      return new NextResponse(compressed, {
        ...response,
        headers: {
          ...response.headers,
          'Content-Encoding': 'gzip',
          'Content-Length': compressed.length.toString(),
        },
      })
    }
    
    return response
  }
}

// Response caching with ETags
export function withETag(handler: Function) {
  return async (request: Request) => {
    const response = await handler(request)
    const body = await response.text()
    
    // Generate ETag
    const etag = `"${Buffer.from(body).toString('base64')}"`
    
    // Check if client has cached version
    const clientETag = request.headers.get('If-None-Match')
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    return new NextResponse(body, {
      ...response,
      headers: {
        ...response.headers,
        ETag: etag,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}

// Optimized pagination
export function paginateResults<T>(
  items: T[],
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)
  
  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: offset + limit < items.length,
      hasPrev: page > 1,
    },
  }
}
```

#### Request Optimization
```typescript
// lib/api/requestOptimization.ts
import { LRUCache } from 'lru-cache'

// Request deduplication
class RequestDeduplicator {
  private cache = new LRUCache<string, Promise<any>>({
    max: 1000,
    ttl: 30000, // 30 seconds
  })

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    let promise = this.cache.get(key)
    
    if (!promise) {
      promise = fn().catch(error => {
        // Remove failed requests from cache
        this.cache.delete(key)
        throw error
      })
      
      this.cache.set(key, promise)
    }
    
    return promise
  }
}

export const requestDeduplicator = new RequestDeduplicator()

// Usage in API routes
export async function GET(request: Request) {
  const url = new URL(request.url)
  const cacheKey = `posts:${url.searchParams.toString()}`
  
  return requestDeduplicator.dedupe(cacheKey, async () => {
    const posts = await fetchPosts(url.searchParams)
    return NextResponse.json(posts)
  })
}
```

### 🔄 Caching Strategies

#### Multi-Layer Caching
```typescript
// lib/cache/multiLayer.ts
interface CacheLayer {
  get(key: string): Promise<any>
  set(key: string, value: any, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}

class MultiLayerCache {
  private layers: CacheLayer[]

  constructor(layers: CacheLayer[]) {
    this.layers = layers
  }

  async get(key: string): Promise<any> {
    for (let i = 0; i < this.layers.length; i++) {
      const value = await this.layers[i].get(key)
      
      if (value !== null) {
        // Backfill faster layers
        for (let j = 0; j < i; j++) {
          await this.layers[j].set(key, value)
        }
        
        return value
      }
    }
    
    return null
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Set in all layers
    await Promise.all(
      this.layers.map(layer => layer.set(key, value, ttl))
    )
  }

  async delete(key: string): Promise<void> {
    await Promise.all(
      this.layers.map(layer => layer.delete(key))
    )
  }
}

// Cache implementation
const memoryCache = new MemoryCache({ max: 1000 })
const redisCache = new RedisCache(redisClient)
const cache = new MultiLayerCache([memoryCache, redisCache])

// Cache decorator
function cached(ttl: number = 3600) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`
      
      let result = await cache.get(cacheKey)
      if (result === null) {
        result = await originalMethod.apply(this, args)
        await cache.set(cacheKey, result, ttl)
      }
      
      return result
    }
    
    return descriptor
  }
}

// Usage
class PostService {
  @cached(3600) // Cache for 1 hour
  async getPopularPosts(category?: string): Promise<Post[]> {
    return db.post.findMany({
      where: { category, published: true },
      orderBy: { views: 'desc' },
      take: 10,
    })
  }
}
```

---

## Database Performance

### 🗄️ Query Optimization

#### Index Strategy
```sql
-- Core indexes for blog platform
CREATE INDEX CONCURRENTLY idx_posts_published_created 
ON posts(published, created_at DESC) 
WHERE published = true;

CREATE INDEX CONCURRENTLY idx_posts_category_published 
ON posts(category, published, created_at DESC) 
WHERE published = true;

CREATE INDEX CONCURRENTLY idx_posts_author_published 
ON posts(author_id, published, created_at DESC) 
WHERE published = true;

CREATE INDEX CONCURRENTLY idx_posts_slug 
ON posts(slug) 
WHERE published = true;

-- Full-text search index
CREATE INDEX CONCURRENTLY idx_posts_search 
ON posts USING GIN(to_tsvector('english', title || ' ' || content)) 
WHERE published = true;

-- Comments indexes
CREATE INDEX CONCURRENTLY idx_comments_post_status 
ON comments(post_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_comments_user_created 
ON comments(user_id, created_at DESC);

-- User activity indexes
CREATE INDEX CONCURRENTLY idx_user_sessions_user_expires 
ON user_sessions(user_id, expires_at) 
WHERE expires_at > NOW();

-- Partial indexes for frequently queried subsets
CREATE INDEX CONCURRENTLY idx_posts_featured 
ON posts(created_at DESC) 
WHERE featured = true AND published = true;

CREATE INDEX CONCURRENTLY idx_posts_trending 
ON posts(views, created_at DESC) 
WHERE published = true AND created_at > NOW() - INTERVAL '30 days';
```

#### Query Optimization
```typescript
// lib/database/optimizedQueries.ts
import { Prisma } from '@prisma/client'

// Optimized post queries with select fields
export const PostSelectors = {
  list: {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    featuredImage: true,
    createdAt: true,
    category: true,
    author: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
    _count: {
      select: {
        comments: true,
        likes: true,
      },
    },
  },
  
  detail: {
    id: true,
    title: true,
    content: true,
    slug: true,
    excerpt: true,
    featuredImage: true,
    createdAt: true,
    updatedAt: true,
    category: true,
    tags: true,
    seo: true,
    author: {
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
      },
    },
  },
} as const

// Optimized pagination query
export async function getPaginatedPosts({
  page = 1,
  limit = 10,
  category,
  author,
  search,
}: {
  page?: number
  limit?: number
  category?: string
  author?: string
  search?: string
}) {
  const offset = (page - 1) * limit
  
  // Build where clause
  const where: Prisma.PostWhereInput = {
    published: true,
    ...(category && { category }),
    ...(author && { authorId: author }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ],
    }),
  }

  // Execute queries in parallel
  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      select: PostSelectors.list,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.post.count({ where }),
  ])

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    },
  }
}

// Batch loading for N+1 prevention
export async function getPostsWithAuthors(postIds: string[]) {
  const posts = await db.post.findMany({
    where: { id: { in: postIds } },
    select: PostSelectors.list,
  })

  // Group by author to minimize queries
  const authorIds = [...new Set(posts.map(post => post.author.id))]
  const authors = await db.user.findMany({
    where: { id: { in: authorIds } },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
    },
  })

  // Map authors to posts
  const authorMap = new Map(authors.map(author => [author.id, author]))
  
  return posts.map(post => ({
    ...post,
    author: authorMap.get(post.author.id),
  }))
}
```

#### Connection Pooling
```typescript
// lib/database/pool.ts
import { Pool } from 'pg'

class DatabasePool {
  private pool: Pool
  private readonly maxConnections = 20
  private readonly idleTimeout = 30000
  private readonly connectionTimeout = 10000

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: this.maxConnections,
      idleTimeoutMillis: this.idleTimeout,
      connectionTimeoutMillis: this.connectionTimeout,
      statement_timeout: 5000,
      query_timeout: 10000,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.pool.on('connect', (client) => {
      console.log('Database client connected')
    })

    this.pool.on('error', (err, client) => {
      console.error('Database connection error:', err)
    })

    this.pool.on('remove', (client) => {
      console.log('Database client removed')
    })
  }

  async query(text: string, params?: any[]) {
    const start = Date.now()
    
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      if (duration > 1000) {
        console.warn(`Slow query detected: ${duration}ms`, { text, params })
      }
      
      return result
    } catch (error) {
      console.error('Query error:', error, { text, params })
      throw error
    }
  }

  async getClient() {
    return this.pool.connect()
  }

  async end() {
    await this.pool.end()
  }

  getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    }
  }
}

export const dbPool = new DatabasePool()
```

---

## CDN & Caching Strategies

### 🌐 Content Delivery Network

#### CDN Configuration
```typescript
// lib/cdn/configuration.ts
interface CDNConfig {
  providers: {
    images: 'cloudinary' | 'imagekit' | 'aws-cloudfront'
    static: 'vercel' | 'cloudflare' | 'aws-cloudfront'
    api: 'cloudflare' | 'fastly'
  }
  cacheHeaders: {
    images: 'public, max-age=31536000, immutable'
    static: 'public, max-age=31536000, immutable'
    api: 'public, max-age=3600, stale-while-revalidate=86400'
    html: 'public, max-age=0, must-revalidate'
  }
  compression: {
    gzip: boolean
    brotli: boolean
  }
  optimization: {
    minification: boolean
    bundling: boolean
    imageOptimization: boolean
  }
}

// Image CDN optimization
export function optimizeImageUrl(
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'avif'
    crop?: 'fill' | 'fit' | 'crop'
  } = {}
): string {
  const {
    width,
    height,
    quality = 85,
    format = 'auto',
    crop = 'fill'
  } = options

  // Cloudinary URL transformation
  if (src.includes('cloudinary.com')) {
    const transformations = [
      format === 'auto' ? 'f_auto' : `f_${format}`,
      `q_${quality}`,
      width && `w_${width}`,
      height && `h_${height}`,
      crop && `c_${crop}`,
    ].filter(Boolean).join(',')

    return src.replace('/upload/', `/upload/${transformations}/`)
  }

  return src
}
```

#### Cache Invalidation Strategy
```typescript
// lib/cache/invalidation.ts
class CacheInvalidator {
  private cdnKeys: string[]
  private redisClient: Redis

  constructor(cdnKeys: string[], redisClient: Redis) {
    this.cdnKeys = cdnKeys
    this.redisClient = redisClient
  }

  async invalidatePost(postId: string) {
    const patterns = [
      `/posts/${postId}*`,
      `/api/posts/${postId}*`,
      `/category/*`,
      `/author/*`,
      `/sitemap.xml`,
      `/feed.xml`,
    ]

    await Promise.all([
      this.invalidateCDN(patterns),
      this.invalidateRedis([
        `post:${postId}`,
        `posts:*`,
        `popular:*`,
        `recent:*`,
      ]),
    ])
  }

  async invalidateCategory(category: string) {
    const patterns = [
      `/category/${category}*`,
      `/api/posts?category=${category}*`,
      `/sitemap.xml`,
    ]

    await Promise.all([
      this.invalidateCDN(patterns),
      this.invalidateRedis([
        `category:${category}:*`,
        `posts:category:${category}:*`,
      ]),
    ])
  }

  private async invalidateCDN(patterns: string[]) {
    // Implement CDN-specific invalidation
    for (const key of this.cdnKeys) {
      try {
        await this.callCDNInvalidation(key, patterns)
      } catch (error) {
        console.error(`CDN invalidation failed for ${key}:`, error)
      }
    }
  }

  private async invalidateRedis(patterns: string[]) {
    for (const pattern of patterns) {
      const keys = await this.redisClient.keys(pattern)
      if (keys.length > 0) {
        await this.redisClient.del(...keys)
      }
    }
  }
}
```

### 🔄 Cache-First Architecture

#### Service Worker Implementation
```typescript
// public/sw.js - Service Worker for offline caching
const CACHE_NAME = 'hayah-ai-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map(name => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Cache strategy for different request types
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // Network first for API calls
      event.respondWith(networkFirst(request))
    } else if (url.pathname.includes('/_next/static/')) {
      // Cache first for static assets
      event.respondWith(cacheFirst(request))
    } else {
      // Stale while revalidate for pages
      event.respondWith(staleWhileRevalidate(request))
    }
  }
})

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  })
  
  return cachedResponse || fetchPromise
}
```

---

## Monitoring & Profiling

### 📊 Performance Monitoring Dashboard

#### Metrics Collection
```typescript
// lib/monitoring/collector.ts
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags: Record<string, string>
}

class MetricsCollector {
  private metrics: PerformanceMetric[] = []
  private batchSize = 100
  private flushInterval = 30000

  constructor() {
    this.startBatchFlush()
  }

  record(name: string, value: number, tags: Record<string, string> = {}) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags: {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        ...tags,
      },
    })

    if (this.metrics.length >= this.batchSize) {
      this.flush()
    }
  }

  private async flush() {
    if (this.metrics.length === 0) return

    const batch = this.metrics.splice(0, this.batchSize)
    
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: batch }),
      })
    } catch (error) {
      console.error('Failed to send metrics:', error)
      // Re-queue metrics for retry
      this.metrics.unshift(...batch)
    }
  }

  private startBatchFlush() {
    setInterval(() => this.flush(), this.flushInterval)
  }
}

export const metricsCollector = new MetricsCollector()

// Performance timing wrapper
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
): Promise<T> | T {
  const start = performance.now()
  
  const finish = (result: T) => {
    const duration = performance.now() - start
    metricsCollector.record(`${name}.duration`, duration, tags)
    return result
  }

  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result.then(finish).catch(error => {
        metricsCollector.record(`${name}.error`, 1, tags)
        throw error
      })
    }
    
    return finish(result)
  } catch (error) {
    metricsCollector.record(`${name}.error`, 1, tags)
    throw error
  }
}
```

#### Real-time Performance Dashboard
```typescript
// components/admin/PerformanceDashboard.tsx
import { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

interface PerformanceData {
  responseTime: number[]
  errorRate: number
  throughput: number
  activeUsers: number
  memoryUsage: number
  cpuUsage: number
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/performance')
        const performanceData = await response.json()
        
        setData(performanceData)
        
        // Check for performance alerts
        const newAlerts = []
        if (performanceData.responseTime[performanceData.responseTime.length - 1] > 2000) {
          newAlerts.push('High response time detected')
        }
        if (performanceData.errorRate > 0.05) {
          newAlerts.push('Error rate above threshold')
        }
        if (performanceData.memoryUsage > 0.85) {
          newAlerts.push('High memory usage')
        }
        
        setAlerts(newAlerts)
      } catch (error) {
        console.error('Failed to fetch performance data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return <div>Loading performance data...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Performance Alerts</h3>
          <ul className="space-y-1">
            {alerts.map((alert, index) => (
              <li key={index} className="text-red-700 text-sm">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Response Time Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Response Time</h3>
        <Line
          data={{
            labels: data.responseTime.map((_, i) => `${i}m ago`),
            datasets: [{
              label: 'Response Time (ms)',
              data: data.responseTime,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }],
          }}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Milliseconds'
                }
              }
            }
          }}
        />
      </div>

      {/* System Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">System Usage</h3>
        <Doughnut
          data={{
            labels: ['Memory', 'CPU', 'Available'],
            datasets: [{
              data: [
                data.memoryUsage * 100,
                data.cpuUsage * 100,
                100 - (data.memoryUsage + data.cpuUsage) * 50
              ],
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(34, 197, 94, 0.8)',
              ],
            }],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          }}
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="space-y-4">
        <MetricCard
          title="Error Rate"
          value={`${(data.errorRate * 100).toFixed(2)}%`}
          trend={data.errorRate < 0.01 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Throughput"
          value={`${data.throughput} req/s`}
          trend="neutral"
        />
        <MetricCard
          title="Active Users"
          value={data.activeUsers.toString()}
          trend="good"
        />
      </div>
    </div>
  )
}

function MetricCard({ title, value, trend }: {
  title: string
  value: string
  trend: 'good' | 'warning' | 'danger' | 'neutral'
}) {
  const colors = {
    good: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    neutral: 'bg-gray-50 text-gray-800 border-gray-200',
  }

  return (
    <div className={`p-4 rounded-lg border ${colors[trend]}`}>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
```

---

## Performance Testing

### 🧪 Load Testing Configuration

#### Artillery Load Testing
```yaml
# performance/load-test.yml
config:
  target: 'https://hayah-ai.com'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 5
      name: "Warm-up"
    
    # Ramp-up phase
    - duration: 300
      arrivalRate: 5
      rampTo: 50
      name: "Ramp-up"
    
    # Peak load phase
    - duration: 600
      arrivalRate: 50
      name: "Peak load"
    
    # Ramp-down phase
    - duration: 300
      arrivalRate: 50
      rampTo: 5
      name: "Ramp-down"

  payload:
    path: "./test-data.csv"
    fields:
      - "postId"
      - "category"
      - "searchTerm"

  plugins:
    metrics-by-endpoint:
      useOnlyRequestNames: true

scenarios:
  # Homepage browsing
  - name: "Browse Homepage"
    weight: 40
    flow:
      - get:
          url: "/"
          name: "Homepage"
      - think: 3
      - get:
          url: "/api/posts?limit=10"
          name: "Recent Posts API"
      - think: 2

  # Blog post reading
  - name: "Read Blog Post"
    weight: 30
    flow:
      - get:
          url: "/posts/{{ postId }}"
          name: "Blog Post"
      - think: 30
      - get:
          url: "/api/posts/{{ postId }}/comments"
          name: "Comments API"
      - think: 5

  # Category browsing
  - name: "Browse Category"
    weight: 20
    flow:
      - get:
          url: "/category/{{ category }}"
          name: "Category Page"
      - think: 5
      - get:
          url: "/api/posts?category={{ category }}&page=2"
          name: "Category Posts API"
      - think: 3

  # Search functionality
  - name: "Search Content"
    weight: 10
    flow:
      - get:
          url: "/search?q={{ searchTerm }}"
          name: "Search Page"
      - think: 2
      - get:
          url: "/api/search?q={{ searchTerm }}&limit=20"
          name: "Search API"
      - think: 10
```

#### Performance Test Automation
```typescript
// scripts/performance-test.ts
import { spawn } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'

interface PerformanceTestConfig {
  target: string
  scenarios: string[]
  duration: number
  maxUsers: number
  thresholds: {
    responseTime: number
    errorRate: number
    throughput: number
  }
}

class PerformanceTester {
  private config: PerformanceTestConfig

  constructor(config: PerformanceTestConfig) {
    this.config = config
  }

  async runLoadTest(): Promise<PerformanceReport> {
    console.log('Starting load test...')
    
    // Generate test data
    await this.generateTestData()
    
    // Run Artillery test
    const results = await this.runArtillery()
    
    // Analyze results
    const report = this.analyzeResults(results)
    
    // Generate report
    await this.generateReport(report)
    
    return report
  }

  private async generateTestData() {
    // Generate test data CSV
    const testData = []
    
    // Sample post IDs
    const postIds = await this.getPostIds()
    const categories = ['technology', 'travel', 'personal']
    const searchTerms = ['react', 'javascript', 'travel', 'ai', 'programming']
    
    for (let i = 0; i < 1000; i++) {
      testData.push([
        postIds[Math.floor(Math.random() * postIds.length)],
        categories[Math.floor(Math.random() * categories.length)],
        searchTerms[Math.floor(Math.random() * searchTerms.length)]
      ].join(','))
    }
    
    writeFileSync('./performance/test-data.csv', 
      'postId,category,searchTerm\n' + testData.join('\n')
    )
  }

  private async runArtillery(): Promise<any> {
    return new Promise((resolve, reject) => {
      const artillery = spawn('artillery', [
        'run',
        '--output',
        './performance/results.json',
        './performance/load-test.yml'
      ])

      artillery.stdout.on('data', (data) => {
        console.log(data.toString())
      })

      artillery.stderr.on('data', (data) => {
        console.error(data.toString())
      })

      artillery.on('close', (code) => {
        if (code === 0) {
          const results = JSON.parse(
            readFileSync('./performance/results.json', 'utf8')
          )
          resolve(results)
        } else {
          reject(new Error(`Artillery exited with code ${code}`))
        }
      })
    })
  }

  private analyzeResults(results: any): PerformanceReport {
    const aggregate = results.aggregate
    
    return {
      summary: {
        scenariosLaunched: aggregate.scenariosLaunched,
        scenariosCompleted: aggregate.scenariosCompleted,
        requestsCompleted: aggregate.requestsCompleted,
        requestsFailed: aggregate.errors,
        codes: aggregate.codes,
      },
      performance: {
        responseTime: {
          min: aggregate.latency.min,
          max: aggregate.latency.max,
          median: aggregate.latency.median,
          p95: aggregate.latency.p95,
          p99: aggregate.latency.p99,
        },
        throughput: aggregate.rps.mean,
        errorRate: (aggregate.errors / aggregate.requestsCompleted) * 100,
      },
      thresholds: this.evaluateThresholds(aggregate),
      recommendations: this.generateRecommendations(aggregate),
    }
  }

  private evaluateThresholds(aggregate: any): ThresholdResult[] {
    const results: ThresholdResult[] = []
    
    // Response time threshold
    const responseTimePassed = aggregate.latency.p95 < this.config.thresholds.responseTime
    results.push({
      metric: 'Response Time (P95)',
      value: aggregate.latency.p95,
      threshold: this.config.thresholds.responseTime,
      passed: responseTimePassed,
    })
    
    // Error rate threshold
    const errorRate = (aggregate.errors / aggregate.requestsCompleted) * 100
    const errorRatePassed = errorRate < this.config.thresholds.errorRate
    results.push({
      metric: 'Error Rate',
      value: errorRate,
      threshold: this.config.thresholds.errorRate,
      passed: errorRatePassed,
    })
    
    // Throughput threshold
    const throughputPassed = aggregate.rps.mean > this.config.thresholds.throughput
    results.push({
      metric: 'Throughput',
      value: aggregate.rps.mean,
      threshold: this.config.thresholds.throughput,
      passed: throughputPassed,
    })
    
    return results
  }

  private generateRecommendations(aggregate: any): string[] {
    const recommendations = []
    
    if (aggregate.latency.p95 > 2000) {
      recommendations.push('Consider optimizing slow endpoints')
    }
    
    if (aggregate.errors / aggregate.requestsCompleted > 0.01) {
      recommendations.push('Investigate and fix error sources')
    }
    
    if (aggregate.rps.mean < 100) {
      recommendations.push('Consider scaling infrastructure')
    }
    
    return recommendations
  }
}

// Usage
const tester = new PerformanceTester({
  target: 'https://hayah-ai.com',
  scenarios: ['browse', 'read', 'search'],
  duration: 600,
  maxUsers: 100,
  thresholds: {
    responseTime: 2000,
    errorRate: 1,
    throughput: 50,
  },
})

tester.runLoadTest().then(report => {
  console.log('Performance test completed:', report)
}).catch(error => {
  console.error('Performance test failed:', error)
})
```

---

## Optimization Checklist

### ✅ Performance Optimization Checklist

#### Frontend Optimization
- [ ] **Code Splitting**: Implement route-based and component-based code splitting
- [ ] **Tree Shaking**: Remove unused code from bundles
- [ ] **Image Optimization**: Implement next/image with proper sizing and formats
- [ ] **Font Optimization**: Use font-display: swap and preload critical fonts
- [ ] **CSS Optimization**: Extract critical CSS and defer non-critical styles
- [ ] **JavaScript Optimization**: Minimize and compress JavaScript bundles
- [ ] **Service Worker**: Implement caching strategies for offline support
- [ ] **Preloading**: Preload critical resources and next-page navigation
- [ ] **Lazy Loading**: Implement lazy loading for images and components
- [ ] **Virtual Scrolling**: Use virtual scrolling for large lists

#### Backend Optimization
- [ ] **API Response Optimization**: Implement compression and caching headers
- [ ] **Database Query Optimization**: Add indexes and optimize N+1 queries
- [ ] **Caching Strategy**: Implement multi-layer caching (memory, Redis, CDN)
- [ ] **Connection Pooling**: Configure optimal database connection pools
- [ ] **Request Deduplication**: Prevent duplicate API requests
- [ ] **Background Jobs**: Move heavy processing to background tasks
- [ ] **Rate Limiting**: Implement API rate limiting and throttling
- [ ] **Error Handling**: Graceful degradation and error recovery
- [ ] **Monitoring**: Real-time performance monitoring and alerting
- [ ] **Load Balancing**: Distribute traffic across multiple instances

#### Infrastructure Optimization
- [ ] **CDN Configuration**: Optimize CDN settings for global distribution
- [ ] **Server Configuration**: Tune server settings for optimal performance
- [ ] **Database Tuning**: Optimize database configuration and maintenance
- [ ] **Caching Layers**: Implement multiple caching layers (L1, L2, L3)
- [ ] **Compression**: Enable gzip/brotli compression for all assets
- [ ] **HTTP/2**: Enable HTTP/2 for faster multiplexed connections
- [ ] **Security Headers**: Implement security headers without performance impact
- [ ] **Monitoring Tools**: Deploy comprehensive monitoring and alerting
- [ ] **Backup Strategy**: Automated backups with minimal performance impact
- [ ] **Disaster Recovery**: Quick recovery procedures for outages

### 📊 Performance Monitoring KPIs

#### User Experience Metrics
```typescript
interface UXMetrics {
  coreWebVitals: {
    LCP: number        // < 2.5s
    FID: number        // < 100ms
    CLS: number        // < 0.1
  }
  userJourney: {
    bounceRate: number      // < 40%
    sessionDuration: number // > 2 minutes
    pageViews: number      // > 2 pages
  }
  conversion: {
    signupRate: number     // Track goal completion
    engagementRate: number // Comments, likes, shares
  }
}
```

#### Technical Performance Metrics
```typescript
interface TechnicalMetrics {
  server: {
    responseTime: number    // < 200ms
    throughput: number      // requests/second
    errorRate: number       // < 1%
    uptime: number         // > 99.9%
  }
  database: {
    queryTime: number      // < 100ms
    connectionPool: number // utilization < 80%
    cacheHitRate: number   // > 95%
  }
  infrastructure: {
    cpuUsage: number       // < 80%
    memoryUsage: number    // < 80%
    diskUsage: number      // < 85%
    networkLatency: number // < 100ms
  }
}
```

This comprehensive performance optimization guide provides detailed strategies for maximizing the Hayah-AI blog platform's speed, efficiency, and user experience across all layers of the application stack.
