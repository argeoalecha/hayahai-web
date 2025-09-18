// app/api/posts/route.ts - Bulletproof post management
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db, withTransaction } from '@/lib/database/client'
import { postSchema, searchSchema } from '@/lib/validations/post'
import { slugify, calculateReadTime, generateExcerpt } from '@/lib/utils'
import { z } from 'zod'
import { rateLimitConfigs } from '@/lib/utils/rate-limit'

// GET /api/posts - List posts with comprehensive error handling
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    await rateLimitConfigs.api.check(request, 10, 'POSTS_LIST')

    const { searchParams } = new URL(request.url)

    // Validate and parse query parameters
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = searchSchema.parse({
      ...params,
      page: params.page ? parseInt(params.page) : 1,
      limit: Math.min(parseInt(params.limit || '12'), 50), // Cap at 50
      published: params.published === 'true',
      featured: params.featured === 'true',
      tags: params.tags ? params.tags.split(',').slice(0, 10) : undefined, // Limit tags
    })

    // Build safe database query
    const where: any = {
      deletedAt: null, // Always exclude soft-deleted
    }

    // Apply filters safely
    if (validatedParams.published !== undefined) {
      where.published = validatedParams.published
    }

    if (validatedParams.category) {
      where.category = validatedParams.category
    }

    if (validatedParams.featured !== undefined) {
      where.featured = validatedParams.featured
    }

    if (validatedParams.query) {
      // Sanitize search query
      const sanitizedQuery = validatedParams.query.replace(/[<>]/g, '')
      where.OR = [
        { title: { contains: sanitizedQuery, mode: 'insensitive' } },
        { excerpt: { contains: sanitizedQuery, mode: 'insensitive' } },
      ]
    }

    if (validatedParams.tags && validatedParams.tags.length > 0) {
      where.tags = {
        some: {
          slug: { in: validatedParams.tags }
        }
      }
    }

    // Date range validation
    if (validatedParams.dateFrom || validatedParams.dateTo) {
      where.publishedAt = {}
      if (validatedParams.dateFrom) {
        const fromDate = new Date(validatedParams.dateFrom)
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid dateFrom format' },
            { status: 400 }
          )
        }
        where.publishedAt.gte = fromDate
      }
      if (validatedParams.dateTo) {
        const toDate = new Date(validatedParams.dateTo)
        if (isNaN(toDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid dateTo format' },
            { status: 400 }
          )
        }
        where.publishedAt.lte = toDate
      }
    }

    // Build sort options
    const orderBy: any = {}
    const sortBy = validatedParams.sortBy || 'publishedAt'
    const sortOrder = validatedParams.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit

    // Execute database queries with error handling
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy,
        skip,
        take: validatedParams.limit,
        include: {
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
      }).catch(error => {
        console.error('Database query failed:', error)
        throw new Error('Failed to fetch posts')
      }),

      db.post.count({ where }).catch(error => {
        console.error('Database count failed:', error)
        return 0 // Fallback to 0 if count fails
      })
    ])

    const result = {
      posts,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        pages: Math.ceil(total / validatedParams.limit),
        hasNext: validatedParams.page * validatedParams.limit < total,
        hasPrev: validatedParams.page > 1,
      }
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Total-Count': total.toString(),
      },
    })

  } catch (error) {
    console.error('GET /api/posts error:', error)

    // Handle different error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
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
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create post with comprehensive validation
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for post creation
    await rateLimitConfigs.api.check(request, 5, 'POSTS_CREATE')

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Authorization check
    if (!['ADMIN', 'AUTHOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body')
    })

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object' },
        { status: 400 }
      )
    }

    const validatedData = postSchema.parse(body)

    // Generate or validate slug
    const slug = validatedData.slug || slugify(validatedData.title)

    // Validate slug uniqueness
    const existingPost = await db.post.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 } // Conflict
      )
    }

    // Generate metadata
    const wordCount = validatedData.content.split(/\s+/).length
    const readTime = calculateReadTime(validatedData.content)
    const excerpt = validatedData.excerpt || generateExcerpt(validatedData.content)

    // Create post in transaction
    const post = await withTransaction(async (tx) => {
      // Handle tags
      const tagConnections = await Promise.all(
        validatedData.tags.map(async (tagName) => {
          const tagSlug = slugify(tagName)

          const tag = await tx.tag.upsert({
            where: { slug: tagSlug },
            update: {
              usageCount: { increment: 1 }
            },
            create: {
              name: tagName.trim(),
              slug: tagSlug,
              usageCount: 1,
            },
          })

          return { id: tag.id }
        })
      )

      // Create the post
      return await tx.post.create({
        data: {
          title: validatedData.title,
          slug,
          excerpt,
          content: validatedData.content,
          coverImage: validatedData.coverImage,
          published: validatedData.published,
          featured: validatedData.featured,
          category: validatedData.category,
          status: validatedData.published ? 'PUBLISHED' : 'DRAFT',
          seoTitle: validatedData.seoTitle,
          seoDescription: validatedData.seoDescription,
          seoKeywords: validatedData.seoKeywords,
          ogImage: validatedData.ogImage,
          canonicalUrl: validatedData.canonicalUrl,
          hasMap: validatedData.hasMap,
          hasTimeline: validatedData.hasTimeline,
          hasCodeBlocks: validatedData.hasCodeBlocks,
          hasGallery: validatedData.hasGallery,
          wordCount,
          readTime,
          authorId: session.user.id,
          publishedAt: validatedData.published ? new Date() : null,
          tags: {
            connect: tagConnections,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          tags: true,
          _count: {
            select: {
              comments: true
            }
          }
        }
      })
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_POST',
        resource: 'POST',
        resourceId: post.id,
        details: {
          title: post.title,
          published: post.published,
        },
      },
    }).catch(console.error) // Don't fail the request if logging fails

    return NextResponse.json(post, {
      status: 201,
      headers: {
        'Location': `/api/posts/${post.slug}`,
      },
    })

  } catch (error) {
    console.error('POST /api/posts error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }

      if (error.message.includes('Invalid JSON')) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}