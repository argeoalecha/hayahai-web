import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db, withTransaction } from '@/lib/database/client'
import { updatePostSchema } from '@/lib/validations/post'
import { slugify, calculateReadTime, generateExcerpt } from '@/lib/utils'
import { z } from 'zod'
import { rateLimitConfigs } from '@/lib/utils/rate-limit'

// GET /api/posts/[slug] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await rateLimitConfigs.public.check(request, 50, 'POSTS_READ')

    const post = await db.post.findFirst({
      where: {
        slug: params.slug,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            website: true,
            twitter: true,
            github: true,
            linkedin: true,
          }
        },
        tags: true,
        comments: {
          where: {
            approved: true,
            deletedAt: null,
            parentId: null, // Only top-level comments
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
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
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        travelLocations: true,
        timelineEvents: {
          orderBy: { order: 'asc' }
        },
        codeBlocks: {
          orderBy: { order: 'asc' }
        },
        mediaGallery: {
          orderBy: { order: 'asc' }
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
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if post is published or user has permission to view drafts
    if (!post.published) {
      const session = await getServerSession(authOptions)
      const canViewDrafts = session?.user && (
        session.user.id === post.authorId ||
        ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
      )

      if (!canViewDrafts) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
    }

    // Increment view count
    await db.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    }).catch(console.error) // Don't fail request if view increment fails

    return NextResponse.json(post, {
      headers: {
        'Cache-Control': post.published
          ? 'public, s-maxage=300, stale-while-revalidate=600'
          : 'private, no-cache',
      },
    })

  } catch (error) {
    console.error('GET /api/posts/[slug] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[slug] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await rateLimitConfigs.api.check(request, 10, 'POSTS_UPDATE')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find existing post
    const existingPost = await db.post.findFirst({
      where: {
        slug: params.slug,
        deletedAt: null,
      }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canEdit = session.user.id === existingPost.authorId ||
                   ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body')
    })

    const validatedData = updatePostSchema.parse({
      ...body,
      id: existingPost.id
    })

    // Handle slug change
    let newSlug = existingPost.slug
    if (validatedData.title && validatedData.title !== existingPost.title) {
      newSlug = validatedData.slug || slugify(validatedData.title)

      // Check slug uniqueness if changed
      if (newSlug !== existingPost.slug) {
        const slugExists = await db.post.findFirst({
          where: {
            slug: newSlug,
            id: { not: existingPost.id },
            deletedAt: null,
          }
        })

        if (slugExists) {
          return NextResponse.json(
            { error: 'A post with this slug already exists' },
            { status: 409 }
          )
        }
      }
    }

    // Calculate new metadata if content changed
    let wordCount = existingPost.wordCount
    let readTime = existingPost.readTime
    let excerpt = existingPost.excerpt

    if (validatedData.content) {
      wordCount = validatedData.content.split(/\s+/).length
      readTime = calculateReadTime(validatedData.content)
      excerpt = validatedData.excerpt || generateExcerpt(validatedData.content)
    }

    // Update post in transaction
    const updatedPost = await withTransaction(async (tx) => {
      // Handle tag updates
      let tagConnections
      if (validatedData.tags) {
        tagConnections = await Promise.all(
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
      }

      // Update the post
      return await tx.post.update({
        where: { id: existingPost.id },
        data: {
          ...(validatedData.title && { title: validatedData.title }),
          ...(newSlug !== existingPost.slug && { slug: newSlug }),
          ...(validatedData.content && { content: validatedData.content }),
          ...(excerpt !== existingPost.excerpt && { excerpt }),
          ...(validatedData.coverImage !== undefined && { coverImage: validatedData.coverImage }),
          ...(validatedData.published !== undefined && {
            published: validatedData.published,
            publishedAt: validatedData.published && !existingPost.published ? new Date() : existingPost.publishedAt
          }),
          ...(validatedData.featured !== undefined && { featured: validatedData.featured }),
          ...(validatedData.category && { category: validatedData.category }),
          ...(validatedData.seoTitle !== undefined && { seoTitle: validatedData.seoTitle }),
          ...(validatedData.seoDescription !== undefined && { seoDescription: validatedData.seoDescription }),
          ...(validatedData.seoKeywords && { seoKeywords: validatedData.seoKeywords }),
          ...(validatedData.ogImage !== undefined && { ogImage: validatedData.ogImage }),
          ...(validatedData.canonicalUrl !== undefined && { canonicalUrl: validatedData.canonicalUrl }),
          ...(validatedData.hasMap !== undefined && { hasMap: validatedData.hasMap }),
          ...(validatedData.hasTimeline !== undefined && { hasTimeline: validatedData.hasTimeline }),
          ...(validatedData.hasCodeBlocks !== undefined && { hasCodeBlocks: validatedData.hasCodeBlocks }),
          ...(validatedData.hasGallery !== undefined && { hasGallery: validatedData.hasGallery }),
          wordCount,
          readTime,
          ...(tagConnections && {
            tags: {
              set: tagConnections,
            }
          }),
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
        action: 'UPDATE_POST',
        resource: 'POST',
        resourceId: updatedPost.id,
        details: {
          title: updatedPost.title,
          changes: Object.keys(validatedData),
        },
      },
    }).catch(console.error)

    return NextResponse.json(updatedPost)

  } catch (error) {
    console.error('PUT /api/posts/[slug] error:', error)

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

    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[slug] - Soft delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await rateLimitConfigs.api.check(request, 5, 'POSTS_DELETE')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const post = await db.post.findFirst({
      where: {
        slug: params.slug,
        deletedAt: null,
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canDelete = session.user.id === post.authorId ||
                     ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Soft delete the post
    await db.post.update({
      where: { id: post.id },
      data: { deletedAt: new Date() }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_POST',
        resource: 'POST',
        resourceId: post.id,
        details: {
          title: post.title,
        },
      },
    }).catch(console.error)

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('DELETE /api/posts/[slug] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}