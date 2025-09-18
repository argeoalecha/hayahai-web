import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/database/client'
import { env } from '@/lib/env'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // Google OAuth provider
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    }),

    // GitHub OAuth provider
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
    }),

    // Credentials provider for email/password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        try {
          const user = await db.user.findUnique({
            where: {
              email: credentials.email.toLowerCase(),
              deletedAt: null,
              isActive: true
            }
          })

          if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials')
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error('Account temporarily locked. Please try again later.')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            // Increment login attempts
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: { increment: 1 },
                // Lock account after 5 failed attempts for 15 minutes
                lockedUntil: user.loginAttempts >= 4
                  ? new Date(Date.now() + 15 * 60 * 1000)
                  : undefined
              }
            })
            throw new Error('Invalid credentials')
          }

          // Reset login attempts on successful login
          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw error
        }
      }
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name
        session.user.email = token.email
      }

      return session
    },

    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers, ensure user exists in our database
        if (account?.provider !== 'credentials') {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user for OAuth sign-ins
            await db.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                image: user.image,
                emailVerified: new Date(),
                role: 'USER',
              }
            })
          } else if (existingUser.deletedAt || !existingUser.isActive) {
            // Prevent sign-in for deleted or inactive accounts
            return false
          }
        }

        return true
      } catch (error) {
        console.error('SignIn callback error:', error)
        return false
      }
    },
  },

  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in activity
      try {
        await db.activityLog.create({
          data: {
            userId: user.id!,
            action: 'SIGN_IN',
            resource: 'AUTH',
            details: {
              provider: account?.provider,
              isNewUser,
            },
          }
        })
      } catch (error) {
        console.error('Failed to log sign-in activity:', error)
      }
    },

    async signOut({ token }) {
      // Log sign-out activity
      if (token?.id) {
        try {
          await db.activityLog.create({
            data: {
              userId: token.id as string,
              action: 'SIGN_OUT',
              resource: 'AUTH',
              details: {},
            }
          })
        } catch (error) {
          console.error('Failed to log sign-out activity:', error)
        }
      }
    },
  },

  // Security settings
  debug: env.NODE_ENV === 'development',
  secret: env.NEXTAUTH_SECRET,
}