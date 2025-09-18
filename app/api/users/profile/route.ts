import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/database/client'
import { userProfileSchema, passwordChangeSchema } from '@/lib/validations/user'
import { z } from 'zod'
import { rateLimitConfigs } from '@/lib/utils/rate-limit'
import bcrypt from 'bcryptjs'

// GET /api/users/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    await rateLimitConfigs.api.check(request, 30, 'USER_PROFILE_READ')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        website: true,
        twitter: true,
        github: true,
        linkedin: true,
        emailNotifications: true,
        theme: true,
        language: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        _count: {
          select: {
            posts: {
              where: {
                published: true,
                deletedAt: null,
              }
            },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate additional stats
    const [totalViews, totalLikes] = await Promise.all([
      db.post.aggregate({
        where: {
          authorId: user.id,
          published: true,
          deletedAt: null,
        },
        _sum: { views: true }
      }),
      db.post.aggregate({
        where: {
          authorId: user.id,
          published: true,
          deletedAt: null,
        },
        _sum: { likes: true }
      })
    ])

    const userProfile = {
      ...user,
      stats: {
        postsCount: user._count.posts,
        commentsCount: user._count.comments,
        totalViews: totalViews._sum.views || 0,
        totalLikes: totalLikes._sum.likes || 0,
      }
    }

    // Remove _count from response
    delete (userProfile as any)._count

    return NextResponse.json(userProfile, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    })

  } catch (error) {
    console.error('GET /api/users/profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await rateLimitConfigs.api.check(request, 10, 'USER_PROFILE_UPDATE')

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body')
    })

    const validatedData = userProfileSchema.parse(body)

    // Check if email is being changed and if it's already taken
    if (validatedData.name !== session.user.name) {
      // For email changes, we might want additional verification
      // This is just updating the profile fields for now
    }

    const updatedUser = await db.user.update({
      where: {
        id: session.user.id,
        deletedAt: null,
        isActive: true,
      },
      data: {
        name: validatedData.name,
        bio: validatedData.bio,
        website: validatedData.website,
        twitter: validatedData.twitter,
        github: validatedData.github,
        linkedin: validatedData.linkedin,
        emailNotifications: validatedData.emailNotifications,
        theme: validatedData.theme,
        language: validatedData.language,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        website: true,
        twitter: true,
        github: true,
        linkedin: true,
        emailNotifications: true,
        theme: true,
        language: true,
        updatedAt: true,
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_PROFILE',
        resource: 'USER',
        resourceId: session.user.id,
        details: {
          changes: Object.keys(validatedData),
        },
      },
    }).catch(console.error)

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('PUT /api/users/profile error:', error)

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

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}