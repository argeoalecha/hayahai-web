import { db } from '@/lib/database/client'
import { authOptions } from '@/lib/auth/config'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/database/client')
jest.mock('bcryptjs')

const mockDb = db as jest.Mocked<typeof db>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('Authentication Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Credentials Provider', () => {
    const credentialsProvider = authOptions.providers?.find(
      provider => provider.id === 'credentials'
    )

    it('should be configured correctly', () => {
      expect(credentialsProvider).toBeDefined()
      expect(credentialsProvider?.name).toBe('credentials')
    })

    describe('authorize function', () => {
      const authorize = credentialsProvider?.options?.authorize

      if (!authorize) {
        throw new Error('Authorize function not found')
      }

      it('should require email and password', async () => {
        const credentials = { email: '', password: '' }

        await expect(authorize(credentials)).rejects.toThrow('Email and password required')
      })

      it('should authenticate valid user', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'validPassword123'
        }

        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
          role: 'USER',
          passwordHash: 'hashedPassword',
          loginAttempts: 0,
          lockedUntil: null,
          isActive: true,
          deletedAt: null
        }

        mockDb.user.findUnique.mockResolvedValue(mockUser)
        mockBcrypt.compare.mockResolvedValue(true)
        mockDb.user.update.mockResolvedValue(mockUser)

        const result = await authorize(credentials)

        expect(result).toEqual({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
          role: 'USER'
        })

        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: expect.any(Date)
          }
        })
      })

      it('should reject invalid credentials', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'wrongPassword'
        }

        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: 'hashedPassword',
          loginAttempts: 2,
          lockedUntil: null,
          isActive: true,
          deletedAt: null
        }

        mockDb.user.findUnique.mockResolvedValue(mockUser)
        mockBcrypt.compare.mockResolvedValue(false)
        mockDb.user.update.mockResolvedValue(mockUser)

        await expect(authorize(credentials)).rejects.toThrow('Invalid credentials')

        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: {
            loginAttempts: { increment: 1 },
            lockedUntil: undefined
          }
        })
      })

      it('should lock account after 5 failed attempts', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'wrongPassword'
        }

        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: 'hashedPassword',
          loginAttempts: 4, // 5th attempt will lock
          lockedUntil: null,
          isActive: true,
          deletedAt: null
        }

        mockDb.user.findUnique.mockResolvedValue(mockUser)
        mockBcrypt.compare.mockResolvedValue(false)
        mockDb.user.update.mockResolvedValue(mockUser)

        await expect(authorize(credentials)).rejects.toThrow('Invalid credentials')

        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: {
            loginAttempts: { increment: 1 },
            lockedUntil: expect.any(Date)
          }
        })
      })

      it('should reject locked accounts', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'validPassword123'
        }

        const futureDate = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes in future
        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: 'hashedPassword',
          loginAttempts: 5,
          lockedUntil: futureDate,
          isActive: true,
          deletedAt: null
        }

        mockDb.user.findUnique.mockResolvedValue(mockUser)

        await expect(authorize(credentials))
          .rejects.toThrow('Account temporarily locked. Please try again later.')
      })

      it('should reject inactive users', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'validPassword123'
        }

        mockDb.user.findUnique.mockResolvedValue(null)

        await expect(authorize(credentials)).rejects.toThrow('Invalid credentials')
      })

      it('should reject users without password hash', async () => {
        const credentials = {
          email: 'test@example.com',
          password: 'validPassword123'
        }

        const mockUser = {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: null,
          isActive: true,
          deletedAt: null
        }

        mockDb.user.findUnique.mockResolvedValue(mockUser)

        await expect(authorize(credentials)).rejects.toThrow('Invalid credentials')
      })
    })
  })

  describe('JWT callback', () => {
    const jwtCallback = authOptions.callbacks?.jwt

    if (!jwtCallback) {
      throw new Error('JWT callback not found')
    }

    it('should set user data on initial sign in', async () => {
      const token = {}
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      }

      const result = await jwtCallback({ token, user })

      expect(result).toEqual({
        role: 'USER',
        id: 'user-1'
      })
    })

    it('should handle session updates', async () => {
      const token = { id: 'user-1', role: 'USER' }
      const session = {
        name: 'Updated Name',
        email: 'updated@example.com'
      }

      const result = await jwtCallback({
        token,
        trigger: 'update',
        session
      })

      expect(result).toEqual({
        id: 'user-1',
        role: 'USER',
        name: 'Updated Name',
        email: 'updated@example.com'
      })
    })
  })

  describe('Session callback', () => {
    const sessionCallback = authOptions.callbacks?.session

    if (!sessionCallback) {
      throw new Error('Session callback not found')
    }

    it('should populate session with token data', async () => {
      const session = {
        user: {
          id: '',
          email: '',
          name: '',
          role: ''
        }
      }

      const token = {
        id: 'user-1',
        role: 'USER',
        name: 'Test User',
        email: 'test@example.com'
      }

      const result = await sessionCallback({ session, token })

      expect(result.user).toEqual({
        id: 'user-1',
        role: 'USER',
        name: 'Test User',
        email: 'test@example.com'
      })
    })
  })

  describe('SignIn callback', () => {
    const signInCallback = authOptions.callbacks?.signIn

    if (!signInCallback) {
      throw new Error('SignIn callback not found')
    }

    it('should allow credentials provider sign in', async () => {
      const user = { id: 'user-1', email: 'test@example.com' }
      const account = { provider: 'credentials' }

      const result = await signInCallback({ user, account })

      expect(result).toBe(true)
    })

    it('should create OAuth user if not exists', async () => {
      const user = {
        id: 'oauth-user',
        email: 'oauth@example.com',
        name: 'OAuth User',
        image: 'https://example.com/avatar.jpg'
      }
      const account = { provider: 'google' }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'oauth@example.com',
        name: 'OAuth User',
        image: 'https://example.com/avatar.jpg',
        role: 'USER'
      } as any)

      const result = await signInCallback({ user, account })

      expect(result).toBe(true)
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'oauth@example.com',
          name: 'OAuth User',
          image: 'https://example.com/avatar.jpg',
          emailVerified: expect.any(Date),
          role: 'USER'
        }
      })
    })

    it('should reject deleted OAuth users', async () => {
      const user = { id: 'user-1', email: 'test@example.com' }
      const account = { provider: 'google' }

      const deletedUser = {
        id: 'user-1',
        email: 'test@example.com',
        deletedAt: new Date(),
        isActive: false
      }

      mockDb.user.findUnique.mockResolvedValue(deletedUser)

      const result = await signInCallback({ user, account })

      expect(result).toBe(false)
    })
  })
})