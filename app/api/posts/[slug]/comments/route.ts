import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/database/client'
import { commentSchema, commentFilterSchema } from '@/lib/validations/comment'
import { z } from 'zod'
import { rateLimitConfigs } from '@/lib/utils/rate-limit'

// GET /api/posts/[slug]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await rateLimitConfigs.public.check(request, 30, 'COMMENTS_READ')

    // Find the post first
    const post = await db.post.findFirst({
      where: {
        slug: params.slug,
        deletedAt: null,
      },
      select: { id: true, published: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if post is published or user has permission
    if (!post.published) {
      const session = await getServerSession(authOptions)
      const canView = session?.user && (
        ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
      )

      if (!canView) {
        return NextResponse.json(
          { error: 'Comments not available' },
          { status: 404 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const params_obj = Object.fromEntries(searchParams.entries())

    const validatedParams = commentFilterSchema.parse({
      postId: post.id,
      ...params_obj,
      page: params_obj.page ? parseInt(params_obj.page) : 1,
      limit: Math.min(parseInt(params_obj.limit || '20'), 100),
      approved: params_obj.approved === 'false' ? false : true, // Default to approved only
      includeReplies: params_obj.includeReplies !== 'false',
      maxDepth: Math.min(parseInt(params_obj.maxDepth || '3'), 5),
    })

    const where: any = {
      postId: post.id,
      deletedAt: null,
      parentId: null, // Only top-level comments
    }

    // Apply filters
    if (validatedParams.approved !== undefined) {
      where.approved = validatedParams.approved
    }

    if (validatedParams.authorId) {
      where.authorId = validatedParams.authorId
    }

    const skip = (validatedParams.page - 1) * validatedParams.limit

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        skip,
        take: validatedParams.limit,
        orderBy: {
          [validatedParams.sortBy]: validatedParams.sortOrder
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          ...(validatedParams.includeReplies && {
            replies: {
              where: {
                approved: true,
                deletedAt: null,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              },
              orderBy: { createdAt: 'asc' },
              take: 50, // Limit replies per comment
            }
          })
        }
      }),
      db.comment.count({ where })
    ])

    const result = {
      comments,
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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })

  } catch (error) {
    console.error('GET /api/posts/[slug]/comments error:', error)

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

    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/posts/[slug]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await rateLimitConfigs.api.check(request, 5, 'COMMENTS_CREATE')

    // Find the post
    const post = await db.post.findFirst({
      where: {
        slug: params.slug,
        published: true, // Only allow comments on published posts
        deletedAt: null,
      },
      select: { id: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found or comments not available' },
        { status: 404 }
      )
    }

    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body')
    })

    // Validate comment data
    const commentData = {
      ...body,
      postId: post.id,
    }

    // Check if user is authenticated or providing required anonymous fields
    if (!session?.user) {
      if (!body.authorName || !body.authorEmail) {
        return NextResponse.json(
          { error: 'Name and email are required for anonymous comments' },
          { status: 400 }
        )
      }
    }

    const validatedData = commentSchema.parse(commentData)

    // Validate parent comment if replying
    let parentComment = null
    if (validatedData.parentId) {
      parentComment = await db.comment.findFirst({
        where: {
          id: validatedData.parentId,
          postId: post.id,
          approved: true,
          deletedAt: null,
        }
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        content: validatedData.content,
        postId: post.id,
        parentId: validatedData.parentId,
        authorId: session?.user?.id,
        authorName: session?.user ? undefined : validatedData.authorName,
        authorEmail: session?.user ? undefined : validatedData.authorEmail,
        authorUrl: validatedData.authorUrl,
        approved: session?.user ? true : false, // Auto-approve for authenticated users
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
      include: {
        author: session?.user ? {
          select: {
            id: true,
            name: true,
            image: true,
          }
        } : undefined,
      }
    })

    // Log activity for authenticated users
    if (session?.user) {
      await db.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'CREATE_COMMENT',
          resource: 'COMMENT',
          resourceId: comment.id,
          details: {
            postId: post.id,
            parentId: validatedData.parentId,
          },
        },
      }).catch(console.error)
    }

    const responseComment = {
      ...comment,
      // Don't expose sensitive data for anonymous comments
      authorEmail: undefined,
      ipAddress: undefined,
      userAgent: undefined,
    }

    return NextResponse.json(responseComment, {
      status: 201,
      headers: {
        'Location': `/api/comments/${comment.id}`,
      },
    })

  } catch (error) {
    console.error('POST /api/posts/[slug]/comments error:', error)

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

    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before commenting again.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}