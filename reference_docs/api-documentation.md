# Hayah-AI Blog Platform API Documentation

## 📚 Table of Contents
1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [API Endpoints](#api-endpoints)
4. [Rate Limiting](#rate-limiting)
5. [Webhooks](#webhooks)
6. [SDK Examples](#sdk-examples)

---

## Authentication

### JWT Token Format
```typescript
interface JWTPayload {
  sub: string        // User ID
  email: string      // User email
  role: 'ADMIN' | 'AUTHOR' | 'USER'
  iat: number        // Issued at
  exp: number        // Expires at
  jti: string        // JWT ID for revocation
}
```

### Authentication Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-API-Version: v1
```

### Error Codes: Authentication
| Code | Status | Message | Description |
|------|--------|---------|-------------|
| `AUTH_001` | 401 | Invalid token | JWT token is malformed or expired |
| `AUTH_002` | 401 | Token expired | JWT token has exceeded expiration time |
| `AUTH_003` | 401 | Token revoked | JWT token has been blacklisted |
| `AUTH_004` | 403 | Insufficient permissions | User role lacks required permissions |
| `AUTH_005` | 401 | Missing token | Authorization header not provided |

---

## Error Handling

### Standard Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string           // Error code (e.g., "VALIDATION_001")
    message: string        // Human-readable message
    details?: string       // Technical details (dev mode only)
    field?: string         // Field name for validation errors
    timestamp: string      // ISO 8601 timestamp
    requestId: string      // Unique request identifier
    path: string          // API endpoint path
  }
  meta?: {
    retryAfter?: number   // Seconds to wait before retry
    documentation?: string // Link to relevant docs
  }
}
```

### HTTP Status Code Mapping
| Status | Usage | Common Scenarios |
|--------|-------|------------------|
| `400` | Bad Request | Validation errors, malformed JSON |
| `401` | Unauthorized | Missing/invalid authentication |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource, concurrent modification |
| `422` | Unprocessable Entity | Business logic validation failures |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server errors |
| `502` | Bad Gateway | External service failures |
| `503` | Service Unavailable | Maintenance mode, overload |

---

## API Endpoints

### Posts API

#### GET /api/posts
Retrieve blog posts with filtering and pagination.

**Query Parameters:**
```typescript
interface PostsQuery {
  page?: number          // Page number (default: 1)
  limit?: number         // Items per page (1-100, default: 10)
  category?: string      // Filter by category
  author?: string        // Filter by author ID
  published?: boolean    // Filter by published status
  search?: string        // Search in title and content
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'views'
  sortOrder?: 'asc' | 'desc'
  include?: string[]     // Relations to include: ['author', 'comments', 'tags']
}
```

**Success Response (200):**
```typescript
interface PostsResponse {
  data: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  meta: {
    took: number         // Query execution time in ms
    cached: boolean      // Whether response was cached
  }
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `POSTS_001` | 400 | Invalid pagination parameters | Use page >= 1 and limit 1-100 |
| `POSTS_002` | 400 | Invalid sort field | Use allowed sortBy values |
| `POSTS_003` | 500 | Database query failed | Retry after a moment |

#### POST /api/posts
Create a new blog post.

**Request Body:**
```typescript
interface CreatePostRequest {
  title: string                    // 1-200 characters
  content: string                  // Minimum 10 characters
  excerpt?: string                 // Maximum 500 characters
  category: 'TECHNOLOGY' | 'TRAVEL' | 'PERSONAL' | 'TUTORIAL'
  tags?: string[]                  // Maximum 10 tags
  published?: boolean              // Default: false
  scheduledAt?: string            // ISO 8601 future date
  seo?: {
    metaTitle?: string            // Maximum 60 characters
    metaDescription?: string      // Maximum 160 characters
    keywords?: string[]           // Maximum 20 keywords
  }
  featured?: boolean              // Admin only
}
```

**Success Response (201):**
```typescript
interface CreatePostResponse {
  data: Post
  meta: {
    slug: string        // Generated slug
    wordCount: number   // Content word count
    readTime: number    // Estimated read time in minutes
  }
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `POSTS_004` | 400 | Title required | Provide a title between 1-200 characters |
| `POSTS_005` | 400 | Content too short | Content must be at least 10 characters |
| `POSTS_006` | 409 | Slug already exists | Modify title or provide custom slug |
| `POSTS_007` | 422 | Invalid scheduled date | Use future date in ISO 8601 format |
| `POSTS_008` | 403 | Cannot set featured | Only admins can set featured posts |

#### PUT /api/posts/[id]
Update an existing blog post.

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `POSTS_009` | 404 | Post not found | Verify post ID exists |
| `POSTS_010` | 403 | Cannot edit post | Only author or admin can edit |
| `POSTS_011` | 409 | Post already published | Cannot modify published date |

#### DELETE /api/posts/[id]
Delete a blog post (soft delete).

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `POSTS_012` | 404 | Post not found | Verify post ID exists |
| `POSTS_013` | 403 | Cannot delete post | Only author or admin can delete |
| `POSTS_014` | 409 | Post has comments | Use force=true or delete comments first |

### Comments API

#### GET /api/posts/[id]/comments
Retrieve comments for a post.

**Query Parameters:**
```typescript
interface CommentsQuery {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'likes'
  sortOrder?: 'asc' | 'desc'
  status?: 'APPROVED' | 'PENDING' | 'REJECTED'
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `COMMENTS_001` | 404 | Post not found | Verify post ID |
| `COMMENTS_002` | 403 | Comments disabled | Post doesn't allow comments |

#### POST /api/posts/[id]/comments
Create a new comment.

**Request Body:**
```typescript
interface CreateCommentRequest {
  content: string              // 1-1000 characters
  parentId?: string           // For nested replies
  authorName?: string         // For anonymous users
  authorEmail?: string        // For anonymous users
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `COMMENTS_003` | 400 | Content required | Provide comment content |
| `COMMENTS_004` | 400 | Content too long | Maximum 1000 characters |
| `COMMENTS_005` | 404 | Parent comment not found | Verify parentId |
| `COMMENTS_006` | 403 | Comments disabled | Post doesn't allow comments |
| `COMMENTS_007` | 429 | Comment rate limit | Wait before posting again |

### Users API

#### GET /api/users/profile
Get current user profile.

**Success Response (200):**
```typescript
interface UserProfile {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AUTHOR' | 'USER'
  avatar?: string
  bio?: string
  website?: string
  social?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
  preferences: {
    emailNotifications: boolean
    theme: 'light' | 'dark' | 'auto'
    language: string
  }
  stats: {
    postsCount: number
    commentsCount: number
    likesReceived: number
  }
}
```

#### PUT /api/users/profile
Update user profile.

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `USERS_001` | 400 | Invalid email format | Use valid email address |
| `USERS_002` | 409 | Email already taken | Choose different email |
| `USERS_003` | 400 | Invalid URL format | Use valid URL for website/social |

### Search API

#### GET /api/search
Global search across posts and content.

**Query Parameters:**
```typescript
interface SearchQuery {
  q: string                    // Search query (required)
  type?: 'posts' | 'comments' | 'users' | 'all'
  page?: number
  limit?: number
  filters?: {
    category?: string
    author?: string
    dateFrom?: string
    dateTo?: string
  }
}
```

**Success Response (200):**
```typescript
interface SearchResponse {
  data: {
    posts?: SearchResult[]
    comments?: SearchResult[]
    users?: SearchResult[]
  }
  meta: {
    totalResults: number
    took: number
    query: string
    suggestions?: string[]    // Search suggestions
  }
  pagination: PaginationMeta
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `SEARCH_001` | 400 | Query required | Provide search query |
| `SEARCH_002` | 400 | Query too short | Minimum 2 characters |
| `SEARCH_003` | 400 | Query too long | Maximum 100 characters |
| `SEARCH_004` | 503 | Search service unavailable | Try again later |

### Upload API

#### POST /api/upload
Upload files (images, documents).

**Request:** Multipart form data
```typescript
interface UploadRequest {
  file: File                   // File to upload
  type: 'image' | 'document'  // File type
  alt?: string                // Alt text for images
  compress?: boolean          // Compress images
}
```

**Success Response (201):**
```typescript
interface UploadResponse {
  data: {
    id: string
    url: string
    filename: string
    size: number
    type: string
    width?: number            // For images
    height?: number           // For images
    variants?: {              // For images
      thumbnail: string
      medium: string
      large: string
    }
  }
  meta: {
    compressed: boolean
    originalSize: number
  }
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `UPLOAD_001` | 400 | No file provided | Include file in request |
| `UPLOAD_002` | 400 | File too large | Maximum 10MB |
| `UPLOAD_003` | 400 | Invalid file type | Use allowed file types |
| `UPLOAD_004` | 413 | Storage quota exceeded | Delete old files or upgrade plan |
| `UPLOAD_005` | 500 | Upload service failed | Try again later |

### Analytics API

#### GET /api/analytics/posts/[id]
Get analytics for a specific post.

**Success Response (200):**
```typescript
interface PostAnalytics {
  views: {
    total: number
    unique: number
    byDate: { date: string; views: number }[]
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    averageReadTime: number
  }
  traffic: {
    sources: { source: string; visits: number }[]
    countries: { country: string; visits: number }[]
    devices: { device: string; visits: number }[]
  }
}
```

**Error Codes:**
| Code | Status | Message | Resolution |
|------|--------|---------|------------|
| `ANALYTICS_001` | 404 | Post not found | Verify post ID |
| `ANALYTICS_002` | 403 | Analytics not available | Enable analytics for post |

---

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limit Tiers
| Endpoint Type | Limit | Window | Notes |
|---------------|-------|--------|-------|
| Authentication | 5 requests | 15 minutes | Per IP |
| Read operations | 1000 requests | 1 hour | Per user |
| Write operations | 100 requests | 1 hour | Per user |
| Upload | 20 requests | 1 hour | Per user |
| Search | 200 requests | 1 hour | Per user |

### Rate Limit Error
```typescript
interface RateLimitError {
  error: {
    code: "RATE_LIMIT_001"
    message: "Rate limit exceeded"
    retryAfter: number        // Seconds
  }
  meta: {
    limit: number
    remaining: 0
    resetTime: string
  }
}
```

---

## Webhooks

### Webhook Events
```typescript
type WebhookEvent = 
  | 'post.created'
  | 'post.updated' 
  | 'post.published'
  | 'post.deleted'
  | 'comment.created'
  | 'comment.approved'
  | 'user.registered'
  | 'user.updated'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  signature: string          // HMAC-SHA256 signature
}
```

### Webhook Configuration
```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "url": "https://your-app.com/webhook",
  "events": ["post.published", "comment.created"],
  "secret": "your-webhook-secret"
}
```

### Webhook Verification
```typescript
import crypto from 'crypto'

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = `sha256=${hmac.digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
```

---

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
import { HayahAPI } from '@hayah/api-client'

// Initialize client
const api = new HayahAPI({
  baseURL: 'https://api.hayah-ai.com',
  apiKey: 'your-api-key',
  timeout: 10000,
})

// Error handling with retry logic
try {
  const posts = await api.posts.list({
    page: 1,
    limit: 10,
    category: 'TECHNOLOGY'
  })
  
  console.log('Posts:', posts.data)
} catch (error) {
  if (error.code === 'RATE_LIMIT_001') {
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000))
    // Retry logic here
  } else if (error.status >= 500) {
    // Server error - implement exponential backoff
    console.error('Server error:', error.message)
  } else {
    // Client error - handle accordingly
    console.error('Client error:', error.message)
  }
}

// Create post with error handling
async function createPost(postData: CreatePostRequest): Promise<Post> {
  try {
    const response = await api.posts.create(postData)
    return response.data
  } catch (error) {
    if (error.code === 'POSTS_006') {
      // Slug conflict - generate new slug
      postData.title = `${postData.title} ${Date.now()}`
      return createPost(postData) // Retry with modified title
    }
    throw error
  }
}

// Upload with progress tracking
async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    api.upload.create(file, {
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`)
      },
      onError: (error) => {
        if (error.code === 'UPLOAD_002') {
          reject(new Error('File too large. Please use a file smaller than 10MB.'))
        } else {
          reject(error)
        }
      },
      onSuccess: (response) => {
        resolve(response.data.url)
      }
    })
  })
}
```

### Python SDK Example

```python
from hayah_api import HayahClient, HayahError
import time

# Initialize client
client = HayahClient(
    base_url='https://api.hayah-ai.com',
    api_key='your-api-key',
    timeout=10
)

# Error handling with retry logic
def fetch_posts_with_retry(max_retries=3):
    for attempt in range(max_retries):
        try:
            response = client.posts.list(
                page=1,
                limit=10,
                category='TECHNOLOGY'
            )
            return response.data
        except HayahError as e:
            if e.code == 'RATE_LIMIT_001':
                time.sleep(e.retry_after)
                continue
            elif e.status >= 500 and attempt < max_retries - 1:
                # Exponential backoff
                time.sleep(2 ** attempt)
                continue
            else:
                raise e

# Batch operations with error handling
def batch_create_posts(posts_data):
    results = []
    errors = []
    
    for i, post_data in enumerate(posts_data):
        try:
            result = client.posts.create(post_data)
            results.append(result.data)
        except HayahError as e:
            errors.append({
                'index': i,
                'error': e.message,
                'code': e.code
            })
    
    return results, errors
```

### Error Handling Best Practices

1. **Always handle rate limits**: Implement exponential backoff for 429 errors
2. **Retry server errors**: Use exponential backoff for 5xx errors
3. **Validate before sending**: Check data locally before API calls
4. **Log errors properly**: Include request ID and context
5. **Provide user feedback**: Show meaningful error messages
6. **Monitor error patterns**: Track error frequencies and types

This API documentation provides comprehensive error handling guidance to ensure robust integration with the Hayah-AI platform.
