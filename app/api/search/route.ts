import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/client'
import { z } from 'zod'
import { rateLimitConfigs } from '@/lib/utils/rate-limit'

// Search schema
const searchSchema = z.object({
  q: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters'),

  type: z.enum(['posts', 'comments', 'users', 'all']).default('all'),

  page: z.number().int().min(1).default(1),

  limit: z.number().int().min(1).max(50).default(10),

  filters: z.object({
    category: z.enum(['TECHNOLOGY', 'TRAVEL', 'SITES']).optional(),
    author: z.string().cuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
})

// GET /api/search - Global search
export async function GET(request: NextRequest) {
  try {
    await rateLimitConfigs.search.check(request, 30, 'SEARCH')

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = searchSchema.parse({
      ...params,
      page: params.page ? parseInt(params.page) : 1,
      limit: Math.min(parseInt(params.limit || '10'), 50),
      filters: params.filters ? JSON.parse(params.filters) : undefined,
    })

    const { q: query, type, page, limit, filters } = validatedParams
    const skip = (page - 1) * limit

    // Sanitize search query
    const sanitizedQuery = query.replace(/[<>]/g, '').trim()

    const results: any = {
      query: sanitizedQuery,
      type,
      totalResults: 0,
      took: Date.now(),
    }

    // Search posts
    if (type === 'posts' || type === 'all') {
      const postWhere: any = {
        published: true,
        deletedAt: null,
        OR: [
          { title: { contains: sanitizedQuery, mode: 'insensitive' } },
          { excerpt: { contains: sanitizedQuery, mode: 'insensitive' } },
          { content: { contains: sanitizedQuery, mode: 'insensitive' } },
        ]
      }

      // Apply filters
      if (filters?.category) {
        postWhere.category = filters.category
      }

      if (filters?.author) {
        postWhere.authorId = filters.author
      }

      if (filters?.dateFrom || filters?.dateTo) {
        postWhere.publishedAt = {}
        if (filters.dateFrom) {
          postWhere.publishedAt.gte = new Date(filters.dateFrom)
        }
        if (filters.dateTo) {
          postWhere.publishedAt.lte = new Date(filters.dateTo)
        }
      }

      const [posts, postsCount] = await Promise.all([
        db.post.findMany({
          where: postWhere,
          take: type === 'posts' ? limit : Math.min(limit, 5),
          skip: type === 'posts' ? skip : 0,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            readTime: true,
            views: true,
            likes: true,
            category: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              }
            },
            _count: {
              select: {
                comments: {
                  where: {
                    approved: true,
                    deletedAt: null,
                  }
                }
              }
            }
          }
        }),
        db.post.count({ where: postWhere })
      ])

      results.posts = posts
      results.totalResults += postsCount

      if (type === 'posts') {
        results.pagination = {
          page,
          limit,
          total: postsCount,
          pages: Math.ceil(postsCount / limit),
          hasNext: page * limit < postsCount,
          hasPrev: page > 1,
        }
      }
    }

    // Search comments
    if (type === 'comments' || type === 'all') {
      const commentWhere: any = {
        approved: true,
        deletedAt: null,
        content: { contains: sanitizedQuery, mode: 'insensitive' },
        post: {
          published: true,
          deletedAt: null,
        }
      }

      if (filters?.author) {
        commentWhere.authorId = filters.author
      }

      const [comments, commentsCount] = await Promise.all([
        db.comment.findMany({
          where: commentWhere,
          take: type === 'comments' ? limit : Math.min(limit, 3),
          skip: type === 'comments' ? skip : 0,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            authorName: true,
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
              }
            }
          }
        }),
        db.comment.count({ where: commentWhere })
      ])

      results.comments = comments
      results.totalResults += commentsCount

      if (type === 'comments') {
        results.pagination = {
          page,
          limit,
          total: commentsCount,
          pages: Math.ceil(commentsCount / limit),
          hasNext: page * limit < commentsCount,
          hasPrev: page > 1,
        }
      }
    }

    // Search users
    if (type === 'users' || type === 'all') {
      const userWhere: any = {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { bio: { contains: sanitizedQuery, mode: 'insensitive' } },
        ]
      }

      const [users, usersCount] = await Promise.all([
        db.user.findMany({
          where: userWhere,
          take: type === 'users' ? limit : Math.min(limit, 3),
          skip: type === 'users' ? skip : 0,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            role: true,
            website: true,
            twitter: true,
            github: true,
            linkedin: true,
            _count: {
              select: {
                posts: {
                  where: {
                    published: true,
                    deletedAt: null,
                  }
                }
              }
            }
          }
        }),
        db.user.count({ where: userWhere })
      ])

      results.users = users
      results.totalResults += usersCount

      if (type === 'users') {
        results.pagination = {
          page,
          limit,
          total: usersCount,
          pages: Math.ceil(usersCount / limit),
          hasNext: page * limit < usersCount,
          hasPrev: page > 1,
        }
      }
    }

    // Calculate search time
    results.took = Date.now() - results.took

    // Generate search suggestions (simple implementation)
    if (results.totalResults === 0) {
      const suggestions = await generateSearchSuggestions(sanitizedQuery)
      results.suggestions = suggestions
    }

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    console.error('GET /api/search error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

async function generateSearchSuggestions(query: string): Promise<string[]> {
  try {
    // Simple suggestion algorithm: find similar titles/tags
    const [similarPosts, popularTags] = await Promise.all([
      db.post.findMany({
        where: {
          published: true,
          deletedAt: null,
          title: {
            contains: query.substring(0, 3),
            mode: 'insensitive'
          }
        },
        select: { title: true },
        take: 3,
        orderBy: { views: 'desc' }
      }),
      db.tag.findMany({
        where: {
          name: {
            contains: query.substring(0, 3),
            mode: 'insensitive'
          }
        },
        select: { name: true },
        take: 3,
        orderBy: { usageCount: 'desc' }
      })
    ])

    const suggestions: string[] = []

    // Add similar post titles
    similarPosts.forEach(post => {
      if (suggestions.length < 5) {
        suggestions.push(post.title)
      }
    })

    // Add popular tag names
    popularTags.forEach(tag => {
      if (suggestions.length < 5) {
        suggestions.push(tag.name)
      }
    })

    return suggestions.slice(0, 5)
  } catch (error) {
    console.error('Failed to generate suggestions:', error)
    return []
  }
}