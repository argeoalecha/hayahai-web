import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/posts/route'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/database/client'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/database/client')
jest.mock('@/lib/utils/rate-limit')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockDb = db as jest.Mocked<typeof db>

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/posts', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/posts')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      return new NextRequest(url)
    }

    it('should return posts with default pagination', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          slug: 'test-post',
          excerpt: 'Test excerpt',
          author: { id: '1', name: 'Test Author', image: null },
          tags: [],
          _count: { comments: 0 }
        }
      ]

      mockDb.post.findMany.mockResolvedValue(mockPosts)
      mockDb.post.count.mockResolvedValue(1)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toEqual(mockPosts)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(12)
      expect(data.pagination.total).toBe(1)
    })

    it('should handle search queries correctly', async () => {
      const mockPosts = []
      mockDb.post.findMany.mockResolvedValue(mockPosts)
      mockDb.post.count.mockResolvedValue(0)

      const request = createMockRequest({ query: 'test search' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test search', mode: 'insensitive' } },
              { excerpt: { contains: 'test search', mode: 'insensitive' } }
            ]
          })
        })
      )
    })

    it('should validate pagination parameters', async () => {
      const request = createMockRequest({ page: 'invalid', limit: '1000' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid parameters')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.post.findMany.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch posts')
    })

    it('should filter by category correctly', async () => {
      const mockPosts = []
      mockDb.post.findMany.mockResolvedValue(mockPosts)
      mockDb.post.count.mockResolvedValue(0)

      const request = createMockRequest({ category: 'TECHNOLOGY' })
      const response = await GET(request)

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'TECHNOLOGY'
          })
        })
      )
    })

    it('should filter published posts by default', async () => {
      const mockPosts = []
      mockDb.post.findMany.mockResolvedValue(mockPosts)
      mockDb.post.count.mockResolvedValue(0)

      const request = createMockRequest({ published: 'true' })
      const response = await GET(request)

      expect(mockDb.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: true,
            deletedAt: null
          })
        })
      )
    })
  })

  describe('POST /api/posts', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const mockSession = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'AUTHOR'
      }
    }

    const validPostData = {
      title: 'Test Post',
      content: 'This is a test post with enough content to meet validation requirements.',
      category: 'TECHNOLOGY',
      tags: ['test', 'blog'],
      published: false
    }

    it('should create a post successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const mockCreatedPost = {
        id: 'post-1',
        title: 'Test Post',
        slug: 'test-post',
        content: validPostData.content,
        author: { id: 'user-1', name: 'Test User', image: null },
        tags: [],
        _count: { comments: 0 }
      }

      mockDb.post.findFirst.mockResolvedValue(null) // No existing post with slug
      mockDb.$transaction.mockImplementation(async (callback) => {
        return callback({
          tag: {
            upsert: jest.fn().mockResolvedValue({ id: 'tag-1' })
          },
          post: {
            create: jest.fn().mockResolvedValue(mockCreatedPost)
          }
        })
      })
      mockDb.activityLog.create.mockResolvedValue({} as any)

      const request = createMockRequest(validPostData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('Test Post')
      expect(response.headers.get('Location')).toBe('/api/posts/test-post')
    })

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createMockRequest(validPostData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should require proper authorization', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { ...mockSession.user, role: 'USER' }
      })

      const request = createMockRequest(validPostData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should validate post data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const invalidPostData = {
        title: '', // Invalid: empty title
        content: 'Short', // Invalid: too short
        category: 'INVALID' // Invalid: not in enum
      }

      const request = createMockRequest(invalidPostData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should handle slug conflicts', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockDb.post.findFirst.mockResolvedValue({ id: 'existing-post' } as any)

      const request = createMockRequest(validPostData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('A post with this slug already exists')
    })

    it('should handle invalid JSON', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })

    it('should generate slug from title when not provided', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const postDataWithoutSlug = {
        ...validPostData,
        title: 'Test Post With Special Characters!'
      }

      mockDb.post.findFirst.mockResolvedValue(null)
      mockDb.$transaction.mockImplementation(async (callback) => {
        return callback({
          tag: {
            upsert: jest.fn().mockResolvedValue({ id: 'tag-1' })
          },
          post: {
            create: jest.fn().mockImplementation((data) => {
              expect(data.data.slug).toBe('test-post-with-special-characters')
              return Promise.resolve({
                id: 'post-1',
                ...data.data,
                author: { id: 'user-1', name: 'Test User', image: null },
                tags: [],
                _count: { comments: 0 }
              })
            })
          }
        })
      })
      mockDb.activityLog.create.mockResolvedValue({} as any)

      const request = createMockRequest(postDataWithoutSlug)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should calculate word count and read time', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const longContent = 'This is a test post with enough words to calculate read time. '.repeat(50)
      const postWithLongContent = {
        ...validPostData,
        content: longContent
      }

      mockDb.post.findFirst.mockResolvedValue(null)
      mockDb.$transaction.mockImplementation(async (callback) => {
        return callback({
          tag: {
            upsert: jest.fn().mockResolvedValue({ id: 'tag-1' })
          },
          post: {
            create: jest.fn().mockImplementation((data) => {
              expect(data.data.wordCount).toBeGreaterThan(0)
              expect(data.data.readTime).toBeGreaterThan(0)
              return Promise.resolve({
                id: 'post-1',
                ...data.data,
                author: { id: 'user-1', name: 'Test User', image: null },
                tags: [],
                _count: { comments: 0 }
              })
            })
          }
        })
      })
      mockDb.activityLog.create.mockResolvedValue({} as any)

      const request = createMockRequest(postWithLongContent)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })
})