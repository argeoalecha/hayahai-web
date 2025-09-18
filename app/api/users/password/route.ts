import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/database/client'
import { passwordChangeSchema } from '@/lib/validations/user'
import { z } from 'zod'
import { rateLimitConfigs } from '@/lib/utils/rate-limit'
import bcrypt from 'bcryptjs'

// PUT /api/users/password - Change user password
export async function PUT(request: NextRequest) {
  try {
    await rateLimitConfigs.auth.check(request, 3, 'PASSWORD_CHANGE')

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

    const validatedData = passwordChangeSchema.parse(body)

    // Get current user with password hash
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        passwordHash: true,
      }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'User not found or no password set' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.passwordHash
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(validatedData.newPassword, saltRounds)

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        // Reset login attempts on password change
        loginAttempts: 0,
        lockedUntil: null,
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CHANGE_PASSWORD',
        resource: 'USER',
        resourceId: session.user.id,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(console.error)

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('PUT /api/users/password error:', error)

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
        { error: 'Too many password change attempts. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}